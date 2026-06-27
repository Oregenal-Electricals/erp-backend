import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCustomsEntryDto, UpdateCustomsEntryDto, AssessCustomsEntryDto } from './dto/customs-entry.dto';

@Injectable()
export class CustomsEntryService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateBoeNumber(companyId: string): Promise<string> {
    const count = await this.prisma.customsEntry.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `BOE-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private calcDuty(cifValue: number, bcdRate: number, igstRate: number, aidcAmount = 0) {
    const bcdAmount = cifValue * bcdRate / 100;
    const swsAmount = bcdAmount * 0.10; // 10% of BCD
    const igstBase = cifValue + bcdAmount + swsAmount + aidcAmount;
    const igstAmount = igstBase * igstRate / 100;
    const totalDuty = bcdAmount + swsAmount + igstAmount + aidcAmount;
    return { bcdAmount, swsAmount, igstAmount, totalDuty };
  }

  private includes() {
    return {
      ipo: { select: { ipoNumber: true, currency: true, status: true, vendor: { select: { code: true, name: true } } } },
      shipment: { select: { shipmentNumber: true, shipmentMode: true, portOfDischarge: true } },
    };
  }

  async create(dto: CreateCustomsEntryDto, user: any) {
    const ipo = await this.prisma.importPurchaseOrder.findFirst({ where: { id: dto.ipoId, companyId: user.companyId } });
    if (!ipo) throw new NotFoundException('Import PO not found');

    const boeNumber = await this.generateBoeNumber(user.companyId);
    const bcdRate = dto.bcdRate || 0;
    const igstRate = dto.igstRate || 0;
    const aidcAmount = dto.aidcAmount || 0;
    const { bcdAmount, swsAmount, igstAmount, totalDuty } = this.calcDuty(dto.cifValue, bcdRate, igstRate, aidcAmount);

    const entry = await this.prisma.customsEntry.create({
      data: {
        ...dto,
        boeNumber,
        bcdRate, bcdAmount, swsAmount, igstRate, igstAmount, aidcAmount, totalDuty,
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'customs_entries', recordId: entry.id, action: 'CREATE', newValues: entry, changedBy: user.id });
    return entry;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { boeNumber: { contains: search, mode: 'insensitive' } },
      { customsBoeNumber: { contains: search, mode: 'insensitive' } },
      { chaName: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.customsEntry.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: this.includes(),
      }),
      this.prisma.customsEntry.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const entry = await this.prisma.customsEntry.findFirst({ where, include: this.includes() });
    if (!entry) throw new NotFoundException('Customs entry not found');
    return entry;
  }

  async findByIpo(ipoId: string, user: any) {
    const where: any = { ipoId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.customsEntry.findMany({ where, orderBy: { createdAt: 'desc' }, include: this.includes() });
  }

  async update(id: string, dto: UpdateCustomsEntryDto, user: any) {
    const entry = await this.findOne(id, user);
    if (['OUT_OF_CHARGE', 'CANCELLED'].includes(entry.status)) throw new BadRequestException('Cannot edit cleared or cancelled entry');

    const cifValue = dto.cifValue ?? entry.cifValue;
    const bcdRate = dto.bcdRate ?? entry.bcdRate;
    const igstRate = dto.igstRate ?? entry.igstRate;
    const aidcAmount = dto.aidcAmount ?? entry.aidcAmount ?? 0;
    const { bcdAmount, swsAmount, igstAmount, totalDuty } = this.calcDuty(cifValue, bcdRate, igstRate, aidcAmount);

    const updated = await this.prisma.customsEntry.update({
      where: { id },
      data: { ...dto, bcdAmount, swsAmount, igstAmount, totalDuty, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'customs_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: updated, changedBy: user.id });
    return updated;
  }

  async file(id: string, user: any) {
    const entry = await this.findOne(id, user);
    if (entry.status !== 'DRAFT') throw new BadRequestException('Only DRAFT entries can be filed');
    const updated = await this.prisma.customsEntry.update({
      where: { id }, data: { status: 'FILED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'customs_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: updated, changedBy: user.id });
    return updated;
  }

  async assess(id: string, dto: AssessCustomsEntryDto, user: any) {
    const entry = await this.findOne(id, user);
    if (entry.status !== 'FILED') throw new BadRequestException('Only FILED entries can be assessed');
    const { bcdAmount, swsAmount, igstAmount, totalDuty } = this.calcDuty(dto.cifValue, dto.bcdRate, dto.igstRate, dto.aidcAmount || 0);
    const updated = await this.prisma.customsEntry.update({
      where: { id },
      data: {
        status: 'ASSESSED',
        cifValue: dto.cifValue, bcdRate: dto.bcdRate, igstRate: dto.igstRate,
        bcdAmount, swsAmount, igstAmount, aidcAmount: dto.aidcAmount || 0, totalDuty,
        customsBoeNumber: dto.customsBoeNumber,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'customs_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: updated, changedBy: user.id });
    return updated;
  }

  async payDuty(id: string, user: any) {
    const entry = await this.findOne(id, user);
    if (entry.status !== 'ASSESSED') throw new BadRequestException('Only ASSESSED entries can have duty paid');
    const updated = await this.prisma.customsEntry.update({
      where: { id }, data: { status: 'DUTY_PAID', dutyPaidDate: new Date(), updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'customs_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: updated, changedBy: user.id });
    return updated;
  }

  async outOfCharge(id: string, user: any) {
    const entry = await this.findOne(id, user);
    if (entry.status !== 'DUTY_PAID') throw new BadRequestException('Only DUTY_PAID entries can be cleared');
    const updated = await this.prisma.customsEntry.update({
      where: { id }, data: { status: 'OUT_OF_CHARGE', outOfChargeDate: new Date(), updatedBy: user.id }, include: this.includes(),
    });
    // Update IPO status to CUSTOMS_CLEARED
    await this.prisma.importPurchaseOrder.update({
      where: { id: entry.ipoId }, data: { status: 'CUSTOMS_CLEARED', updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'customs_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, filed, assessed, dutyPaid, cleared] = await Promise.all([
      this.prisma.customsEntry.count({ where }),
      this.prisma.customsEntry.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.customsEntry.count({ where: { ...where, status: 'FILED' } }),
      this.prisma.customsEntry.count({ where: { ...where, status: 'ASSESSED' } }),
      this.prisma.customsEntry.count({ where: { ...where, status: 'DUTY_PAID' } }),
      this.prisma.customsEntry.count({ where: { ...where, status: 'OUT_OF_CHARGE' } }),
    ]);
    const totalDuty = await this.prisma.customsEntry.aggregate({ where, _sum: { totalDuty: true } });
    return { total, draft, filed, assessed, dutyPaid, cleared, totalDutyPaid: totalDuty._sum.totalDuty || 0 };
  }
}
