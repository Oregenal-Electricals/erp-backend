import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, PoItemDto, UpdatePoItemDto } from './dto/purchase-order.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generatePoNumber(companyId: string): Promise<string> {
    const count = await this.prisma.purchaseOrder.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      vendor: { select: { code: true, name: true, gstin: true, state: true, email: true, phone: true } },
      pr: { select: { prNumber: true, title: true } },
      rfq: { select: { rfqNumber: true } },
      items: { where: { isActive: true }, orderBy: { sequence: 'asc' as const } },
    };
  }

  private calcGst(taxRate: number, vendorState: string, companyState: string) {
    const isInterState = vendorState && companyState && vendorState.toLowerCase() !== companyState.toLowerCase();
    return {
      igstRate: isInterState ? taxRate : 0,
      cgstRate: isInterState ? 0 : taxRate / 2,
      sgstRate: isInterState ? 0 : taxRate / 2,
    };
  }

  private calcItemAmounts(unitPrice: number, qty: number, discount = 0, taxRate = 0, vendorState = '', companyState = '') {
    const afterDiscount = unitPrice * qty * (1 - discount / 100);
    const gst = this.calcGst(taxRate, vendorState, companyState);
    const taxAmount = afterDiscount * taxRate / 100;
    const totalPrice = afterDiscount + taxAmount;
    return { taxAmount, totalPrice, ...gst };
  }

  async create(dto: CreatePurchaseOrderDto, user: any) {
    const vendor = await this.prisma.vendor.findFirst({ where: { id: dto.vendorId, companyId: user.companyId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    const poNumber = await this.generatePoNumber(user.companyId);
    const { items, ...poData } = dto;

    const itemsData = (items || []).map((item, idx) => {
      const { taxAmount, totalPrice, igstRate, cgstRate, sgstRate } = this.calcItemAmounts(
        item.unitPrice, item.orderedQty, item.discount || 0, item.taxRate || 0,
        vendor.state || '', (company as any)?.state || ''
      );
      return {
        ...item,
        sequence: item.sequence || idx + 1,
        pendingQty: item.orderedQty,
        taxAmount, totalPrice, igstRate, cgstRate, sgstRate,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      };
    });

    const subtotal = itemsData.reduce((s, i) => s + i.unitPrice * i.orderedQty * (1 - (i.discount || 0) / 100), 0);
    const totalTax = itemsData.reduce((s, i) => s + i.taxAmount, 0);
    const totalAmount = subtotal + totalTax;

    const po = await this.prisma.purchaseOrder.create({
      data: {
        ...poData,
        deliveryDate: new Date(dto.deliveryDate),
        poNumber, companyId: user.companyId,
        subtotal, totalTax, totalAmount,
        createdBy: user.id, updatedBy: user.id,
        items: itemsData.length > 0 ? { create: itemsData } : undefined,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'purchase_orders', recordId: po.id, action: 'CREATE', newValues: po, changedBy: user.id });
    return po;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, vendorId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { poNumber: { contains: search, mode: 'insensitive' } },
      { vendor: { name: { contains: search, mode: 'insensitive' } } },
    ];
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { code: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const po = await this.prisma.purchaseOrder.findFirst({ where, include: this.includes() });
    if (!po) throw new NotFoundException('Purchase Order not found');
    return po;
  }

  async findByVendor(vendorId: string, user: any) {
    const where: any = { vendorId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.purchaseOrder.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { vendor: { select: { code: true, name: true } }, _count: { select: { items: true } } },
    });
  }

  async update(id: string, dto: UpdatePurchaseOrderDto, user: any) {
    const po = await this.findOne(id, user);
    if (!['DRAFT'].includes(po.status)) throw new BadRequestException('Only DRAFT POs can be edited');
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { ...dto, deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'purchase_orders', recordId: id, action: 'UPDATE', oldValues: po, newValues: updated, changedBy: user.id });
    return updated;
  }

  async approve(id: string, user: any) {
    const po = await this.findOne(id, user);
    if (po.status !== 'DRAFT') throw new BadRequestException('Only DRAFT POs can be approved');
    if (!po.items || po.items.length === 0) throw new BadRequestException('Cannot approve PO with no items');
    // PRICE FREEZE — prices are now immutable
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'purchase_orders', recordId: id, action: 'UPDATE', oldValues: po, newValues: updated, changedBy: user.id });
    return updated;
  }

  async send(id: string, user: any) {
    const po = await this.findOne(id, user);
    if (po.status !== 'APPROVED') throw new BadRequestException('Only APPROVED POs can be sent');
    const updated = await this.prisma.purchaseOrder.update({
      where: { id }, data: { status: 'SENT', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'purchase_orders', recordId: id, action: 'UPDATE', oldValues: po, newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, user: any) {
    const po = await this.findOne(id, user);
    if (['CLOSED', 'CANCELLED'].includes(po.status)) throw new BadRequestException('Cannot cancel a closed or already cancelled PO');
    const updated = await this.prisma.purchaseOrder.update({
      where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'purchase_orders', recordId: id, action: 'UPDATE', oldValues: po, newValues: updated, changedBy: user.id });
    return updated;
  }

  async addItem(id: string, dto: PoItemDto, user: any) {
    const po = await this.findOne(id, user);
    if (po.status !== 'DRAFT') throw new BadRequestException('Cannot add items to non-DRAFT PO');
    const vendor = await this.prisma.vendor.findUnique({ where: { id: po.vendorId } });
    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    const seq = (po.items?.length || 0) + 1;
    const { taxAmount, totalPrice, igstRate, cgstRate, sgstRate } = this.calcItemAmounts(
      dto.unitPrice, dto.orderedQty, dto.discount || 0, dto.taxRate || 0,
      vendor?.state || '', (company as any)?.state || ''
    );
    const item = await this.prisma.purchaseOrderItem.create({
      data: {
        ...dto, poId: id, sequence: dto.sequence || seq,
        pendingQty: dto.orderedQty, taxAmount, totalPrice, igstRate, cgstRate, sgstRate,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });
    await this.recalculateTotals(id);
    return item;
  }

  async updateItem(id: string, itemId: string, dto: UpdatePoItemDto, user: any) {
    const po = await this.findOne(id, user);
    if (po.status !== 'DRAFT') throw new BadRequestException('Prices are FROZEN — cannot edit items after approval');
    const item = await this.prisma.purchaseOrderItem.findFirst({ where: { id: itemId, poId: id } });
    if (!item) throw new NotFoundException('PO item not found');
    const vendor = await this.prisma.vendor.findUnique({ where: { id: po.vendorId } });
    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    const unitPrice = dto.unitPrice ?? item.unitPrice;
    const orderedQty = dto.orderedQty ?? item.orderedQty;
    const discount = dto.discount ?? item.discount ?? 0;
    const taxRate = dto.taxRate ?? item.taxRate;
    const { taxAmount, totalPrice, igstRate, cgstRate, sgstRate } = this.calcItemAmounts(
      unitPrice, orderedQty, discount, taxRate, vendor?.state || '', (company as any)?.state || ''
    );
    const updated = await this.prisma.purchaseOrderItem.update({
      where: { id: itemId },
      data: { ...dto, pendingQty: orderedQty - item.receivedQty, taxAmount, totalPrice, igstRate, cgstRate, sgstRate, updatedBy: user.id },
    });
    await this.recalculateTotals(id);
    return updated;
  }

  async removeItem(id: string, itemId: string, user: any) {
    const po = await this.findOne(id, user);
    if (po.status !== 'DRAFT') throw new BadRequestException('Cannot remove items from non-DRAFT PO');
    await this.prisma.purchaseOrderItem.update({ where: { id: itemId }, data: { isActive: false, updatedBy: user.id } });
    await this.recalculateTotals(id);
    return { message: 'Item removed' };
  }

  private async recalculateTotals(poId: string) {
    const items = await this.prisma.purchaseOrderItem.findMany({ where: { poId, isActive: true } });
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.orderedQty * (1 - (i.discount || 0) / 100), 0);
    const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);
    await this.prisma.purchaseOrder.update({ where: { id: poId }, data: { subtotal, totalTax, totalAmount: subtotal + totalTax } });
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, approved, sent, partiallyReceived, closed, cancelled] = await Promise.all([
      this.prisma.purchaseOrder.count({ where }),
      this.prisma.purchaseOrder.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.purchaseOrder.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.purchaseOrder.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.purchaseOrder.count({ where: { ...where, status: 'PARTIALLY_RECEIVED' } }),
      this.prisma.purchaseOrder.count({ where: { ...where, status: 'CLOSED' } }),
      this.prisma.purchaseOrder.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const totalValue = await this.prisma.purchaseOrder.aggregate({ where, _sum: { totalAmount: true } });
    return { total, draft, approved, sent, partiallyReceived, closed, cancelled, totalValue: totalValue._sum.totalAmount || 0 };
  }
}
