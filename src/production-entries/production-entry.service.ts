import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductionEntryDto } from './dto/production-entry.dto';

@Injectable()
export class ProductionEntryService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.productionEntry.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PE-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true, status: true } },
    };
  }

  async create(dto: CreateProductionEntryDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: dto.workOrderId, companyId: user.companyId },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (!['RELEASED','IN_PROGRESS'].includes(wo.status)) {
      throw new BadRequestException('Work order must be IN_PROGRESS to record production');
    }

    const scrapQty = dto.scrapQty || 0;
    const totalQty = dto.goodQty + scrapQty;

    // Check if total would exceed planned qty
    const existingGood = await this.prisma.productionEntry.aggregate({
      where: { workOrderId: dto.workOrderId, companyId: user.companyId, status: 'CONFIRMED' },
      _sum: { goodQty: true },
    });
    const alreadyProduced = existingGood._sum.goodQty || 0;
    if (alreadyProduced + dto.goodQty > wo.plannedQty * 1.05) { // 5% over-production allowed
      throw new BadRequestException(`Total production would exceed planned qty. Planned: ${wo.plannedQty}, Already: ${alreadyProduced}`);
    }

    const entryNumber = await this.generateNumber(user.companyId);
    const entry = await this.prisma.productionEntry.create({
      data: {
        entryNumber, workOrderId: dto.workOrderId,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
        shift: dto.shift || 'MORNING',
        operatorName: dto.operatorName, machineName: dto.machineName,
        goodQty: dto.goodQty, scrapQty, totalQty,
        remarks: dto.remarks, status: 'DRAFT',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'production_entries', recordId: entry.id, action: 'CREATE', newValues: entry, changedBy: user.id });
    return entry;
  }

  async confirm(id: string, user: any) {
    const entry = await this.prisma.productionEntry.findFirst({
      where: { id, companyId: user.companyId },
      include: { workOrder: true },
    });
    if (!entry) throw new NotFoundException('Production entry not found');
    if (entry.status !== 'DRAFT') throw new BadRequestException('Only DRAFT entries can be confirmed');

    // Update WO completedQty
    const newCompletedQty = (entry.workOrder.completedQty || 0) + entry.goodQty;
    const newRejectedQty = (entry.workOrder.rejectedQty || 0) + entry.scrapQty;

    let woStatus = entry.workOrder.status;
    if (newCompletedQty >= entry.workOrder.plannedQty) woStatus = 'COMPLETED';

    await this.prisma.workOrder.update({
      where: { id: entry.workOrderId },
      data: {
        completedQty: newCompletedQty, rejectedQty: newRejectedQty,
        status: woStatus,
        actualEndDate: woStatus === 'COMPLETED' ? new Date() : undefined,
        updatedBy: user.id,
      },
    });

    const updated = await this.prisma.productionEntry.update({
      where: { id }, data: { status: 'CONFIRMED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'production_entries', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, workOrderId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ entryNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;
    if (workOrderId) where.workOrderId = workOrderId;

    const [data, total] = await Promise.all([
      this.prisma.productionEntry.findMany({
        where, skip, take: Number(limit), orderBy: { entryDate: 'desc' },
        include: this.includes(),
      }),
      this.prisma.productionEntry.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const entry = await this.prisma.productionEntry.findFirst({ where, include: this.includes() });
    if (!entry) throw new NotFoundException('Production entry not found');
    return entry;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, confirmed] = await Promise.all([
      this.prisma.productionEntry.count({ where }),
      this.prisma.productionEntry.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.productionEntry.count({ where: { ...where, status: 'CONFIRMED' } }),
    ]);
    const totals = await this.prisma.productionEntry.aggregate({
      where: { ...where, status: 'CONFIRMED' },
      _sum: { goodQty: true, scrapQty: true, totalQty: true },
    });
    return {
      total, draft, confirmed,
      totalGoodQty: totals._sum.goodQty || 0,
      totalScrapQty: totals._sum.scrapQty || 0,
      totalQty: totals._sum.totalQty || 0,
    };
  }

  async getWoProgress(workOrderId: string, user: any) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, companyId: user.companyId },
    });
    if (!wo) throw new NotFoundException('Work order not found');

    const entries = await this.prisma.productionEntry.findMany({
      where: { workOrderId, companyId: user.companyId },
      orderBy: { entryDate: 'asc' },
    });

    const confirmedGood = entries.filter(e => e.status === 'CONFIRMED').reduce((s, e) => s + e.goodQty, 0);
    const confirmedScrap = entries.filter(e => e.status === 'CONFIRMED').reduce((s, e) => s + e.scrapQty, 0);

    return {
      workOrder: wo,
      entries,
      summary: {
        plannedQty: wo.plannedQty,
        confirmedGoodQty: confirmedGood,
        confirmedScrapQty: confirmedScrap,
        pendingQty: Math.max(0, wo.plannedQty - confirmedGood),
        completionPercent: wo.plannedQty > 0 ? Math.round(confirmedGood / wo.plannedQty * 100) : 0,
        totalEntries: entries.length,
      },
    };
  }
}
