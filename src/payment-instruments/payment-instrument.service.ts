import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePaymentInstrumentDto, UpdatePaymentInstrumentDto } from './dto/payment-instrument.dto';

@Injectable()
export class PaymentInstrumentService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(type: string, companyId: string): Promise<string> {
    const count = await this.prisma.paymentInstrument.count({ where: { companyId, instrumentType: type } });
    const year = new Date().getFullYear();
    return `${type}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      ipo: { select: { ipoNumber: true, currency: true, status: true, vendor: { select: { code: true, name: true } } } },
      pi: { select: { piNumber: true, vendorPiNumber: true } },
    };
  }

  async create(dto: CreatePaymentInstrumentDto, user: any) {
    const ipo = await this.prisma.importPurchaseOrder.findFirst({
      where: { id: dto.ipoId, companyId: user.companyId },
    });
    if (!ipo) throw new NotFoundException('Import PO not found');
    if (!['PROFORMA_RECEIVED', 'LC_OPENED'].includes(ipo.status)) {
      throw new BadRequestException('Import PO must have Proforma Invoice received before opening LC/TT');
    }

    const instrumentNumber = await this.generateNumber(dto.instrumentType, user.companyId);

    const instrument = await this.prisma.paymentInstrument.create({
      data: {
        ...dto,
        instrumentNumber,
        currency: ipo.currency,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        latestShipmentDate: dto.latestShipmentDate ? new Date(dto.latestShipmentDate) : undefined,
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'payment_instruments', recordId: instrument.id, action: 'CREATE', newValues: instrument, changedBy: user.id });
    return instrument;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, instrumentType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { instrumentNumber: { contains: search, mode: 'insensitive' } },
      { bankName: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (instrumentType) where.instrumentType = instrumentType;

    const [data, total] = await Promise.all([
      this.prisma.paymentInstrument.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { ipo: { select: { ipoNumber: true, currency: true, vendor: { select: { code: true, name: true } } } } },
      }),
      this.prisma.paymentInstrument.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const inst = await this.prisma.paymentInstrument.findFirst({ where, include: this.includes() });
    if (!inst) throw new NotFoundException('Payment Instrument not found');
    return inst;
  }

  async findByIpo(ipoId: string, user: any) {
    const where: any = { ipoId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.paymentInstrument.findMany({ where, orderBy: { createdAt: 'desc' }, include: this.includes() });
  }

  async update(id: string, dto: UpdatePaymentInstrumentDto, user: any) {
    const inst = await this.findOne(id, user);
    if (['SETTLED', 'CANCELLED'].includes(inst.status)) throw new BadRequestException('Cannot edit settled or cancelled instrument');
    const updated = await this.prisma.paymentInstrument.update({
      where: { id },
      data: {
        ...dto,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        latestShipmentDate: dto.latestShipmentDate ? new Date(dto.latestShipmentDate) : undefined,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'payment_instruments', recordId: id, action: 'UPDATE', oldValues: inst, newValues: updated, changedBy: user.id });
    return updated;
  }

  async open(id: string, user: any) {
    const inst = await this.findOne(id, user);
    if (inst.status !== 'DRAFT') throw new BadRequestException('Only DRAFT instruments can be opened');
    const updated = await this.prisma.paymentInstrument.update({
      where: { id }, data: { status: 'OPENED', updatedBy: user.id }, include: this.includes(),
    });
    // Update IPO status to LC_OPENED
    await this.prisma.importPurchaseOrder.update({
      where: { id: inst.ipoId }, data: { status: 'LC_OPENED', updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'payment_instruments', recordId: id, action: 'UPDATE', oldValues: inst, newValues: updated, changedBy: user.id });
    return updated;
  }

  async settle(id: string, user: any) {
    const inst = await this.findOne(id, user);
    if (!['OPENED', 'AMENDED'].includes(inst.status)) throw new BadRequestException('Only OPENED or AMENDED instruments can be settled');
    const updated = await this.prisma.paymentInstrument.update({
      where: { id }, data: { status: 'SETTLED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'payment_instruments', recordId: id, action: 'UPDATE', oldValues: inst, newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, user: any) {
    const inst = await this.findOne(id, user);
    if (['SETTLED', 'CANCELLED'].includes(inst.status)) throw new BadRequestException('Cannot cancel settled or already cancelled instrument');
    const updated = await this.prisma.paymentInstrument.update({
      where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'payment_instruments', recordId: id, action: 'UPDATE', oldValues: inst, newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, opened, settled, cancelled] = await Promise.all([
      this.prisma.paymentInstrument.count({ where }),
      this.prisma.paymentInstrument.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.paymentInstrument.count({ where: { ...where, status: 'OPENED' } }),
      this.prisma.paymentInstrument.count({ where: { ...where, status: 'SETTLED' } }),
      this.prisma.paymentInstrument.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const totalValue = await this.prisma.paymentInstrument.aggregate({ where, _sum: { amountInr: true, amount: true } });
    const byType = await this.prisma.paymentInstrument.groupBy({ by: ['instrumentType'], where, _count: true, _sum: { amountInr: true } });
    return { total, draft, opened, settled, cancelled, totalValueInr: totalValue._sum.amountInr || 0, totalValueForeign: totalValue._sum.amount || 0, byType };
  }
}
