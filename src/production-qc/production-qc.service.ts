import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductionQcDto, CompleteQcDto } from './dto/production-qc.dto';

@Injectable()
export class ProductionQcService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.productionQc.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PQC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productCode: true, productName: true } },
      productionEntry: { select: { entryNumber: true, shift: true, goodQty: true } },
    };
  }

  async create(dto: CreateProductionQcDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
    if (!wo) throw new NotFoundException('Work order not found');

    const qcNumber = await this.generateNumber(user.companyId);
    const passRate = dto.sampleSize > 0 ? Math.round((dto.passQty / dto.sampleSize) * 100) : 0;

    const qc = await this.prisma.productionQc.create({
      data: {
        qcNumber, workOrderId: dto.workOrderId,
        productionEntryId: dto.productionEntryId,
        inspectionStage: dto.inspectionStage || 'IN_PROCESS',
        inspectorName: dto.inspectorName,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : new Date(),
        sampleSize: dto.sampleSize, passQty: dto.passQty, failQty: dto.failQty,
        defectDescription: dto.defectDescription,
        correctiveAction: dto.correctiveAction,
        remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'production_qc', recordId: qc.id, action: 'CREATE', newValues: qc, changedBy: user.id });
    return { ...qc, passRate };
  }

  async complete(id: string, dto: CompleteQcDto, user: any) {
    const qc = await this.prisma.productionQc.findFirst({ where: { id, companyId: user.companyId } });
    if (!qc) throw new NotFoundException('QC record not found');
    if (qc.status === 'COMPLETED') throw new BadRequestException('Already completed');

    const updated = await this.prisma.productionQc.update({
      where: { id },
      data: {
        result: dto.result, status: 'COMPLETED',
        defectDescription: dto.defectDescription || qc.defectDescription,
        correctiveAction: dto.correctiveAction || qc.correctiveAction,
        remarks: dto.remarks || qc.remarks,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'production_qc', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, result, workOrderId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ qcNumber: { contains: search, mode: 'insensitive' } }];
    if (result) where.result = result;
    if (workOrderId) where.workOrderId = workOrderId;

    const [data, total] = await Promise.all([
      this.prisma.productionQc.findMany({
        where, skip, take: Number(limit), orderBy: { inspectionDate: 'desc' },
        include: this.includes(),
      }),
      this.prisma.productionQc.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const qc = await this.prisma.productionQc.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!qc) throw new NotFoundException('QC record not found');
    return qc;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, pending, completed, passed, failed, conditional] = await Promise.all([
      this.prisma.productionQc.count({ where }),
      this.prisma.productionQc.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.productionQc.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.productionQc.count({ where: { ...where, result: 'PASS' } }),
      this.prisma.productionQc.count({ where: { ...where, result: 'FAIL' } }),
      this.prisma.productionQc.count({ where: { ...where, result: 'CONDITIONAL' } }),
    ]);
    const totals = await this.prisma.productionQc.aggregate({ where, _sum: { sampleSize: true, passQty: true, failQty: true } });
    const passRate = totals._sum.sampleSize > 0 ? Math.round(totals._sum.passQty / totals._sum.sampleSize * 100) : 0;
    return { total, pending, completed, passed, failed, conditional, passRate, totalSampled: totals._sum.sampleSize || 0 };
  }
}
