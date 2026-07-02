import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCpoDto, CancelCpoDto } from './dto/customer-po.dto';

@Injectable()
export class CustomerPoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.customerPo.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `CPO-${year}-${String(count + 1).padStart(4, '0')}`;
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
      quotation: { select: { quotationNumber: true, revision: true, totalAmount: true } },
    };
  }

  async create(dto: CreateCpoDto, user: any) {
    // Validate quotation if provided
    if (dto.quotationId) {
      const qt = await this.prisma.quotation.findFirst({ where: { id: dto.quotationId, companyId: user.companyId } });
      if (!qt) throw new NotFoundException('Quotation not found');
      if (qt.status !== 'ACCEPTED') throw new BadRequestException('Quotation must be ACCEPTED to create CPO');
    }

    const cpoNumber = await this.generateNumber(user.companyId);

    const calcItems = dto.items.map(item => ({
      itemCode: item.itemCode, itemName: item.itemName, description: item.description,
      qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice,
      discount: item.discount || 0, gstRate: item.gstRate ?? 18,
      ...this.calcItem(item),
      createdBy: user.id, updatedBy: user.id,
    }));

    const subtotal = calcItems.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);

    const cpo = await this.prisma.customerPo.create({
      data: {
        cpoNumber, customerPoNumber: dto.customerPoNumber,
        quotationId: dto.quotationId,
        customerName: dto.customerName, customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone, deliveryAddress: dto.deliveryAddress,
        poDate: new Date(dto.poDate), deliveryDate: new Date(dto.deliveryDate),
        currency: dto.currency || 'INR', remarks: dto.remarks,
        subtotal: Math.round(subtotal * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: { create: calcItems },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'customer_pos', recordId: cpo.id, action: 'CREATE', newValues: cpo, changedBy: user.id });
    return cpo;
  }

  async acknowledge(id: string, user: any) {
    const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId } });
    if (!cpo) throw new NotFoundException('CPO not found');
    if (cpo.status !== 'RECEIVED') throw new BadRequestException('Only RECEIVED CPOs can be acknowledged');

    const updated = await this.prisma.customerPo.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED', acknowledgedDate: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, dto: CancelCpoDto, user: any) {
    const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId } });
    if (!cpo) throw new NotFoundException('CPO not found');
    if (['COMPLETED','CANCELLED'].includes(cpo.status)) throw new BadRequestException(`Cannot cancel ${cpo.status} CPO`);

    const updated = await this.prisma.customerPo.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledDate: new Date(), cancelReason: dto.cancelReason, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search) where.OR = [
      { cpoNumber: { contains: search, mode: 'insensitive' } },
      { customerPoNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.customerPo.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { items: { select: { id: true, itemCode: true, qty: true, deliveredQty: true, pendingQty: true } }, quotation: { select: { quotationNumber: true } } },
      }),
      this.prisma.customerPo.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!cpo) throw new NotFoundException('CPO not found');
    return cpo;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, received, acknowledged, inProgress, completed, cancelled] = await Promise.all([
      this.prisma.customerPo.count({ where }),
      this.prisma.customerPo.count({ where: { ...where, status: 'RECEIVED' } }),
      this.prisma.customerPo.count({ where: { ...where, status: 'ACKNOWLEDGED' } }),
      this.prisma.customerPo.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.customerPo.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.customerPo.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const valueAgg = await this.prisma.customerPo.aggregate({
      where: { ...where, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true },
    });
    const overdueCount = await this.prisma.customerPo.count({
      where: { ...where, status: { in: ['ACKNOWLEDGED','IN_PROGRESS'] }, deliveryDate: { lt: new Date() } },
    });
    return { total, received, acknowledged, inProgress, completed, cancelled, overdueCount, totalOrderValue: valueAgg._sum.totalAmount || 0 };
  }
}
