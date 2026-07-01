import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCapaDto, UpdateCapaDto, VerifyCapaDto } from './dto/capa.dto';

@Injectable()
export class CapaService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.capaRecord.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `CAPA-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      ncr: { select: { ncrNumber: true, description: true, severity: true, source: true } },
    };
  }

  async create(dto: CreateCapaDto, user: any) {
    const ncr = await this.prisma.ncrRecord.findFirst({ where: { id: dto.ncrId, companyId: user.companyId } });
    if (!ncr) throw new NotFoundException('NCR not found');
    if (ncr.status === 'CLOSED') throw new BadRequestException('NCR is already closed');

    const capaNumber = await this.generateNumber(user.companyId);
    const capa = await this.prisma.capaRecord.create({
      data: {
        capaNumber, ncrId: dto.ncrId,
        rootCause: dto.rootCause, correctiveAction: dto.correctiveAction,
        preventiveAction: dto.preventiveAction, assignedTo: dto.assignedTo,
        dueDate: new Date(dto.dueDate), remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    // Update NCR status
    await this.prisma.ncrRecord.update({
      where: { id: dto.ncrId },
      data: { status: 'CAPA_PENDING', updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'capa_records', recordId: capa.id, action: 'CREATE', newValues: capa, changedBy: user.id });
    return capa;
  }

  async update(id: string, dto: UpdateCapaDto, user: any) {
    const capa = await this.prisma.capaRecord.findFirst({ where: { id, companyId: user.companyId } });
    if (!capa) throw new NotFoundException('CAPA not found');
    if (capa.status === 'VERIFIED') throw new BadRequestException('Cannot edit verified CAPA');

    const updateData: any = { ...dto, updatedBy: user.id };
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.status === 'COMPLETED') updateData.completedDate = new Date();

    const updated = await this.prisma.capaRecord.update({
      where: { id }, data: updateData, include: this.includes(),
    });
    await this.audit.log({ tableName: 'capa_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async verify(id: string, dto: VerifyCapaDto, user: any) {
    const capa = await this.prisma.capaRecord.findFirst({ where: { id, companyId: user.companyId } });
    if (!capa) throw new NotFoundException('CAPA not found');
    if (capa.status !== 'COMPLETED') throw new BadRequestException('CAPA must be COMPLETED before verification');

    const updated = await this.prisma.capaRecord.update({
      where: { id },
      data: {
        status: 'VERIFIED', effectivenessCheck: dto.effectivenessCheck,
        verifiedBy: user.id, verifiedDate: new Date(), updatedBy: user.id,
      },
      include: this.includes(),
    });

    // Update NCR status to verification pending
    await this.prisma.ncrRecord.update({
      where: { id: capa.ncrId },
      data: { status: 'VERIFICATION_PENDING', updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'capa_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, status, ncrId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (status) where.status = status;
    if (ncrId) where.ncrId = ncrId;

    const [data, total] = await Promise.all([
      this.prisma.capaRecord.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: this.includes(),
      }),
      this.prisma.capaRecord.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const capa = await this.prisma.capaRecord.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!capa) throw new NotFoundException('CAPA not found');
    return capa;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, assigned, inProgress, completed, verified, overdue] = await Promise.all([
      this.prisma.capaRecord.count({ where }),
      this.prisma.capaRecord.count({ where: { ...where, status: 'ASSIGNED' } }),
      this.prisma.capaRecord.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.capaRecord.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.capaRecord.count({ where: { ...where, status: 'VERIFIED' } }),
      this.prisma.capaRecord.count({ where: { ...where, status: { in: ['ASSIGNED','IN_PROGRESS'] }, dueDate: { lt: new Date() } } }),
    ]);
    return { total, assigned, inProgress, completed, verified, overdue };
  }
}
