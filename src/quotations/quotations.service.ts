import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateQuotationDto, UpdateQuotationDto, RejectQuotationDto, QuotationItemDto } from './dto/quotation.dto';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.quotation.count({ where: { companyId, revision: 0 } });
    const year = new Date().getFullYear();
    return `QT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private calcItem(item: QuotationItemDto) {
    const qty = item.qty || 0;
    const unitPrice = item.unitPrice || 0;
    const discountPct = item.discount || 0;
    const gstRate = item.gstRate ?? 18;
    const grossAmt = qty * unitPrice;
    const discountAmt = Math.round(grossAmt * discountPct / 100 * 100) / 100;
    const taxableAmt = Math.round((grossAmt - discountAmt) * 100) / 100;
    const gstAmount = Math.round(taxableAmt * gstRate / 100 * 100) / 100;
    // Assuming intra-state: CGST + SGST (split equally)
    const cgst = Math.round(gstAmount / 2 * 100) / 100;
    const sgst = Math.round(gstAmount / 2 * 100) / 100;
    const totalAmount = Math.round((taxableAmt + gstAmount) * 100) / 100;
    return { discountAmt, taxableAmt, gstAmount, cgst, sgst, igst: 0, totalAmount };
  }

  private calcTotals(items: any[]) {
    const subtotal = items.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    const discountAmount = items.reduce((s, i) => s + i.discountAmt, 0);
    const taxableAmount = items.reduce((s, i) => s + i.taxableAmt, 0);
    const totalGst = items.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = items.reduce((s, i) => s + i.totalAmount, 0);
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  private includes() {
    return { items: true, lead: { select: { leadNumber: true, companyName: true } } };
  }

  async create(dto: CreateQuotationDto, user: any) {
    const quotationNumber = await this.generateNumber(user.companyId);

    // Calculate items
    const calcItems = dto.items.map(item => ({
      itemCode: item.itemCode, itemName: item.itemName, description: item.description,
      qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice,
      discount: item.discount || 0, gstRate: item.gstRate ?? 18,
      ...this.calcItem(item),
      createdBy: user.id, updatedBy: user.id,
    }));

    const totals = this.calcTotals(calcItems);

    const quotation = await this.prisma.quotation.create({
      data: {
        quotationNumber, revision: 0,
        leadId: dto.leadId, customerName: dto.customerName,
        customerEmail: dto.customerEmail, customerPhone: dto.customerPhone,
        customerAddress: dto.customerAddress,
        validUntil: new Date(dto.validUntil),
        currency: dto.currency || 'INR',
        termsConditions: dto.termsConditions, notes: dto.notes,
        ...totals,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: { create: calcItems },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'quotations', recordId: quotation.id, action: 'CREATE', newValues: quotation, changedBy: user.id });
    return quotation;
  }

  async revise(id: string, dto: CreateQuotationDto, user: any) {
    const original = await this.prisma.quotation.findFirst({ where: { id, companyId: user.companyId } });
    if (!original) throw new NotFoundException('Quotation not found');
    if (!['SENT','REJECTED'].includes(original.status)) throw new BadRequestException('Can only revise SENT or REJECTED quotations');

    const calcItems = dto.items.map(item => ({
      itemCode: item.itemCode, itemName: item.itemName, description: item.description,
      qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice,
      discount: item.discount || 0, gstRate: item.gstRate ?? 18,
      ...this.calcItem(item),
      createdBy: user.id, updatedBy: user.id,
    }));

    const totals = this.calcTotals(calcItems);

    const revised = await this.prisma.quotation.create({
      data: {
        quotationNumber: original.quotationNumber,
        revision: original.revision + 1,
        leadId: original.leadId, customerName: dto.customerName || original.customerName,
        customerEmail: dto.customerEmail, customerPhone: dto.customerPhone,
        customerAddress: dto.customerAddress,
        validUntil: new Date(dto.validUntil),
        currency: original.currency,
        termsConditions: dto.termsConditions, notes: dto.notes,
        ...totals,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: { create: calcItems },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'quotations', recordId: revised.id, action: 'CREATE', newValues: revised, changedBy: user.id });
    return revised;
  }

  async send(id: string, user: any) {
    const qt = await this.prisma.quotation.findFirst({ where: { id, companyId: user.companyId } });
    if (!qt) throw new NotFoundException('Quotation not found');
    if (qt.status !== 'DRAFT') throw new BadRequestException('Only DRAFT quotations can be sent');

    const updated = await this.prisma.quotation.update({
      where: { id }, data: { status: 'SENT', sentDate: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'quotations', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async accept(id: string, user: any) {
    const qt = await this.prisma.quotation.findFirst({ where: { id, companyId: user.companyId } });
    if (!qt) throw new NotFoundException('Quotation not found');
    if (qt.status !== 'SENT') throw new BadRequestException('Only SENT quotations can be accepted');

    const updated = await this.prisma.quotation.update({
      where: { id }, data: { status: 'ACCEPTED', acceptedDate: new Date(), updatedBy: user.id },
      include: this.includes(),
    });

    // Update lead status to CONVERTED if linked
    if (qt.leadId) {
      await this.prisma.lead.update({ where: { id: qt.leadId }, data: { status: 'CONVERTED', convertedToQuoteId: id, updatedBy: user.id } });
    }

    await this.audit.log({ tableName: 'quotations', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async reject(id: string, dto: RejectQuotationDto, user: any) {
    const qt = await this.prisma.quotation.findFirst({ where: { id, companyId: user.companyId } });
    if (!qt) throw new NotFoundException('Quotation not found');
    if (qt.status !== 'SENT') throw new BadRequestException('Only SENT quotations can be rejected');

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'REJECTED', rejectedDate: new Date(), rejectedReason: dto.rejectedReason, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'quotations', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search) where.OR = [
      { quotationNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where, skip, take: Number(limit),
        orderBy: [{ quotationNumber: 'desc' }, { revision: 'desc' }],
        include: { items: { select: { id: true } }, lead: { select: { leadNumber: true } } },
      }),
      this.prisma.quotation.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const qt = await this.prisma.quotation.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!qt) throw new NotFoundException('Quotation not found');
    return qt;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, draft, sent, accepted, rejected, expired] = await Promise.all([
      this.prisma.quotation.count({ where }),
      this.prisma.quotation.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.quotation.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.quotation.count({ where: { ...where, status: 'ACCEPTED' } }),
      this.prisma.quotation.count({ where: { ...where, status: 'REJECTED' } }),
      this.prisma.quotation.count({ where: { ...where, status: 'EXPIRED' } }),
    ]);
    const valueAgg = await this.prisma.quotation.aggregate({ where: { ...where, status: 'SENT' }, _sum: { totalAmount: true } });
    return { total, draft, sent, accepted, rejected, expired, pendingValue: valueAgg._sum.totalAmount || 0 };
  }
}
