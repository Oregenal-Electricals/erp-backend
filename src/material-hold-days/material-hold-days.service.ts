import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import {
  CreateMaterialHoldDaysRuleDto,
  UpdateMaterialHoldDaysRuleDto,
  UpdateDefaultHoldDaysDto,
} from './dto/material-hold-days.dto';

// Reused via SystemSetting (see migration 153_material_hold_days_rules.sql)
// rather than a brand-new single-row config table - matches how other
// company-wide numeric defaults are already modeled in this system
// (e.g. STANDARD_SHIFT_HOURS, seeded by 053_prod001_settings_seed.sql).
const DEFAULT_HOLD_DAYS_KEY = 'store_default_hold_days';
const DEFAULT_HOLD_DAYS_CATEGORY = 'STORE';
const DEFAULT_HOLD_DAYS_DESCRIPTION =
  'Company-wide fallback Store hold-days limit, used when no material- or material+vendor-specific rule is configured.';
// Only ever used if that key has somehow never been seeded/set at all
// (migration 153 seeds it, so this is a last-resort safety net, not
// the normal path).
const HARDCODED_FALLBACK_HOLD_DAYS = 30;

export type HoldDaysSource = 'MATERIAL_VENDOR' | 'MATERIAL_DEFAULT' | 'GLOBAL_DEFAULT';

export interface ResolvedHoldDays {
  holdDays: number;
  source: HoldDaysSource;
  ruleId: string | null;
}

