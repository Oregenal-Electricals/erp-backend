import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateImportPoDto, UpdateImportPoDto, ImportPoItemDto } from './dto/import-order.dto';

@Injectable()
export class ImportOrderService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateIpoNumber(companyId: string): Promise<string> {
    const count = await this.prisma.importPurchaseOrder.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `IPO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      vendor: { select: { code: true, name: true, gstin: true, email: true, phone: true } },
      pr: { select: { prNumber: true, title: true } },
      items: { where: { isActive: true }, orderBy: { sequence: 'asc' as const } },
    };
  }

  private calcItem(unitPriceForeign: number, qty: number, exchangeRate: number, discount = 0, taxRate = 0, bcdRate = 0) {
    const afterDiscount = unitPriceForeign * qty * (1 - discount / 100);
    const unitPriceInr = unitPriceForeign * exchangeRate;
    const totalForeign = afterDiscount;
    const totalInrBase = afterDiscount * exchangeRate;
    const bcdAmount = totalInrBase * bcdRate / 100;
    const igstAmount = (totalInrBase + bcdAmount) * taxRate / 100;
    const taxAmount = bcdAmount + igstAmount;
    const totalInr = totalInrBase + taxAmount;
    return { unitPriceInr, totalForeign, totalInr, taxAmount, igstRate: taxRate, bcdRate };
  }

  async create(dto: CreateImportPoDto, user: any) {
    const vendor = await this.prisma.vendor.findFirst({ where: { id: dto.vendorId, companyId: user.companyId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    const ipoNumber = await this.generateIpoNumber(user.companyId);
    const { items, ...poData } = dto;

    const itemsData = (items || []).map((item, idx) => {
      const calc = this.calcItem(item.unitPriceForeign, item.orderedQty, dto.exchangeRate, item.discount || 0, item.taxRate || 0, item.bcdRate || 0);
      return {
        ...item, ...calc,
        sequence: item.sequence || idx + 1,
        pendingQty: item.orderedQty,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      };
    });

    const subtotalForeign = itemsData.reduce((s, i) => s + i.totalForeign, 0);
    const subtotalInr = itemsData.reduce((s, i) => s + i.totalInr - i.taxAmount, 0);
    const totalTax = itemsData.reduce((s, i) => s + i.taxAmount, 0);
    const totalAmount = subtotalInr + totalTax;

    const ipo = await this.prisma.importPurchaseOrder.create({
      data: {
        ...poData,
        deliveryDate: new Date(dto.deliveryDate),
        ipoNumber, companyId: user.companyId,
        subtotalForeign, subtotalInr, totalTax, totalAmount,
        createdBy: user.id, updatedBy: user.id,
        items: itemsData.length > 0 ? { create: itemsData } : undefined,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'import_purchase_orders', recordId: ipo.id, action: 'CREATE', newValues: ipo, changedBy: user.id });
    return ipo;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, currency } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { ipoNumber: { contains: search, mode: 'insensitive' } },
      { vendor: { name: { contains: search, mode: 'insensitive' } } },
    ];
    if (status) where.status = status;
    if (currency) where.currency = currency;

    const [data, total] = await Promise.all([
      this.prisma.importPurchaseOrder.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { vendor: { select: { code: true, name: true } }, _count: { select: { items: true } } },
      }),
      this.prisma.importPurchaseOrder.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const ipo = await this.prisma.importPurchaseOrder.findFirst({ where, include: this.includes() });
    if (!ipo) throw new NotFoundException('Import PO not found');
    return ipo;
  }

  async update(id: string, dto: UpdateImportPoDto, user: any) {
    const ipo = await this.findOne(id, user);
    if (!['DRAFT'].includes(ipo.status)) throw new BadRequestException('Only DRAFT Import POs can be edited');
    const updated = await this.prisma.importPurchaseOrder.update({
      where: { id },
      data: { ...dto, deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'import_purchase_orders', recordId: id, action: 'UPDATE', oldValues: ipo, newValues: updated, changedBy: user.id });
    return updated;
  }

  async approve(id: string, user: any) {
    const ipo = await this.findOne(id, user);
    if (ipo.status !== 'DRAFT') throw new BadRequestException('Only DRAFT Import POs can be approved');
    const itemCount = await this.prisma.importPoItem.count({ where: { ipoId: id, isActive: true } });
    if (itemCount === 0) throw new BadRequestException('Cannot approve Import PO with no items');
    const updated = await this.prisma.importPurchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'import_purchase_orders', recordId: id, action: 'UPDATE', oldValues: ipo, newValues: updated, changedBy: user.id });
    return updated;
  }

  async updateStatus(id: string, status: string, user: any) {
    const ipo = await this.findOne(id, user);
    const validTransitions: Record<string, string[]> = {
      APPROVED: ['SENT'],
      SENT: ['PROFORMA_RECEIVED'],
      PROFORMA_RECEIVED: ['LC_OPENED'],
      LC_OPENED: ['SHIPPED'],
      SHIPPED: ['CUSTOMS_CLEARED'],
      CUSTOMS_CLEARED: ['CLOSED'],
    };
    if (!validTransitions[ipo.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${ipo.status} to ${status}`);
    }
    const updated = await this.prisma.importPurchaseOrder.update({
      where: { id }, data: { status, updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'import_purchase_orders', recordId: id, action: 'UPDATE', oldValues: ipo, newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, user: any) {
    const ipo = await this.findOne(id, user);
    if (['CLOSED', 'CANCELLED'].includes(ipo.status)) throw new BadRequestException('Cannot cancel closed or cancelled Import PO');
    const updated = await this.prisma.importPurchaseOrder.update({
      where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'import_purchase_orders', recordId: id, action: 'UPDATE', oldValues: ipo, newValues: updated, changedBy: user.id });
    return updated;
  }

  async addItem(id: string, dto: ImportPoItemDto, user: any) {
    const ipo = await this.findOne(id, user);
    if (ipo.status !== 'DRAFT') throw new BadRequestException('Cannot add items to non-DRAFT Import PO');
    const seq = (ipo.items?.length || 0) + 1;
    const calc = this.calcItem(dto.unitPriceForeign, dto.orderedQty, ipo.exchangeRate, dto.discount || 0, dto.taxRate || 0, dto.bcdRate || 0);
    const item = await this.prisma.importPoItem.create({
      data: {
        ...dto, ...calc, ipoId: id, sequence: dto.sequence || seq,
        pendingQty: dto.orderedQty, companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
      },
    });
    await this.recalcTotals(id);
    return item;
  }

  private async recalcTotals(ipoId: string) {
    const items = await this.prisma.importPoItem.findMany({ where: { ipoId, isActive: true } });
    const subtotalForeign = items.reduce((s, i) => s + i.totalForeign, 0);
    const subtotalInr = items.reduce((s, i) => s + i.totalInr - i.taxAmount, 0);
    const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);
    await this.prisma.importPurchaseOrder.update({ where: { id: ipoId }, data: { subtotalForeign, subtotalInr, totalTax, totalAmount: subtotalInr + totalTax } });
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, approved, shipped, closed, cancelled] = await Promise.all([
      this.prisma.importPurchaseOrder.count({ where }),
      this.prisma.importPurchaseOrder.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.importPurchaseOrder.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.importPurchaseOrder.count({ where: { ...where, status: 'SHIPPED' } }),
      this.prisma.importPurchaseOrder.count({ where: { ...where, status: 'CLOSED' } }),
      this.prisma.importPurchaseOrder.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const totalValue = await this.prisma.importPurchaseOrder.aggregate({ where, _sum: { totalAmount: true, subtotalForeign: true } });
    const byCurrency = await this.prisma.importPurchaseOrder.groupBy({ by: ['currency'], where, _count: true, _sum: { subtotalForeign: true } });
    return { total, draft, approved, shipped, closed, cancelled, totalValueInr: totalValue._sum.totalAmount || 0, totalValueForeign: totalValue._sum.subtotalForeign || 0, byCurrency };
  }
}
