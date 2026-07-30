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
    } catch (e) {
      // Every module in the app depends on PrismaService - this feature
      // must never be able to take down startup. Worst case if this
      // fails: test sessions stop auto-tagging records, which is a
      // silent degradation, not an outage.
      this.logger.error('Failed to install test-data auto-tagging - continuing without it', e as Error);
    }
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
   */
  private installTestDataAutoTagging() {
    for (const modelProp of MODELS_WITH_TEST_DATA_FIELD) {
      const delegate = (this as any)[modelProp];
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
    this.logger.log(`Test-data auto-tagging installed on ${MODELS_WITH_TEST_DATA_FIELD.size} models`);
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