@Injectable()
export class MaterialHoldDaysService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return {
      rawMaterial: { select: { id: true, code: true, name: true } },
      vendor: { select: { id: true, code: true, name: true } },
    };
  }

  // ───────────────────────────── CRUD ─────────────────────────────

  async create(dto: CreateMaterialHoldDaysRuleDto, user: any) {
    const rm = await this.prisma.rawMaterial.findFirst({
      where: { id: dto.rawMaterialId, companyId: user.companyId },
    });
    if (!rm) throw new NotFoundException('Raw material not found');

    const vendorId = dto.vendorId ?? null;
    if (vendorId) {
      const vendor = await this.prisma.vendor.findFirst({ where: { id: vendorId, companyId: user.companyId } });
      if (!vendor) throw new NotFoundException('Vendor not found');
    }

    // App-level guard ahead of the DB's partial unique index (migration
    // 153) - gives a clean 409 instead of a raw constraint-violation
    // error. The plain per-vendor case is additionally protected by a
    // normal (non-partial) @@unique in schema.prisma.
    const existing = await this.prisma.materialHoldDaysRule.findFirst({
      where: { companyId: user.companyId, rawMaterialId: dto.rawMaterialId, vendorId, isActive: true },
    });
    if (existing) {
      throw new ConflictException(
        vendorId
          ? 'A hold-days rule for this material and vendor already exists'
          : 'A material-level default hold-days rule already exists for this material',
      );
    }

    const rule = await this.prisma.materialHoldDaysRule.create({
      data: {
        rawMaterialId: dto.rawMaterialId,
        vendorId,
        holdDays: dto.holdDays,
        remarks: dto.remarks,
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({
      tableName: 'material_hold_days_rules',
      recordId: rule.id,
      action: 'CREATE',
      newValues: rule,
      changedBy: user.id,
    });
    return rule;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 50, rawMaterialId, vendorId, isActive } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (rawMaterialId) where.rawMaterialId = rawMaterialId;
    if (vendorId) where.vendorId = vendorId;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

    const [data, total] = await Promise.all([
      this.prisma.materialHoldDaysRule.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [{ rawMaterialId: 'asc' }, { vendorId: 'asc' }],
        include: this.includes(),
      }),
      this.prisma.materialHoldDaysRule.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const rule = await this.prisma.materialHoldDaysRule.findFirst({ where, include: this.includes() });
    if (!rule) throw new NotFoundException('Hold-days rule not found');
    return rule;
  }

  async update(id: string, dto: UpdateMaterialHoldDaysRuleDto, user: any) {
    const rule = await this.findOne(id, user);
    const updated = await this.prisma.materialHoldDaysRule.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({
      tableName: 'material_hold_days_rules',
      recordId: id,
      action: 'UPDATE',
      oldValues: rule,
      newValues: updated,
      changedBy: user.id,
    });
    return updated;
  }

  async remove(id: string, user: any) {
    const rule = await this.findOne(id, user);
    const updated = await this.prisma.materialHoldDaysRule.update({
      where: { id },
      data: { isActive: false, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({
      tableName: 'material_hold_days_rules',
      recordId: id,
      action: 'DELETE',
      oldValues: rule,
      newValues: updated,
      changedBy: user.id,
    });
    return { message: 'Hold-days rule deactivated successfully' };
  }

  // ───────────────────────── GLOBAL DEFAULT ─────────────────────────

  async getGlobalDefault(): Promise<{ holdDays: number; source: 'SYSTEM_SETTING' | 'HARDCODED_FALLBACK' }> {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: DEFAULT_HOLD_DAYS_KEY } });
    const parsed = setting ? Number(setting.value) : NaN;
    if (setting && !Number.isNaN(parsed) && parsed > 0) {
      return { holdDays: parsed, source: 'SYSTEM_SETTING' };
    }
    return { holdDays: HARDCODED_FALLBACK_HOLD_DAYS, source: 'HARDCODED_FALLBACK' };
  }

  async updateGlobalDefault(dto: UpdateDefaultHoldDaysDto, user: any) {
    const existing = await this.prisma.systemSetting.findUnique({ where: { key: DEFAULT_HOLD_DAYS_KEY } });
    const value = String(dto.holdDays);
    const updated = existing
      ? await this.prisma.systemSetting.update({
          where: { key: DEFAULT_HOLD_DAYS_KEY },
          data: { value, updatedBy: user.id },
        })
      : await this.prisma.systemSetting.create({
          data: {
            key: DEFAULT_HOLD_DAYS_KEY,
            value,
            category: DEFAULT_HOLD_DAYS_CATEGORY,
            description: DEFAULT_HOLD_DAYS_DESCRIPTION,
            createdBy: user.id,
            updatedBy: user.id,
          },
        });
    await this.audit.log({
      tableName: 'system_settings',
      recordId: updated.id,
      action: 'UPDATE',
      oldValues: existing,
      newValues: updated,
      changedBy: user.id,
    });
    return { holdDays: Number(updated.value), source: 'SYSTEM_SETTING' as const };
  }

  // ───────────────────────────── RESOLUTION ─────────────────────────────

  // The single source of truth for "what hold-days limit applies to this
  // material, optionally received from this vendor" - most specific match
  // wins: material+vendor rule, then the material-level default rule,
  // then the company-wide SystemSetting fallback. Used by resolve()
  // below and, in its batched form, by getAgingStock().
  async resolveHoldDays(companyId: string, rawMaterialId: string, vendorId?: string | null): Promise<ResolvedHoldDays> {
    if (vendorId) {
      const vendorRule = await this.prisma.materialHoldDaysRule.findFirst({
        where: { companyId, rawMaterialId, vendorId, isActive: true },
      });
      if (vendorRule) return { holdDays: vendorRule.holdDays, source: 'MATERIAL_VENDOR', ruleId: vendorRule.id };
    }

    const materialDefaultRule = await this.prisma.materialHoldDaysRule.findFirst({
      where: { companyId, rawMaterialId, vendorId: null, isActive: true },
    });
    if (materialDefaultRule) {
      return { holdDays: materialDefaultRule.holdDays, source: 'MATERIAL_DEFAULT', ruleId: materialDefaultRule.id };
    }

    const global = await this.getGlobalDefault();
    return { holdDays: global.holdDays, source: 'GLOBAL_DEFAULT', ruleId: null };
  }

  async resolve(user: any, rawMaterialId: string, vendorId?: string) {
    const rm = await this.prisma.rawMaterial.findFirst({ where: { id: rawMaterialId, companyId: user.companyId } });
    if (!rm) throw new NotFoundException('Raw material not found');
    if (vendorId) {
      const vendor = await this.prisma.vendor.findFirst({ where: { id: vendorId, companyId: user.companyId } });
      if (!vendor) throw new NotFoundException('Vendor not found');
    }
    const resolved = await this.resolveHoldDays(user.companyId, rawMaterialId, vendorId ?? null);
    return { rawMaterialId, rawMaterialCode: rm.code, vendorId: vendorId ?? null, ...resolved };
  }

  // ─────────────────────────── STORE AGING ALERT ───────────────────────────

  // Store Dashboard integration point: every ACTIVE batch still
  // physically in Store, aged against the applicable rule above. Never
  // mutates stock - detection only, same philosophy as
  // InventoryDashboardService.getReconciliation(). Deliberately batched
  // into a handful of queries up front (all active batches, then one
  // lookup each for the raw materials / GRN->vendor links / rules
  // involved) instead of a query-per-batch loop, so this stays cheap
  // regardless of how much stock Store is holding.
  async getAgingStock(user: any) {
    const companyId = user.companyId;
    const now = Date.now();
    const globalDefault = await this.getGlobalDefault();

    const batches = await this.prisma.stockBatch.findMany({
      where: { companyId, status: 'ACTIVE', availableQty: { gt: 0 } },
      select: {
        id: true,
        batchNumber: true,
        itemCode: true,
        itemName: true,
        uom: true,
        warehouseId: true,
        grnId: true,
        receivedDate: true,
        availableQty: true,
        unitCost: true,
      },
    });
    if (batches.length === 0) {
      return {
        totalBatchesChecked: 0,
        overdueCount: 0,
        overdueValue: 0,
        globalDefaultHoldDays: globalDefault.holdDays,
        overdueBatches: [] as any[],
      };
    }

    const itemCodes = [...new Set(batches.map((b) => b.itemCode))];
    const rawMaterials = await this.prisma.rawMaterial.findMany({
      where: { companyId, code: { in: itemCodes } },
      select: { id: true, code: true },
    });
    const rawMaterialByCode = new Map<string, { id: string; code: string }>(
      rawMaterials.map((rm: any) => [rm.code, rm]),
    );

    const grnIds = [...new Set(batches.map((b) => b.grnId).filter((id): id is string => !!id))];
    const grns = grnIds.length
      ? await this.prisma.grnHeader.findMany({
          where: { id: { in: grnIds } },
          select: { id: true, po: { select: { vendorId: true } }, ipo: { select: { vendorId: true } } },
        })
      : [];
    const vendorIdByGrnId = new Map<string, string | null>(
      grns.map((g: any) => [g.id, g.po?.vendorId ?? g.ipo?.vendorId ?? null]),
    );

    const rules = await this.prisma.materialHoldDaysRule.findMany({ where: { companyId, isActive: true } });
    const ruleByKey = new Map<string, { id: string; holdDays: number }>(
      rules.map((r: any) => [`${r.rawMaterialId}|${r.vendorId ?? ''}`, r]),
    );

    const overdueBatches: any[] = [];
    let overdueValue = 0;

    for (const batch of batches) {
      const rawMaterial = rawMaterialByCode.get(batch.itemCode);
      const vendorId = batch.grnId ? vendorIdByGrnId.get(batch.grnId) ?? null : null;
      const ageInDays = Math.floor((now - batch.receivedDate.getTime()) / (24 * 60 * 60 * 1000));

      let resolved: ResolvedHoldDays;
      if (!rawMaterial) {
        // No tracked RawMaterial for this itemCode (should be rare) -
        // nothing material/vendor-specific to look up, fall straight
        // through to the company-wide default rather than skipping
        // the check entirely.
        resolved = { holdDays: globalDefault.holdDays, source: 'GLOBAL_DEFAULT', ruleId: null };
      } else {
        const vendorRule = vendorId ? ruleByKey.get(`${rawMaterial.id}|${vendorId}`) : undefined;
        const materialRule = ruleByKey.get(`${rawMaterial.id}|`);
        if (vendorRule) resolved = { holdDays: vendorRule.holdDays, source: 'MATERIAL_VENDOR', ruleId: vendorRule.id };
        else if (materialRule) resolved = { holdDays: materialRule.holdDays, source: 'MATERIAL_DEFAULT', ruleId: materialRule.id };
        else resolved = { holdDays: globalDefault.holdDays, source: 'GLOBAL_DEFAULT', ruleId: null };
      }

      if (ageInDays > resolved.holdDays) {
        const value = batch.availableQty * batch.unitCost;
        overdueValue += value;
        overdueBatches.push({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          itemCode: batch.itemCode,
          itemName: batch.itemName,
          warehouseId: batch.warehouseId,
          availableQty: batch.availableQty,
          uom: batch.uom,
          receivedDate: batch.receivedDate,
          ageInDays,
          applicableHoldDays: resolved.holdDays,
          holdDaysSource: resolved.source,
          vendorId,
          value,
        });
      }
    }

    overdueBatches.sort((a, b) => b.ageInDays - a.ageInDays);

    return {
      totalBatchesChecked: batches.length,
      overdueCount: overdueBatches.length,
      overdueValue,
      globalDefaultHoldDays: globalDefault.holdDays,
      overdueBatches: overdueBatches.slice(0, 50),
    };
  }
}
