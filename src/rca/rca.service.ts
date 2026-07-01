import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateRcaDto, UpdateRcaDto } from './dto/rca.dto';

@Injectable()
export class RcaService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.rcaRecord.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `RCA-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      ncr: { select: { ncrNumber: true, description: true, severity: true, source: true, itemCode: true } },
    };
  }

  async create(dto: CreateRcaDto, user: any) {
    const ncr = await this.prisma.ncrRecord.findFirst({ where: { id: dto.ncrId, companyId: user.companyId } });
    if (!ncr) throw new NotFoundException('NCR not found');
    if (ncr.status === 'CLOSED') throw new BadRequestException('NCR is already closed');

    // Check if RCA already exists for this NCR with same method
    const existing = await this.prisma.rcaRecord.findFirst({
      where: { ncrId: dto.ncrId, method: dto.method, companyId: user.companyId },
    });
    if (existing) throw new BadRequestException(`RCA with ${dto.method} method already exists for this NCR`);

    const rcaNumber = await this.generateNumber(user.companyId);
    const rca = await this.prisma.rcaRecord.create({
      data: {
        rcaNumber, ncrId: dto.ncrId, method: dto.method, problem: dto.problem,
        why1: dto.why1, why2: dto.why2, why3: dto.why3, why4: dto.why4, why5: dto.why5,
        rootCause: dto.rootCause,
        fishboneMan: dto.fishboneMan, fishboneMachine: dto.fishboneMachine,
        fishboneMaterial: dto.fishboneMaterial, fishboneMethod: dto.fishboneMethod,
        fishboneEnvironment: dto.fishboneEnvironment, fishboneMeasurement: dto.fishboneMeasurement,
        conclusion: dto.conclusion, conductedBy: dto.conductedBy, remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    // Update NCR status
    await this.prisma.ncrRecord.update({
      where: { id: dto.ncrId },
      data: { status: 'ROOT_CAUSE_PENDING', updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'rca_records', recordId: rca.id, action: 'CREATE', newValues: rca, changedBy: user.id });
    return rca;
  }

  async update(id: string, dto: UpdateRcaDto, user: any) {
    const rca = await this.prisma.rcaRecord.findFirst({ where: { id, companyId: user.companyId } });
    if (!rca) throw new NotFoundException('RCA not found');
    if (rca.status === 'COMPLETED') throw new BadRequestException('Cannot edit completed RCA');

    const updated = await this.prisma.rcaRecord.update({
      where: { id }, data: { ...dto, updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'rca_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async complete(id: string, user: any) {
    const rca = await this.prisma.rcaRecord.findFirst({ where: { id, companyId: user.companyId } });
    if (!rca) throw new NotFoundException('RCA not found');
    if (!rca.conclusion && !rca.rootCause) throw new BadRequestException('Root cause or conclusion required before completing');

    const updated = await this.prisma.rcaRecord.update({
      where: { id }, data: { status: 'COMPLETED', updatedBy: user.id }, include: this.includes(),
    });

    // Update NCR status to CAPA_PENDING
    await this.prisma.ncrRecord.update({
      where: { id: rca.ncrId },
      data: { status: 'CAPA_PENDING', updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'rca_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, ncrId, method, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (ncrId) where.ncrId = ncrId;
    if (method) where.method = method;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.rcaRecord.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: this.includes(),
      }),
      this.prisma.rcaRecord.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const rca = await this.prisma.rcaRecord.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!rca) throw new NotFoundException('RCA not found');
    return rca;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, completed, fiveWhy, fishbone, both] = await Promise.all([
      this.prisma.rcaRecord.count({ where }),
      this.prisma.rcaRecord.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.rcaRecord.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.rcaRecord.count({ where: { ...where, method: 'FIVE_WHY' } }),
      this.prisma.rcaRecord.count({ where: { ...where, method: 'FISHBONE' } }),
      this.prisma.rcaRecord.count({ where: { ...where, method: 'BOTH' } }),
    ]);
    return { total, draft, completed, fiveWhy, fishbone, both };
  }
}
