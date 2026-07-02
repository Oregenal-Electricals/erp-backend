import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateSoDto, CancelSoDto } from './dto/sales-order.dto';

@Injectable()
export class SalesOrdersService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.salesOrder.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `SO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private calcItem(item: any) {
    const qty = item.qty || 0;
    const unitPrice = item.unitPrice || 0;
    const discount = item.discount || 0;
    const gstRate = item.gstRate ?? 18;
    const gross = qty * unitPrice;
    const discAmt = Math.round(gross * discount / 100 * 100) / 100;
    const taxableAmt = Math.round((gross - discAmt) * 100) / 100;
    const gstAmount = Math.round(taxableAmt * gstRate / 100 * 100) / 100;
    const totalAmount = Math.round((taxableAmt + gstAmount) * 100) / 100;
    return { taxableAmt, gstAmount, totalAmount, pendingQty: qty };
  }

  private includes() {
    return {
      items: true,
      cpo: { select: { cpoNumber: true, customerPoNumber: true, deliveryDate: true, status: true } },
    };
  }

  async create(dto: CreateSoDto, user: any) {
    const cpo = await this.prisma.customerPo.findFirst({ where: { id: dto.cpoId, companyId: user.companyId } });
    if (!cpo) throw new NotFoundException('Customer PO not found');
    if (!['ACKNOWLEDGED','IN_PROGRESS'].includes(cpo.status)) throw new BadRequestException('CPO must be ACKNOWLEDGED or IN_PROGRESS');

    const soNumber = await this.generateNumber(user.companyId);

    const calcItems = dto.items.map(item => ({
      cpoItemId: item.cpoItemId, itemCode: item.itemCode, itemName: item.itemName,
      description: item.description, qty: item.qty, uom: item.uom || 'PCS',
      unitPrice: item.unitPrice, discount: item.discount || 0, gstRate: item.gstRate ?? 18,
      ...this.calcItem(item),
      createdBy: user.id, updatedBy: user.id,
    }));

    const subtotal = calcItems.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);

    const so = await this.prisma.salesOrder.create({
      data: {
        soNumber, cpoId: dto.cpoId, customerName: cpo.customerName,
        deliveryDate: new Date(dto.deliveryDate),
        currency: cpo.currency, remarks: dto.remarks,
        subtotal: Math.round(subtotal * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: { create: calcItems },
      },
      include: this.includes(),
    });

    // Update CPO status to IN_PROGRESS
    await this.prisma.customerPo.update({
      where: { id: dto.cpoId },
      data: { status: 'IN_PROGRESS', updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'sales_orders', recordId: so.id, action: 'CREATE', newValues: so, changedBy: user.id });
    return so;
  }

  async confirm(id: string, user: any) {
    const so = await this.prisma.salesOrder.findFirst({ where: { id, companyId: user.companyId } });
    if (!so) throw new NotFoundException('Sales Order not found');
    if (so.status !== 'DRAFT') throw new BadRequestException('Only DRAFT sales orders can be confirmed');

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedDate: new Date(), confirmedBy: user.id, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'sales_orders', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, dto: CancelSoDto, user: any) {
    const so = await this.prisma.salesOrder.findFirst({ where: { id, companyId: user.companyId } });
    if (!so) throw new NotFoundException('Sales Order not found');
    if (['COMPLETED','CANCELLED'].includes(so.status)) throw new BadRequestException(`Cannot cancel ${so.status} SO`);
    if (so.status === 'DISPATCHED') throw new BadRequestException('Cannot cancel partially dispatched SO');

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledDate: new Date(), cancelReason: dto.cancelReason, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'sales_orders', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search) where.OR = [
      { soNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { items: { select: { id: true, itemCode: true, qty: true, dispatchedQty: true, pendingQty: true } }, cpo: { select: { cpoNumber: true, customerPoNumber: true } } },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const so = await this.prisma.salesOrder.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!so) throw new NotFoundException('Sales Order not found');
    return so;
  }

  async getByCpo(cpoId: string, user: any) {
    return this.prisma.salesOrder.findMany({
      where: { cpoId, companyId: user.companyId },
      include: this.includes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, draft, confirmed, inProduction, dispatched, completed, cancelled, overdue] = await Promise.all([
      this.prisma.salesOrder.count({ where }),
      this.prisma.salesOrder.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.salesOrder.count({ where: { ...where, status: 'CONFIRMED' } }),
      this.prisma.salesOrder.count({ where: { ...where, status: 'IN_PRODUCTION' } }),
      this.prisma.salesOrder.count({ where: { ...where, status: 'DISPATCHED' } }),
      this.prisma.salesOrder.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.salesOrder.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.salesOrder.count({ where: { ...where, status: { in: ['CONFIRMED','IN_PRODUCTION'] }, deliveryDate: { lt: new Date() } } }),
    ]);
    const valueAgg = await this.prisma.salesOrder.aggregate({
      where: { ...where, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true },
    });
    return { total, draft, confirmed, inProduction, dispatched, completed, cancelled, overdue, totalValue: valueAgg._sum.totalAmount || 0 };
  }
}
