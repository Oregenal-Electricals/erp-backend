import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { isTestSessionActive } from '../common/context/test-session.context';

// Client-property names (Prisma's standard camelCase convention: lowercase
// just the first letter of the PascalCase model name, e.g. WorkOrder ->
// workOrder) for every model that actually has an isTestData field.
// Computed once at startup from Prisma's own runtime schema metadata
// (Prisma.dmmf) rather than hardcoded, so a model added later without the
// field is correctly excluded automatically. Confirmed at the time this
// was written: every model has isTestData except CustomFieldValue.
const MODELS_WITH_TEST_DATA_FIELD = new Set(
  Prisma.dmmf.datamodel.models
    .filter((m) => m.fields.some((f) => f.name === 'isTestData'))
    .map((m) => m.name.charAt(0).toLowerCase() + m.name.slice(1)),
);

const CREATE_METHODS = ['create', 'createMany', 'createManyAndReturn', 'upsert'] as const;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
    try {
      this.installTestDataAutoTagging();
      this.installTransactionAutoTagging();
    } catch (e) {
      // Every module in the app depends on PrismaService - this feature
      // must never be able to take down startup. Worst case if this
      // fails: test sessions stop auto-tagging records, which is a
      // silent degradation, not an outage.
      this.logger.error('Failed to install test-data auto-tagging - continuing without it', e as Error);
    }
    try {
      await this.ensurePlantIdColumn();
    } catch (e) {
      this.logger.error('Failed to ensure users.plantId column - see 150_user_default_plant.sql', e as Error);
    }
    try {
      await this.ensureProductTargetColumns();
    } catch (e) {
      this.logger.error('Failed to ensure products.hourlyTarget/dailyTarget columns - see 164_product_hourly_daily_targets.sql', e as Error);
    }
    try {
      await this.ensureCpoConversionErrorColumn();
    } catch (e) {
      this.logger.error('Failed to ensure customer_pos.conversionError column - see 171_cpo_conversion_error.sql', e as Error);
    }
    try {
      await this.ensureShortageVerificationAccess();
    } catch (e) {
      this.logger.error('Failed to ensure shortage-verification permissions/nav - see 156_material_shortage_verify_permissions.sql and 172_ui_control_shortage_verification_nav.sql', e as Error);
    }
    try {
      await this.ensureRackBinVerticalNumberingColumns();
    } catch (e) {
      this.logger.error('Failed to ensure warehouse_bins.bay/level/sequenceOrder columns - see 161_store_rack_bin_vertical_numbering.sql', e as Error);
    }
    try {
      await this.ensureOqcStageColumn();
    } catch (e) {
      this.logger.error('Failed to ensure oqc_inspections.stage column - see 165_oqc_prepack_postpack_split.sql', e as Error);
    }
    try {
      await this.ensureProductionEntryManpowerAllottedColumn();
    } catch (e) {
      this.logger.error('Failed to ensure production_entries.manpowerAllotted column - see 173_production_entry_manpower_allotted.sql', e as Error);
    }
    try {
      await this.ensureVendorReturnWindowDaysColumn();
    } catch (e) {
      this.logger.error('Failed to ensure vendors.returnWindowDays column - see 174_vendor_return_window_days.sql', e as Error);
    }
  }

  /**
   * One-time, idempotent startup check for 150_user_default_plant.sql
   * (adds users.plantId + FK to plants + index). Lets an environment
   * self-apply this migration on boot - using this same connection this
   * service already holds - instead of needing a manual psql run against
   * that environment's DB. Every statement below is a no-op once the
   * column/constraint/index already exist (IF NOT EXISTS / a pg_constraint
   * check), so this is safe to leave running on every boot in every
   * environment, including one that already has it applied. Remove once
   * 150_user_default_plant.sql is confirmed applied everywhere (dev,
   * staging, production) and this has had a chance to run at least once
   * in each.
   */
  private async ensurePlantIdColumn() {
    await this.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plantId" TEXT;`);
    await this.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_plantId_fkey') THEN
          ALTER TABLE "users" ADD CONSTRAINT "users_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "users_plantId_idx" ON "users"("plantId");`);
    this.logger.log('users.plantId column/constraint/index ensured');
  }

  /**
   * One-time, idempotent startup check for 164_product_hourly_daily_targets.sql
   * (adds products.hourlyTarget/dailyTarget, drops the dead
   * hourly_production_reports table). Same self-apply-on-boot pattern as
   * ensurePlantIdColumn() above, for the same reason: this environment has
   * no psql/AWS access to run the migration file directly against the DB,
   * but the app's own Prisma connection can apply the equivalent DDL on
   * startup. Discovered needed 2026-10-29 when BOM upload's Confirm Import
   * step failed in production with "column products.hourlyTarget does not
   * exist" - the PR #21 code had been deployed without this migration ever
   * having been run against that database. Every statement is IF EXISTS /
   * IF NOT EXISTS, so safe on every boot including one that already has it
   * applied. Remove once 164_product_hourly_daily_targets.sql is confirmed
   * applied everywhere and this has had a chance to run at least once.
   */
  private async ensureProductTargetColumns() {
    await this.$executeRawUnsafe(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hourlyTarget" DOUBLE PRECISION;`);
    await this.$executeRawUnsafe(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "dailyTarget" DOUBLE PRECISION;`);
    await this.$executeRawUnsafe(`DROP TABLE IF EXISTS "hourly_production_reports";`);
    this.logger.log('products.hourlyTarget/dailyTarget columns ensured, hourly_production_reports dropped');
  }

  /**
   * One-time, idempotent startup check for 171_cpo_conversion_error.sql
   * (adds customer_pos.conversionError). Same self-apply-on-boot pattern
   * as ensurePlantIdColumn()/ensureProductTargetColumns() above, for the
   * same reason: no psql/AWS access from this environment to run the
   * migration file directly, so the app's own Prisma connection applies
   * the equivalent DDL on startup instead. Safe on every boot - the
   * statement is IF NOT EXISTS. Remove once 171_cpo_conversion_error.sql
   * is confirmed applied everywhere and this has had a chance to run at
   * least once.
   */
  private async ensureCpoConversionErrorColumn() {
    await this.$executeRawUnsafe(`ALTER TABLE "customer_pos" ADD COLUMN IF NOT EXISTS "conversionError" TEXT;`);
    this.logger.log('customer_pos.conversionError column ensured');
  }

  /**
   * One-time, idempotent startup check for two data (not schema) fixes
   * discovered to be at risk of the exact same "migration file merged but
   * never actually run against production" gap that 164 hit today:
   *   - 156_material_shortage_verify_permissions.sql: grants
   *     MATERIAL_SHORTAGE_VIEW/VERIFY to SUPER_ADMIN/ADMIN/STORE roles.
   *     Without it, Store cannot see or act on its own shortage
   *     verification queue (task #52) even though the backend/frontend
   *     for it are both live.
   *   - 172_ui_control_shortage_verification_nav.sql: adds the sidebar
   *     row for that same screen, so Store can actually navigate to it.
   * Both statements are ON CONFLICT DO NOTHING, so safe on every boot
   * including one where they already applied. Remove once both files are
   * confirmed applied everywhere.
   */
  private async ensureShortageVerificationAccess() {
    await this.$executeRawUnsafe(`
      INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy")
      SELECT gen_random_uuid()::text, r."companyId", r.id, perm, true, false, now(), now(), 'material-shortage-verify-migration', 'material-shortage-verify-migration'
      FROM roles r
      CROSS JOIN (VALUES ('MATERIAL_SHORTAGE_VIEW'), ('MATERIAL_SHORTAGE_VERIFY')) AS p(perm)
      WHERE r.name IN ('SUPER_ADMIN', 'ADMIN', 'STORE')
      ON CONFLICT DO NOTHING;
    `);
    await this.$executeRawUnsafe(`
      INSERT INTO ui_control_elements (id, company_id, key, element_type, module, page, label, icon, parent_key, sort_order, default_visible, created_at, updated_at, is_active, is_test_data)
      VALUES (gen_random_uuid(), '83eda866-ba63-472c-902f-561f05b6b1c1', 'sidebar.inventory.shortageVerification', 'SIDEBAR_ITEM', 'Inventory', '/inventory/shortage-verification', 'Shortage Verification', NULL, 'sidebar.inventory', 9, true, now(), now(), true, false)
      ON CONFLICT (company_id, key) DO NOTHING;
    `);
    this.logger.log('Shortage-verification role permissions and sidebar nav ensured');
  }

  /**
   * One-time, idempotent startup check for
   * 161_store_rack_bin_vertical_numbering.sql (adds warehouse_bins.bay/
   * level/sequenceOrder + the rackId/sequenceOrder index). Same
   * self-apply-on-boot pattern as the methods above, for the same reason:
   * this migration was merged (backing task #56's generateRackLocations())
   * but never actually run against production. Discovered live
   * 2026-10-29 while verifying Phase 3: GET /rack-bin/bins/rack/:id -
   * the endpoint Store uses just to view a rack's bins - was returning a
   * 500 ("column warehouse_bins.bay does not exist") for every rack,
   * because findBins()/findEmptyBins() order by sequenceOrder. All
   * statements are IF NOT EXISTS, so safe on every boot including one
   * that already has it applied. Remove once
   * 161_store_rack_bin_vertical_numbering.sql is confirmed applied
   * everywhere and this has had a chance to run at least once.
   */
  private async ensureRackBinVerticalNumberingColumns() {
    await this.$executeRawUnsafe(`ALTER TABLE "warehouse_bins" ADD COLUMN IF NOT EXISTS "bay" TEXT;`);
    await this.$executeRawUnsafe(`ALTER TABLE "warehouse_bins" ADD COLUMN IF NOT EXISTS "level" INTEGER;`);
    await this.$executeRawUnsafe(`ALTER TABLE "warehouse_bins" ADD COLUMN IF NOT EXISTS "sequenceOrder" INTEGER;`);
    await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "warehouse_bins_rackId_sequenceOrder_idx" ON "warehouse_bins"("rackId", "sequenceOrder");`);
    this.logger.log('warehouse_bins.bay/level/sequenceOrder columns and index ensured');
  }

  /**
   * One-time, idempotent startup check for
   * 165_oqc_prepack_postpack_split.sql (adds oqc_inspections.stage NOT
   * NULL DEFAULT 'PRE_PACK', plus its unique/lookup indexes). Same
   * self-apply-on-boot pattern as the methods above, for the same
   * reason: this migration was merged (backing task #60's PRE_PACK /
   * POST_PACK OQC gate) but never actually run against production.
   * Discovered live 2026-10-29 while starting Phase 4 (task #73):
   * GET /oqc and GET /oqc/stats were both returning a 500 ("column
   * oqc_inspections.stage does not exist"), taking down the entire OQC
   * list/stats screen. ADD COLUMN IF NOT EXISTS with NOT NULL DEFAULT
   * backfills existing rows the same way the plain ALTER TABLE in the
   * .sql file would have; the indexes are IF NOT EXISTS. Safe on every
   * boot including one that already has it applied. Remove once
   * 165_oqc_prepack_postpack_split.sql is confirmed applied everywhere
   * and this has had a chance to run at least once.
   */
  private async ensureOqcStageColumn() {
    await this.$executeRawUnsafe(`ALTER TABLE "oqc_inspections" ADD COLUMN IF NOT EXISTS "stage" TEXT NOT NULL DEFAULT 'PRE_PACK';`);
    await this.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "oqc_inspections_companyId_fgReceiptId_stage_key" ON "oqc_inspections"("companyId", "fgReceiptId", "stage");`);
    await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "oqc_inspections_companyId_stage_idx" ON "oqc_inspections"("companyId", "stage");`);
    this.logger.log('oqc_inspections.stage column and indexes ensured');
  }

  /**
   * One-time, idempotent startup check for
   * 173_production_entry_manpower_allotted.sql (adds
   * production_entries.manpowerAllotted). Safe on every boot including
   * one that already has it applied.
   */
  private async ensureProductionEntryManpowerAllottedColumn() {
    await this.$executeRawUnsafe(`ALTER TABLE "production_entries" ADD COLUMN IF NOT EXISTS "manpowerAllotted" INTEGER;`);
    this.logger.log('production_entries.manpowerAllotted column ensured');
  }

  /**
   * One-time, idempotent startup check for
   * 174_vendor_return_window_days.sql (adds vendors.returnWindowDays).
   * Safe on every boot including one that already has it applied.
   */
  private async ensureVendorReturnWindowDaysColumn() {
    await this.$executeRawUnsafe(`ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "returnWindowDays" INTEGER;`);
    this.logger.log('vendors.returnWindowDays column ensured');
  }

  /**
   * Wraps create/createMany/createManyAndReturn/upsert on every model
   * delegate that has an isTestData field, so that when the current
   * request is a "test session" (X-Test-Session header, see
   * test-session.middleware.ts and test-session.context.ts), every
   * record created anywhere in the call stack - no matter how deeply
   * nested inside a service, no matter which of the 150+ modules -
   * automatically gets isTestData: true, without touching any of those
   * services individually.
   *
   * Runs once at startup (called from onModuleInit, not per-request) and
   * simply reassigns a function property on each already-constructed
   * model delegate - deliberately not using Prisma's $extends() here,
   * since combining it with this already-working class-based
   * PrismaService (extends PrismaClient directly, injected by 150+
   * existing services) has real, hard-to-verify risk around whether the
   * NestJS lifecycle methods added on this class would still resolve
   * correctly on whatever $extends() hands back. This wrapping approach
   * leaves the proven class extension completely untouched.
   *
   * Shared with installTransactionAutoTagging() below via wrapClient(),
   * since $transaction(async (tx) => ...) hands callers a *separate*,
   * freshly-generated client object per call - wrapping `this` here has
   * no effect on that object at all.
   */
  private installTestDataAutoTagging() {
    this.wrapClient(this);
    this.logger.log(`Test-data auto-tagging installed on ${MODELS_WITH_TEST_DATA_FIELD.size} models`);
  }

  private wrapClient(client: any) {
    for (const modelProp of MODELS_WITH_TEST_DATA_FIELD) {
      const delegate = client[modelProp];
      if (!delegate) continue; // defensive: skip rather than crash if a property name doesn't match what Prisma actually generated
      for (const method of CREATE_METHODS) {
        if (typeof delegate[method] !== 'function') continue;
        const original = delegate[method].bind(delegate);
        delegate[method] = (args: any) => {
          if (isTestSessionActive() && args) {
            if (method === 'upsert' && args.create) {
              args.create.isTestData = true;
            } else if (method === 'createMany' || method === 'createManyAndReturn') {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((d: any) => ({ ...d, isTestData: true }));
              } else if (args.data) {
                args.data.isTestData = true;
              }
            } else if (args.data) {
              args.data.isTestData = true;
            }
          }
          return original(args);
        };
      }
    }
  }

  /**
   * Interactive transactions (`this.$transaction(async (tx) => {...})`,
   * used throughout the app for multi-table atomic writes - CPO
   * acknowledge creating its Sales Order, GRN/IQC/dispatch flows, etc.)
   * hand the callback a `tx` client that Prisma generates fresh per
   * call - it is not `this` and installTestDataAutoTagging()'s wrapping
   * of `this`'s delegates never touches it. Found live: acknowledging a
   * CPO under Test Mode correctly tagged the CPO itself, but the
   * Sales Order created inside that same $transaction() callback came
   * back isTestData: false. Fixed by wrapping $transaction itself: for
   * the callback form specifically, apply the same wrapClient() to the
   * tx object Prisma provides before handing it to the caller's
   * function, so every create/createMany/createManyAndReturn/upsert
   * inside any transaction gets tagged exactly like it does outside one.
   * The array form of $transaction ($transaction([p1, p2])) is left
   * untouched - those promises are already built from already-wrapped
   * delegate calls by the time they reach $transaction.
   */
  private installTransactionAutoTagging() {
    const originalTransaction = this.$transaction.bind(this);
    (this as any).$transaction = (arg: any, options?: any) => {
      if (typeof arg === 'function') {
        return originalTransaction((tx: any) => {
          try {
            this.wrapClient(tx);
          } catch {
            // Same fail-safe posture as the rest of this feature - a
            // wrapping failure must never break the caller's transaction.
          }
          return arg(tx);
        }, options);
      }
      return originalTransaction(arg, options);
    };
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase not allowed in production');
    }
    const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        await this.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      }
    }
  }
}
