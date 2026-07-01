import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateNcrDto, UpdateNcrDto } from './dto/ncr.dto';

@Injectable()
export class NcrService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.ncrRecord.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `NCR-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productName: true } },
      capaRecords: { select: { id: true, capaNumber: true, status: true, assignedTo: true, dueDate: true } },
    };
  }

  async create(dto: CreateNcrDto, user: any) {
    const ncrNumber = await this.generateNumber(user.companyId);
    const ncr = await this.prisma.ncrRecord.create({
      data: {
        ncrNumber, source: dto.source,
        sourceReferenceId: dto.sourceReferenceId,
        sourceReferenceNumber: dto.sourceReferenceNumber,
        itemCode: dto.itemCode, itemName: dto.itemName,
        workOrderId: dto.workOrderId,
        description: dto.description, severity: dto.severity,
        qtyAffected: dto.qtyAffected || 0,
        detectedBy: dto.detectedBy,
        detectedDate: dto.detectedDate ? new Date(dto.detectedDate) : new Date(),
        disposition: dto.disposition, remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'ncr_records', recordId: ncr.id, action: 'CREATE', newValues: ncr, changedBy: user.id });
    return ncr;
  }

  async update(id: string, dto: UpdateNcrDto, user: any) {
    const ncr = await this.prisma.ncrRecord.findFirst({ where: { id, companyId: user.companyId } });
    if (!ncr) throw new NotFoundException('NCR not found');
    if (ncr.status === 'CLOSED') throw new BadRequestException('Cannot edit closed NCR');
    const updated = await this.prisma.ncrRecord.update({
      where: { id }, data: { ...dto, updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'ncr_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async close(id: string, user: any) {
    const ncr = await this.prisma.ncrRecord.findFirst({
      where: { id, companyId: user.companyId },
      include: { capaRecords: true },
    });
    if (!ncr) throw new NotFoundException('NCR not found');
    if (ncr.status === 'CLOSED') throw new BadRequestException('Already closed');
    const openCapas = ncr.capaRecords.filter(c => !['COMPLETED','VERIFIED'].includes(c.status));
    if (openCapas.length > 0) throw new BadRequestException(`${openCapas.length} CAPA(s) still open. Complete them first.`);

    const updated = await this.prisma.ncrRecord.update({
      where: { id },
      data: { status: 'CLOSED', closedDate: new Date(), closedBy: user.id, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'ncr_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, severity, source } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { ncrNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { itemCode: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (source) where.source = source;

    const [data, total] = await Promise.all([
      this.prisma.ncrRecord.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { capaRecords: { select: { id: true, status: true } }, workOrder: { select: { woNumber: true } } },
      }),
      this.prisma.ncrRecord.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const ncr = await this.prisma.ncrRecord.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!ncr) throw new NotFoundException('NCR not found');
    return ncr;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, open, capaPending, closed, critical, major, minor] = await Promise.all([
      this.prisma.ncrRecord.count({ where }),
      this.prisma.ncrRecord.count({ where: { ...where, status: 'OPEN' } }),
      this.prisma.ncrRecord.count({ where: { ...where, status: 'CAPA_PENDING' } }),
      this.prisma.ncrRecord.count({ where: { ...where, status: 'CLOSED' } }),
      this.prisma.ncrRecord.count({ where: { ...where, severity: 'CRITICAL' } }),
      this.prisma.ncrRecord.count({ where: { ...where, severity: 'MAJOR' } }),
      this.prisma.ncrRecord.count({ where: { ...where, severity: 'MINOR' } }),
    ]);
    return { total, open, capaPending, closed, critical, major, minor };
  }
}
