import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProformaInvoiceDto, UpdateProformaInvoiceDto, PiItemDto, RejectPiDto } from './dto/proforma-invoice.dto';

@Injectable()
export class ProformaInvoiceService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generatePiNumber(companyId: string): Promise<string> {
    const count = await this.prisma.proformaInvoice.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PI-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      ipo: { select: { ipoNumber: true, currency: true, exchangeRate: true, status: true, vendor: { select: { code: true, name: true } } } },
      items: { where: { isActive: true }, orderBy: { sequence: 'asc' as const } },
    };
  }

  async create(dto: CreateProformaInvoiceDto, user: any) {
    const ipo = await this.prisma.importPurchaseOrder.findFirst({
      where: { id: dto.ipoId, companyId: user.companyId },
    });
    if (!ipo) throw new NotFoundException('Import PO not found');
    if (!['SENT', 'PROFORMA_RECEIVED'].includes(ipo.status)) {
      throw new BadRequestException('Import PO must be SENT before receiving Proforma Invoice');
    }

    const piNumber = await this.generatePiNumber(user.companyId);
    const { items, ...piData } = dto;

    const itemsData = (items || []).map((item, idx) => {
      const totalForeign = item.unitPriceForeign * item.qty;
      const totalInr = totalForeign * ipo.exchangeRate;
      return {
        ...item, totalForeign, totalInr,
        sequence: item.sequence || idx + 1,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      };
    });

    const subtotalForeign = itemsData.reduce((s, i) => s + i.totalForeign, 0);
    const totalAmount = subtotalForeign * ipo.exchangeRate;

    const pi = await this.prisma.proformaInvoice.create({
      data: {
        ...piData,
        piNumber,
        currency: ipo.currency,
        exchangeRate: ipo.exchangeRate,
        subtotalForeign,
        totalAmount,
        piDate: dto.piDate ? new Date(dto.piDate) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        status: 'RECEIVED',
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
        items: itemsData.length > 0 ? { create: itemsData } : undefined,
      },
      include: this.includes(),
    });

    // Update IPO status to PROFORMA_RECEIVED
    await this.prisma.importPurchaseOrder.update({
      where: { id: dto.ipoId },
      data: { status: 'PROFORMA_RECEIVED', updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'proforma_invoices', recordId: pi.id, action: 'CREATE', newValues: pi, changedBy: user.id });
    return pi;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { piNumber: { contains: search, mode: 'insensitive' } },
      { vendorPiNumber: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.proformaInvoice.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          ipo: { select: { ipoNumber: true, currency: true, vendor: { select: { code: true, name: true } } } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.proformaInvoice.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const pi = await this.prisma.proformaInvoice.findFirst({ where, include: this.includes() });
    if (!pi) throw new NotFoundException('Proforma Invoice not found');
    return pi;
  }

  async findByIpo(ipoId: string, user: any) {
    const where: any = { ipoId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.proformaInvoice.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: this.includes(),
    });
  }

  async update(id: string, dto: UpdateProformaInvoiceDto, user: any) {
    const pi = await this.findOne(id, user);
    if (pi.status === 'ACCEPTED') throw new BadRequestException('Cannot edit an accepted Proforma Invoice');
    const updated = await this.prisma.proformaInvoice.update({
      where: { id },
      data: { ...dto, validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'proforma_invoices', recordId: id, action: 'UPDATE', oldValues: pi, newValues: updated, changedBy: user.id });
    return updated;
  }

  async accept(id: string, user: any) {
    const pi = await this.findOne(id, user);
    if (pi.status !== 'RECEIVED') throw new BadRequestException('Only RECEIVED Proforma Invoices can be accepted');
    const updated = await this.prisma.proformaInvoice.update({
      where: { id }, data: { status: 'ACCEPTED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'proforma_invoices', recordId: id, action: 'UPDATE', oldValues: pi, newValues: updated, changedBy: user.id });
    return updated;
  }

  async reject(id: string, dto: RejectPiDto, user: any) {
    const pi = await this.findOne(id, user);
    if (pi.status !== 'RECEIVED') throw new BadRequestException('Only RECEIVED Proforma Invoices can be rejected');
    const updated = await this.prisma.proformaInvoice.update({
      where: { id }, data: { status: 'REJECTED', rejectionReason: dto.rejectionReason, updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'proforma_invoices', recordId: id, action: 'UPDATE', oldValues: pi, newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, received, accepted, rejected] = await Promise.all([
      this.prisma.proformaInvoice.count({ where }),
      this.prisma.proformaInvoice.count({ where: { ...where, status: 'RECEIVED' } }),
      this.prisma.proformaInvoice.count({ where: { ...where, status: 'ACCEPTED' } }),
      this.prisma.proformaInvoice.count({ where: { ...where, status: 'REJECTED' } }),
    ]);
    const totalValue = await this.prisma.proformaInvoice.aggregate({ where, _sum: { totalAmount: true, subtotalForeign: true } });
    return { total, received, accepted, rejected, totalValueInr: totalValue._sum.totalAmount || 0, totalValueForeign: totalValue._sum.subtotalForeign || 0 };
  }
}
