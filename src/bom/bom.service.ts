import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateBomDto, UpdateBomDto, CreateBomItemDto, UpdateBomItemDto } from './dto/bom.dto';

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
    const { page = 1, limit = 20, search, status, productId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { bomNumber: { contains: search, mode: 'insensitive' } },
      { product: { name: { contains: search, mode: 'insensitive' } } },
      { product: { code: { contains: search, mode: 'insensitive' } } },
    ];
    if (status) where.status = status;
    if (productId) where.productId = productId;

    const [data, total] = await Promise.all([
      this.prisma.bom.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { product: { select: { code: true, name: true, uom: { select: { code: true } } } }, _count: { select: { items: true } } },
      }),
      this.prisma.bom.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
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
    const bomNumber = await this.generateBomNumber(user.companyId, (bom as any).product?.brand);
    const versionNum = parseInt((bom.version || 'v1').replace(/[^0-9]/g, '') || '1') + 1;
    const cloned = await this.prisma.bom.create({
      data: {
        companyId: user.companyId, productId: bom.productId,
        bomNumber, version: `v${versionNum}`,
        description: `Cloned from ${bom.bomNumber}`,
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

  // ── BOM ITEMS ─────────────────────────────────────────────────
  async addItem(bomId: string, dto: CreateBomItemDto, user: any, client: any = this.prisma, options: { skipCostRecalc?: boolean; skipAudit?: boolean; defaultWarehouseId?: string } = {}) {
    const bom = client === this.prisma ? await this.findOne(bomId, user) : await client.bom.findFirst({ where: { id: bomId, companyId: user.companyId } });
    if (!bom) throw new NotFoundException('BOM not found');
    if (bom.status !== 'DRAFT') throw new BadRequestException('Can only add items to DRAFT BOMs');

    const wastage = dto.wastagePercent || 0;
    const effectiveQty = dto.quantity * (1 + wastage / 100);
    const totalCost = dto.unitCost ? effectiveQty * dto.unitCost : null;

    const lastItem = await client.bomItem.findFirst({
      where: { bomId, isActive: true },
      orderBy: { sequence: 'desc' },
    });
    const nextSequence = (lastItem?.sequence || 0) + 1;

    const item = await client.bomItem.create({
      data: { ...dto, sequence: nextSequence, bomId, companyId: user.companyId, effectiveQty, totalCost, createdBy: user.id, updatedBy: user.id },
    });

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
    const where: any = {};
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
