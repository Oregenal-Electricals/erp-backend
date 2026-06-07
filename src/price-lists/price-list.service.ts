import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePriceListDto, UpdatePriceListDto, CreatePriceListItemDto, UpdatePriceListItemDto } from './dto/price-list.dto';

@Injectable()
export class PriceListService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ── PRICE LISTS ─────────────────────────────────────────────
  async create(dto: CreatePriceListDto, user: any) {
    const exists = await this.prisma.priceList.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Price list code ${dto.code} already exists`);

    const pl = await this.prisma.priceList.create({
      data: { ...dto, code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'price_lists', recordId: pl.id, action: 'CREATE', newValues: pl, changedBy: user.id });
    return pl;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, listType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
    if (listType) where.listType = listType;
    const [data, total] = await Promise.all([
      this.prisma.priceList.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { _count: { select: { items: true } } } }),
      this.prisma.priceList.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const pl = await this.prisma.priceList.findFirst({ where, include: { items: { where: { isActive: true }, orderBy: { itemCode: 'asc' } } } });
    if (!pl) throw new NotFoundException('Price list not found');
    return pl;
  }

  async update(id: string, dto: UpdatePriceListDto, user: any) {
    const pl = await this.findOne(id, user);
    const updated = await this.prisma.priceList.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'price_lists', recordId: id, action: 'UPDATE', oldValues: pl, newValues: updated, changedBy: user.id });
    return updated;
  }

  async remove(id: string, user: any) {
    const pl = await this.findOne(id, user);
    const updated = await this.prisma.priceList.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
    await this.audit.log({ tableName: 'price_lists', recordId: id, action: 'DELETE', oldValues: pl, newValues: updated, changedBy: user.id });
    return { message: 'Price list deactivated' };
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, active, sales, purchase] = await Promise.all([
      this.prisma.priceList.count({ where }),
      this.prisma.priceList.count({ where: { ...where, isActive: true } }),
      this.prisma.priceList.count({ where: { ...where, listType: 'SALES', isActive: true } }),
      this.prisma.priceList.count({ where: { ...where, listType: 'PURCHASE', isActive: true } }),
    ]);
    const totalItems = await this.prisma.priceListItem.count({ where: { companyId: user.companyId } });
    return { total, active, inactive: total - active, sales, purchase, totalItems };
  }

  // ── PRICE LIST ITEMS ─────────────────────────────────────────
  async addItem(priceListId: string, dto: CreatePriceListItemDto, user: any) {
    await this.findOne(priceListId, user);
    const item = await this.prisma.priceListItem.create({
      data: { ...dto, priceListId, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'price_list_items', recordId: item.id, action: 'CREATE', newValues: item, changedBy: user.id });
    return item;
  }

  async updateItem(priceListId: string, itemId: string, dto: UpdatePriceListItemDto, user: any) {
    const item = await this.prisma.priceListItem.findFirst({ where: { id: itemId, priceListId } });
    if (!item) throw new NotFoundException('Price list item not found');
    if (item.isApproved) throw new BadRequestException('Cannot modify an approved price. Create a new price entry instead.');
    const updated = await this.prisma.priceListItem.update({ where: { id: itemId }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'price_list_items', recordId: itemId, action: 'UPDATE', oldValues: item, newValues: updated, changedBy: user.id });
    return updated;
  }

  async approveItem(priceListId: string, itemId: string, user: any) {
    const item = await this.prisma.priceListItem.findFirst({ where: { id: itemId, priceListId } });
    if (!item) throw new NotFoundException('Price list item not found');
    if (item.isApproved) throw new BadRequestException('Price already approved');
    const updated = await this.prisma.priceListItem.update({ where: { id: itemId }, data: { isApproved: true, updatedBy: user.id } });
    await this.audit.log({ tableName: 'price_list_items', recordId: itemId, action: 'UPDATE', oldValues: item, newValues: updated, changedBy: user.id });
    return updated;
  }

  async removeItem(priceListId: string, itemId: string, user: any) {
    const item = await this.prisma.priceListItem.findFirst({ where: { id: itemId, priceListId } });
    if (!item) throw new NotFoundException('Price list item not found');
    if (item.isApproved) throw new BadRequestException('Cannot delete an approved price');
    const updated = await this.prisma.priceListItem.update({ where: { id: itemId }, data: { isActive: false, updatedBy: user.id } });
    await this.audit.log({ tableName: 'price_list_items', recordId: itemId, action: 'DELETE', oldValues: item, newValues: updated, changedBy: user.id });
    return { message: 'Price item removed' };
  }
}
