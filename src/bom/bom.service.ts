import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateBomDto, UpdateBomDto, CreateBomItemDto, UpdateBomItemDto, GenerateStagesDto } from './dto/bom.dto';

@Injectable()
export class BomService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private itemIncludes() {
    return { items: { where: { isActive: true }, orderBy: { sequence: 'asc' as const } } };
  }

  // ── BOM NUMBER GENERATOR ─────────────────────────────────────
  private sanitizeBrandPrefix(brand?: string | null): string {
    if (!brand) return 'GEN';
    const cleaned = brand.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleaned || 'GEN';
  }

  private async generateBomNumber(companyId: string, brand?: string | null): Promise<string> {
    const prefix = this.sanitizeBrandPrefix(brand);
    const count = await this.prisma.bom.count({ where: { companyId, bomNumber: { startsWith: `${prefix}-` } } });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  // ── BOM CRUD ─────────────────────────────────────────────────
  async create(dto: CreateBomDto, user: any) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
    if (!product) throw new NotFoundException('Product not found');

    const existingActiveBom = await this.prisma.bom.findFirst({
      where: { companyId: user.companyId, productId: dto.productId, status: { not: 'OBSOLETE' }, isActive: true },
    });
    if (existingActiveBom) {
      throw new BadRequestException(
        `This product already has an active BOM (${existingActiveBom.bomNumber}, ${existingActiveBom.status}). ` +
        `Use that one, or create a proper revision via Bom Revisions instead of a new duplicate BOM.`
      );
    }

    const bomNumber = await this.generateBomNumber(user.companyId, product.brand);
    const bom = await this.prisma.bom.create({
      data: { ...dto, bomNumber, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: { product: { select: { code: true, name: true } }, ...this.itemIncludes() },
    });
    await this.audit.log({ tableName: 'boms', recordId: bom.id, action: 'CREATE', newValues: bom, changedBy: user.id });
    return bom;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, productId, bomType, hideObsolete } = query;
    const where: any = { isActive: true };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { bomNumber: { contains: search, mode: 'insensitive' } },
      { product: { name: { contains: search, mode: 'insensitive' } } },
      { product: { code: { contains: search, mode: 'insensitive' } } },
    ];
    if (bomType) where.bomType = bomType;
    if (productId) where.productId = productId;

    // Fetch the whole matching set, then collapse each bomNumber chain down to
    // one representative row (prefer APPROVED, then DRAFT, then OBSOLETE;
    // highest version number as tiebreaker) so the list shows one row per
    // BOM identity, not one row per version.
    const all = await this.prisma.bom.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { product: { select: { code: true, name: true, uom: { select: { code: true } } } }, _count: { select: { items: true } } },
    });
    const rank = (s: string) => (s === 'APPROVED' ? 2 : s === 'DRAFT' ? 1 : 0);
    const verNum = (v: string) => parseInt((v || 'v1').replace(/[^0-9]/g, '') || '1');
    const groups = new Map<string, any>();
    for (const b of all) {
      const existing = groups.get(b.bomNumber);
      if (!existing || rank(b.status) > rank(existing.status) ||
          (rank(b.status) === rank(existing.status) && verNum(b.version) > verNum(existing.version))) {
        groups.set(b.bomNumber, b);
      }
    }
    let representative = Array.from(groups.values());
    if (status) representative = representative.filter(b => b.status === status);
    else if (hideObsolete === 'true') representative = representative.filter(b => b.status !== 'OBSOLETE');
    representative.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = representative.length;
    const skip = (Number(page) - 1) * Number(limit);
    const data = representative.slice(skip, skip + Number(limit));
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  // Full version chain for this BOM's identity (same bomNumber), excluding itself - for the detail page's "Version History"
  async getVersions(id: string, user: any) {
    const bom = await this.findOne(id, user);
    const where: any = { companyId: bom.companyId, bomNumber: bom.bomNumber, id: { not: id }, isActive: true };
    return this.prisma.bom.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
  }

  // Stage BOMs generated from this master BOM (for the detail page's "Stage BOMs" section)
  async getStages(id: string, user: any) {
    const where: any = { sourceBomId: id, isActive: true };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const all = await this.prisma.bom.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        product: { select: { code: true, name: true } },
        _count: { select: { items: true } },
      },
    });
    // Collapse each stage's bomNumber chain to one representative row
    // (prefer APPROVED, then DRAFT, then OBSOLETE; highest version as
    // tiebreaker) - same rule as the main list, so obsolete stage versions
    // don't clutter this panel either.
    const rank = (s: string) => (s === 'APPROVED' ? 2 : s === 'DRAFT' ? 1 : 0);
    const verNum = (v: string) =>
      parseInt((v || 'v1').replace(/[^0-9]/g, '') || '1');
    const groups = new Map<string, any>();
    const firstSeenOrder: string[] = []; // preserves creation order (SMT -> MI -> Assembly -> Packaging), not alphabetical
    for (const b of all) {
      const existing = groups.get(b.bomNumber);
      if (!existing) firstSeenOrder.push(b.bomNumber);
      if (
        !existing ||
        rank(b.status) > rank(existing.status) ||
        (rank(b.status) === rank(existing.status) &&
          verNum(b.version) > verNum(existing.version))
      ) {
        groups.set(b.bomNumber, b);
      }
    }
    return firstSeenOrder.map((bomNumber) => groups.get(bomNumber));
  }

  // Alias kept for existing /history route - same as getVersions
  async getHistory(id: string, user: any) {
    return this.getVersions(id, user);
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const bom = await this.prisma.bom.findFirst({
      where,
      include: { product: { select: { code: true, name: true, brand: true } }, revision: { select: { revisionNumber: true } }, ...this.itemIncludes() },
    });
    if (!bom) throw new NotFoundException('BOM not found');
    return bom;
  }

  async findByProduct(productId: string, user: any) {
    const where: any = { productId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.bom.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { product: { select: { code: true, name: true } }, _count: { select: { items: true } } },
    });
  }

  async update(id: string, dto: UpdateBomDto, user: any) {
    const bom = await this.findOne(id, user);
    if (bom.status !== 'DRAFT') throw new BadRequestException('Only DRAFT BOMs can be edited');
    const updated = await this.prisma.bom.update({
      where: { id }, data: { ...dto, updatedBy: user.id },
      include: { product: { select: { code: true, name: true } }, ...this.itemIncludes() },
    });
    await this.audit.log({ tableName: 'boms', recordId: id, action: 'UPDATE', oldValues: bom, newValues: updated, changedBy: user.id });
    return updated;
  }

  async remove(id: string, user: any) {
    const bom = await this.findOne(id, user);
    if (bom.status === 'APPROVED') throw new BadRequestException('Cannot deactivate an approved BOM');
    const updated = await this.prisma.bom.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
    await this.audit.log({ tableName: 'boms', recordId: id, action: 'DELETE', oldValues: bom, newValues: updated, changedBy: user.id });
    return { message: 'BOM deactivated' };
  }

  async approve(id: string, user: any) {
    const bom = await this.findOne(id, user);
    if (bom.status !== 'DRAFT') throw new BadRequestException('Only DRAFT BOMs can be approved');
    if (!bom.items || bom.items.length === 0) throw new BadRequestException('Cannot approve BOM with no items');
    const updated = await this.prisma.bom.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
      include: { product: { select: { code: true, name: true } }, ...this.itemIncludes() },
    });
    await this.audit.log({ tableName: 'boms', recordId: id, action: 'UPDATE', oldValues: bom, newValues: updated, changedBy: user.id });

    const previousApproved = await this.prisma.bom.findMany({
      where: { companyId: user.companyId, bomNumber: bom.bomNumber, status: 'APPROVED', id: { not: id } },
    });
    for (const prev of previousApproved) {
      await this.prisma.bom.update({ where: { id: prev.id }, data: { status: 'OBSOLETE', updatedBy: user.id } });
      await this.audit.log({ tableName: 'boms', recordId: prev.id, action: 'UPDATE', oldValues: prev, newValues: { status: 'OBSOLETE' }, changedBy: user.id });

      // Cascade: when a MASTER's new version replaces an old approved one,
      // the old master's stage-BOMs are now orphaned to an obsolete parent.
      // Obsolete them too, and auto-create a DRAFT clone of each pointing at
      // the new master, so the whole chain (master + stages) stays consistent
      // and nothing is left silently APPROVED-but-orphaned.
      if (bom.bomType === 'MASTER') {
        const orphanedStages = await this.prisma.bom.findMany({
          where: { companyId: user.companyId, sourceBomId: prev.id, bomType: 'STAGE', status: 'APPROVED' },
          include: this.itemIncludes(),
        });
        for (const stage of orphanedStages) {
          await this.prisma.bom.update({ where: { id: stage.id }, data: { status: 'OBSOLETE', updatedBy: user.id } });
          await this.audit.log({ tableName: 'boms', recordId: stage.id, action: 'UPDATE', oldValues: stage, newValues: { status: 'OBSOLETE' }, changedBy: user.id });

          const siblings = await this.prisma.bom.findMany({ where: { companyId: user.companyId, bomNumber: stage.bomNumber }, select: { version: true } });
          const maxVersion = Math.max(0, ...siblings.map(s => parseInt((s.version || 'v1').replace(/[^0-9]/g, '') || '1')));
          const newStage = await this.prisma.bom.create({
            data: {
              companyId: user.companyId, productId: stage.productId,
              bomNumber: stage.bomNumber, version: `v${maxVersion + 1}`,
              bomType: 'STAGE', sourceBomId: updated.id,
              description: `Carried forward from ${stage.bomNumber} ${stage.version} after master ${bom.bomNumber} was re-approved - review and approve`,
              effectiveFrom: new Date(), status: 'DRAFT',
              createdBy: user.id, updatedBy: user.id,
            },
          });
          if (stage.items && stage.items.length > 0) {
            await this.prisma.bomItem.createMany({
              data: stage.items.map(item => ({
                bomId: newStage.id, companyId: user.companyId,
                sequence: item.sequence, itemType: item.itemType,
                rawMaterialId: item.rawMaterialId,
                itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
                quantity: item.quantity, wastagePercent: item.wastagePercent,
                effectiveQty: item.effectiveQty, unitCost: item.unitCost,
                totalCost: item.totalCost, isCritical: item.isCritical,
                notes: item.notes, createdBy: user.id, updatedBy: user.id,
              })),
            });
          }
        }
      }
    }

    return updated;
  }

  async obsolete(id: string, user: any) {
    const bom = await this.findOne(id, user);
    if (bom.status === 'OBSOLETE') throw new BadRequestException('Already obsolete');
    const updated = await this.prisma.bom.update({ where: { id }, data: { status: 'OBSOLETE', updatedBy: user.id } });
    await this.audit.log({ tableName: 'boms', recordId: id, action: 'UPDATE', oldValues: bom, newValues: updated, changedBy: user.id });
    return updated;
  }

  async clone(id: string, user: any) {
    const bom = await this.findOne(id, user);
    const siblings = await this.prisma.bom.findMany({
      where: { companyId: user.companyId, bomNumber: bom.bomNumber },
      select: { version: true },
    });
    const maxVersion = Math.max(0, ...siblings.map(s => parseInt((s.version || 'v1').replace(/[^0-9]/g, '') || '1')));
    const versionNum = maxVersion + 1;
    const cloned = await this.prisma.bom.create({
      data: {
        companyId: user.companyId, productId: bom.productId,
        bomNumber: bom.bomNumber, version: `v${versionNum}`,
        bomType: bom.bomType, sourceBomId: bom.sourceBomId,
        description: `Cloned from ${bom.bomNumber} ${bom.version}`,
        effectiveFrom: new Date(), status: 'DRAFT',
        createdBy: user.id, updatedBy: user.id,
      },
    });
    // Clone all items
    if (bom.items && bom.items.length > 0) {
      await this.prisma.bomItem.createMany({
        data: bom.items.map(item => ({
          bomId: cloned.id, companyId: user.companyId,
          sequence: item.sequence, itemType: item.itemType,
          rawMaterialId: item.rawMaterialId,
          itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
          quantity: item.quantity, wastagePercent: item.wastagePercent,
          effectiveQty: item.effectiveQty, unitCost: item.unitCost,
          totalCost: item.totalCost, isCritical: item.isCritical,
          notes: item.notes, createdBy: user.id, updatedBy: user.id,
        })),
      });
    }
    await this.audit.log({ tableName: 'boms', recordId: cloned.id, action: 'CREATE', newValues: cloned, changedBy: user.id });
    return this.findOne(cloned.id, user);
  }

  async generateStages(sourceBomId: string, dto: GenerateStagesDto, user: any) {
    if (!dto.stages || dto.stages.length === 0) {
      throw new BadRequestException('At least one stage is required');
    }
    const sourceBom = await this.prisma.bom.findFirst({
      where: { id: sourceBomId, companyId: user.companyId },
      include: { items: { where: { isActive: true } }, product: true },
    });
    if (!sourceBom) throw new NotFoundException('Source BOM not found');

    const created: any[] = [];
    let previousProduct: { code: string; name: string } | null = null;

    for (const stage of dto.stages) {
      const matchingItems = sourceBom.items.filter((i) => stage.sections.includes(i.section || ''));
      if (matchingItems.length === 0) {
        throw new BadRequestException(`No items found in source BOM for stage \"${stage.stageName}\" (sections: ${stage.sections.join(', ')})`);
      }

      let targetProduct: { id: string; code: string; name: string };
      if (stage.productCode) {
        const existing = await this.prisma.product.findFirst({ where: { companyId: user.companyId, code: stage.productCode } });
        if (existing) {
          targetProduct = existing;
        } else {
          targetProduct = await this.prisma.product.create({
            data: {
              companyId: user.companyId, code: stage.productCode,
              name: stage.productName || `${sourceBom.product.name} - ${stage.stageName}`,
              createdBy: user.id, updatedBy: user.id,
            },
          });
        }
      } else {
        targetProduct = sourceBom.product;
      }

      const newBomNumber = `${sourceBom.bomNumber}-${stage.stageName.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
      const newBom = await this.prisma.bom.create({
        data: {
          companyId: user.companyId, productId: targetProduct.id,
          bomNumber: newBomNumber, version: 'v1',
          bomType: 'STAGE', sourceBomId: sourceBom.id,
          description: `Stage \"${stage.stageName}\" auto-generated from ${sourceBom.bomNumber}`,
          effectiveFrom: new Date(), status: 'DRAFT',
          createdBy: user.id, updatedBy: user.id,
        },
      });

      let seq = 1;
      if (previousProduct) {
        await this.addItem(newBom.id, {
          sequence: seq++, itemType: 'SUB_ASSEMBLY',
          itemCode: previousProduct.code, itemName: previousProduct.name,
          uom: 'PCS', quantity: 1,
        } as any, user, this.prisma, { skipCostRecalc: true, skipAudit: true });
      }
      for (const item of matchingItems) {
        await this.addItem(newBom.id, {
          sequence: seq++, itemType: item.itemType, rawMaterialId: item.rawMaterialId || undefined,
          itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
          quantity: item.quantity, wastagePercent: item.wastagePercent || undefined,
          section: item.section || undefined, notes: item.notes || undefined,
        } as any, user, this.prisma, { skipCostRecalc: true, skipAudit: true });
      }
      await this.recalculateBomCost(newBom.id);

      await this.audit.log({ tableName: 'boms', recordId: newBom.id, action: 'CREATE', newValues: newBom, changedBy: user.id });
      created.push({ stageName: stage.stageName, bomId: newBom.id, bomNumber: newBomNumber, productCode: targetProduct.code, itemCount: matchingItems.length + (previousProduct ? 1 : 0) });
      previousProduct = targetProduct;
    }

    return { sourceBomNumber: sourceBom.bomNumber, stages: created };
  }

  // ── BOM ITEMS ─────────────────────────────────────────────────
  async addItem(bomId: string, dto: CreateBomItemDto, user: any, client: any = this.prisma, options: { skipCostRecalc?: boolean; skipAudit?: boolean; defaultWarehouseId?: string } = {}) {
    const bom = client === this.prisma ? await this.findOne(bomId, user) : await client.bom.findFirst({ where: { id: bomId, companyId: user.companyId } });
    if (!bom) throw new NotFoundException('BOM not found');
    if (bom.status !== 'DRAFT') throw new BadRequestException('Can only add items to DRAFT BOMs');

    const wastage = dto.wastagePercent || 0;
    const effectiveQty = dto.quantity * (1 + wastage / 100);

    // If the caller didn't supply a unit cost (Excel import, or copying
    // items into an auto-generated routing-stage BOM), fall back to the
    // item's real last-known cost from stock so the BOM isn't left blank
    // when that data already exists. Only defaults when unitCost is not
    // provided at all - an explicit 0 from the caller is respected as-is.
    let unitCost = dto.unitCost;
    if (unitCost === undefined || unitCost === null) {
      const stock = await client.stockBalance.findFirst({
        where: { companyId: user.companyId, itemCode: dto.itemCode },
      });
      if (stock && stock.unitCost > 0) unitCost = stock.unitCost;
    }
    const totalCost = unitCost ? effectiveQty * unitCost : null;

    const lastItem = await client.bomItem.findFirst({
      where: { bomId, isActive: true },
      orderBy: { sequence: 'desc' },
    });
    const nextSequence = (lastItem?.sequence || 0) + 1;

    const item = await client.bomItem.create({
      data: { ...dto, unitCost, sequence: nextSequence, bomId, companyId: user.companyId, effectiveQty, totalCost, createdBy: user.id, updatedBy: user.id },
    });

    if ((item.itemType === 'RAW_MATERIAL' || !item.itemType) && !item.rawMaterialId) {
      const uomRecord = item.uom
        ? await client.unitOfMeasure.findFirst({ where: { companyId: user.companyId, code: item.uom } })
          || await client.unitOfMeasure.create({
            data: { companyId: user.companyId, code: item.uom, name: item.uom, createdBy: user.id, updatedBy: user.id },
          })
        : null;
      const existingRm = await client.rawMaterial.findFirst({ where: { companyId: user.companyId, code: item.itemCode } });
      if (existingRm) {
        if (uomRecord && existingRm.uomId !== uomRecord.id) {
          await client.rawMaterial.update({ where: { id: existingRm.id }, data: { uomId: uomRecord.id, updatedBy: user.id } });
        }
        await client.bomItem.update({ where: { id: item.id }, data: { rawMaterialId: existingRm.id } });
      } else {
        const newRm = await client.rawMaterial.create({
          data: {
            companyId: user.companyId, code: item.itemCode, name: item.itemName,
            partNumber: item.itemCode, uomId: uomRecord?.id,
            createdBy: user.id, updatedBy: user.id,
          },
        });
        await client.bomItem.update({ where: { id: item.id }, data: { rawMaterialId: newRm.id } });
      }
    }

    await this.ensureStockBalanceExists(item.itemCode, item.itemName, item.uom, user, client, options.defaultWarehouseId);

    if (!options.skipCostRecalc) await this.recalculateBomCost(bomId, client);
    if (!options.skipAudit) await this.audit.log({ tableName: 'bom_items', recordId: item.id, action: 'CREATE', newValues: item, changedBy: user.id });
    return item;
  }

  /**
   * When a BOM references a raw material that has never been stocked
   * before, this creates a zero-quantity StockBalance row for it in the
   * company's default warehouse. Without this, a brand-new raw material
   * referenced only in a BOM would be invisible everywhere else in the
   * system (stock reports, shortage checks, etc.) until someone manually
   * received it via GRN - this makes it show up immediately, correctly
   * showing 0 on hand until real stock arrives.
   */
  private async ensureStockBalanceExists(itemCode: string, itemName: string, uom: string, user: any, client: any = this.prisma, knownDefaultWarehouseId?: string) {
    const existing = await client.stockBalance.findFirst({
      where: { companyId: user.companyId, itemCode },
    });
    if (existing) return;

    let warehouseId = knownDefaultWarehouseId;
    if (!warehouseId) {
      const defaultWarehouse = await client.warehouse.findFirst({
        where: { companyId: user.companyId, isDefault: true },
      });
      if (!defaultWarehouse) return; // no default warehouse configured yet - skip silently
      warehouseId = defaultWarehouse.id;
    }

    await client.stockBalance.create({
      data: {
        companyId: user.companyId,
        itemCode,
        itemName,
        warehouseId,
        availableQty: 0,
        reservedQty: 0,
        inQcQty: 0,
        unitCost: 0,
        totalValue: 0,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });
  }

  async updateItem(bomId: string, itemId: string, dto: UpdateBomItemDto, user: any) {
    const bom = await this.findOne(bomId, user);
    if (bom.status !== 'DRAFT') throw new BadRequestException('Can only edit items in DRAFT BOMs');

    const item = await this.prisma.bomItem.findFirst({ where: { id: itemId, bomId } });
    if (!item) throw new NotFoundException('BOM item not found');

    const quantity = dto.quantity ?? item.quantity;
    const wastage = dto.wastagePercent ?? item.wastagePercent ?? 0;
    const effectiveQty = quantity * (1 + wastage / 100);
    const unitCost = dto.unitCost ?? item.unitCost;
    const totalCost = unitCost ? effectiveQty * unitCost : null;

    const updated = await this.prisma.bomItem.update({
      where: { id: itemId }, data: { ...dto, effectiveQty, totalCost, updatedBy: user.id },
    });
    await this.recalculateBomCost(bomId);
    await this.audit.log({ tableName: 'bom_items', recordId: itemId, action: 'UPDATE', oldValues: item, newValues: updated, changedBy: user.id });
    return updated;
  }

  async removeItem(bomId: string, itemId: string, user: any) {
    const bom = await this.findOne(bomId, user);
    if (bom.status !== 'DRAFT') throw new BadRequestException('Can only remove items from DRAFT BOMs');

    const item = await this.prisma.bomItem.findFirst({ where: { id: itemId, bomId } });
    if (!item) throw new NotFoundException('BOM item not found');

    const updated = await this.prisma.bomItem.update({ where: { id: itemId }, data: { isActive: false, updatedBy: user.id } });
    await this.resequenceItems(bomId, user);
    await this.recalculateBomCost(bomId);
    await this.audit.log({ tableName: 'bom_items', recordId: itemId, action: 'DELETE', oldValues: item, newValues: updated, changedBy: user.id });
    return { message: 'BOM item removed' };
  }

  private async resequenceItems(bomId: string, user: any) {
    const remaining = await this.prisma.bomItem.findMany({
      where: { bomId, isActive: true },
      orderBy: { sequence: 'asc' },
    });
    for (let i = 0; i < remaining.length; i++) {
      const correctSequence = i + 1;
      if (remaining[i].sequence !== correctSequence) {
        await this.prisma.bomItem.update({
          where: { id: remaining[i].id },
          data: { sequence: correctSequence, updatedBy: user.id },
        });
      }
    }
  }

  private async recalculateBomCost(bomId: string, client: any = this.prisma) {
    const items = await client.bomItem.findMany({ where: { bomId, isActive: true } });
    const totalCost = items.reduce((sum, i) => sum + (i.totalCost || 0), 0);
    await client.bom.update({ where: { id: bomId }, data: { totalCost } });
  }

  async getStats(user: any) {
    const where: any = { isActive: true };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, approved, obsolete] = await Promise.all([
      this.prisma.bom.count({ where }),
      this.prisma.bom.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.bom.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.bom.count({ where: { ...where, status: 'OBSOLETE' } }),
    ]);
    const totalItems = await this.prisma.bomItem.count({ where: { companyId: user.companyId, isActive: true } });
    return { total, draft, approved, obsolete, totalItems };
  }
}
