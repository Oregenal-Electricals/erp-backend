import {
  Injectable, NotFoundException,
  ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import {
  CreateUomDto, UpdateUomDto,
  CreateCategoryDto, UpdateCategoryDto,
  CreateItemDto, UpdateItemDto,
} from './dto/item-master.dto';

@Injectable()
export class ItemMasterService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ── UOM ──────────────────────────────────────────────────────

  async createUom(dto: CreateUomDto, user: any) {
    const exists = await this.prisma.unitOfMeasure.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`UOM ${dto.code} already exists`);

    const uom = await this.prisma.unitOfMeasure.create({
      data: { ...dto, code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'unit_of_measures', recordId: uom.id, action: 'CREATE', newValues: uom, changedBy: user.id });
    return uom;
  }

  async findAllUoms(user: any) {
    return this.prisma.unitOfMeasure.findMany({
      where: { companyId: user.companyId, isActive: true },
      include: { _count: { select: { items: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async updateUom(id: string, dto: UpdateUomDto, user: any) {
    const uom = await this.prisma.unitOfMeasure.findUnique({ where: { id } });
    if (!uom) throw new NotFoundException('UOM not found');
    const updated = await this.prisma.unitOfMeasure.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'unit_of_measures', recordId: id, action: 'UPDATE', oldValues: uom, newValues: dto, changedBy: user.id });
    return updated;
  }

  async toggleUomStatus(id: string, user: any) {
    const uom = await this.prisma.unitOfMeasure.findUnique({ where: { id } });
    if (!uom) throw new NotFoundException('UOM not found');
    return this.prisma.unitOfMeasure.update({ where: { id }, data: { isActive: !uom.isActive, updatedBy: user.id } });
  }

  // ── CATEGORY ─────────────────────────────────────────────────

  async createCategory(dto: CreateCategoryDto, user: any) {
    const exists = await this.prisma.itemCategory.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Category ${dto.code} already exists`);

    const cat = await this.prisma.itemCategory.create({
      data: { ...dto, code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: { parent: { select: { id: true, name: true, code: true } } },
    });
    await this.audit.log({ tableName: 'item_categories', recordId: cat.id, action: 'CREATE', newValues: cat, changedBy: user.id });
    return cat;
  }

  async findAllCategories(user: any) {
    return this.prisma.itemCategory.findMany({
      where: { companyId: user.companyId, isActive: true },
      include: {
        parent:   { select: { id: true, name: true, code: true } },
        children: { select: { id: true, name: true, code: true } },
        _count:   { select: { items: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, user: any) {
    const cat = await this.prisma.itemCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    const updated = await this.prisma.itemCategory.update({
      where: { id }, data: { ...dto, updatedBy: user.id },
      include: { parent: { select: { id: true, name: true } } },
    });
    await this.audit.log({ tableName: 'item_categories', recordId: id, action: 'UPDATE', oldValues: cat, newValues: dto, changedBy: user.id });
    return updated;
  }

  // ── ITEM ─────────────────────────────────────────────────────

  async createItem(dto: CreateItemDto, user: any) {
    const exists = await this.prisma.item.findUnique({
      where: { companyId_itemCode: { companyId: user.companyId, itemCode: dto.itemCode.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Item ${dto.itemCode} already exists`);

    const uom = await this.prisma.unitOfMeasure.findUnique({ where: { id: dto.uomId } });
    if (!uom) throw new NotFoundException('UOM not found');

    const item = await this.prisma.item.create({
      data: { ...dto, itemCode: dto.itemCode.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: this.itemIncludes(),
    });
    await this.audit.log({ tableName: 'items', recordId: item.id, action: 'CREATE', newValues: { itemCode: item.itemCode, itemName: item.itemName }, changedBy: user.id });
    return item;
  }

  async findAllItems(user: any, filters: { itemType?: string; categoryId?: string; search?: string; status?: string }) {
    const where: any = { companyId: user.companyId };
    if (filters.itemType)   where.itemType   = filters.itemType;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status)     where.status     = filters.status;
    if (filters.search) {
      where.OR = [
        { itemCode: { contains: filters.search.toUpperCase(), mode: 'insensitive' } },
        { itemName: { contains: filters.search, mode: 'insensitive' } },
        { shortName:{ contains: filters.search, mode: 'insensitive' } },
        { hsnCode:  { contains: filters.search, mode: 'insensitive' } },
        { barcode:  { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.item.findMany({ where, include: this.itemIncludes(), orderBy: { itemCode: 'asc' } });
  }

  async findOneItem(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id }, include: this.itemIncludes() });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async updateItem(id: string, dto: UpdateItemDto, user: any) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    const updated = await this.prisma.item.update({ where: { id }, data: { ...dto, updatedBy: user.id }, include: this.itemIncludes() });
    await this.audit.log({ tableName: 'items', recordId: id, action: 'UPDATE', oldValues: item, newValues: dto, changedBy: user.id });
    return updated;
  }

  async toggleItemStatus(id: string, user: any) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.prisma.item.update({ where: { id }, data: { status: newStatus as any, updatedBy: user.id } });
  }

  async getStats(user: any) {
    const base = { companyId: user.companyId };
    const [total, active, byType] = await Promise.all([
      this.prisma.item.count({ where: base }),
      this.prisma.item.count({ where: { ...base, status: 'ACTIVE' } }),
      this.prisma.item.groupBy({ by: ['itemType'], where: base, _count: { id: true } }),
    ]);
    return { total, active, byType };
  }

  private itemIncludes() {
    return {
      uom:         { select: { id: true, code: true, name: true } },
      purchaseUom: { select: { id: true, code: true, name: true } },
      salesUom:    { select: { id: true, code: true, name: true } },
      category:    { select: { id: true, code: true, name: true } },
    };
  }
}
