import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateComplaintDto, UpdateComplaintDto, RespondComplaintDto } from './dto/complaint.dto';

@Injectable()
export class ComplaintService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.customerComplaint.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `CC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateComplaintDto, user: any) {
    const complaintNumber = await this.generateNumber(user.companyId);
    const complaint = await this.prisma.customerComplaint.create({
      data: {
        complaintNumber, customerId: dto.customerId,
        customerName: dto.customerName, customerPo: dto.customerPo,
        invoiceNumber: dto.invoiceNumber, itemCode: dto.itemCode, itemName: dto.itemName,
        batchNumber: dto.batchNumber,
        complaintDate: dto.complaintDate ? new Date(dto.complaintDate) : new Date(),
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(),
        complaintType: dto.complaintType, description: dto.description,
        qtyAffected: dto.qtyAffected || 0, customerRequest: dto.customerRequest,
        severity: dto.severity, assignedTo: dto.assignedTo, remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'customer_complaints', recordId: complaint.id, action: 'CREATE', newValues: complaint, changedBy: user.id });
    return complaint;
  }

  async update(id: string, dto: UpdateComplaintDto, user: any) {
    const complaint = await this.prisma.customerComplaint.findFirst({ where: { id, companyId: user.companyId } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.status === 'CLOSED') throw new BadRequestException('Cannot edit closed complaint');

    const updated = await this.prisma.customerComplaint.update({
      where: { id }, data: { ...dto, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'customer_complaints', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async respond(id: string, dto: RespondComplaintDto, user: any) {
    const complaint = await this.prisma.customerComplaint.findFirst({ where: { id, companyId: user.companyId } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.status === 'CLOSED') throw new BadRequestException('Already closed');

    const updated = await this.prisma.customerComplaint.update({
      where: { id },
      data: {
        rootCause: dto.rootCause, correctiveAction: dto.correctiveAction,
        eighthDNumber: dto.eighthDNumber, remarks: dto.remarks,
        status: 'RESPONDED', responseDate: new Date(), updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'customer_complaints', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async close(id: string, user: any) {
    const complaint = await this.prisma.customerComplaint.findFirst({ where: { id, companyId: user.companyId } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (!['RESPONDED'].includes(complaint.status)) throw new BadRequestException('Complaint must be RESPONDED before closing');

    const updated = await this.prisma.customerComplaint.update({
      where: { id },
      data: { status: 'CLOSED', closedDate: new Date(), closedBy: user.id, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'customer_complaints', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, severity, complaintType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { complaintNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { itemCode: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (complaintType) where.complaintType = complaintType;

    const [data, total] = await Promise.all([
      this.prisma.customerComplaint.findMany({
        where, skip, take: Number(limit), orderBy: { complaintDate: 'desc' },
      }),
      this.prisma.customerComplaint.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const complaint = await this.prisma.customerComplaint.findFirst({ where: { id, companyId: user.companyId } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    return complaint;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, open, investigating, responded, closed, critical, major] = await Promise.all([
      this.prisma.customerComplaint.count({ where }),
      this.prisma.customerComplaint.count({ where: { ...where, status: 'OPEN' } }),
      this.prisma.customerComplaint.count({ where: { ...where, status: 'INVESTIGATING' } }),
      this.prisma.customerComplaint.count({ where: { ...where, status: 'RESPONDED' } }),
      this.prisma.customerComplaint.count({ where: { ...where, status: 'CLOSED' } }),
      this.prisma.customerComplaint.count({ where: { ...where, severity: 'CRITICAL' } }),
      this.prisma.customerComplaint.count({ where: { ...where, severity: 'MAJOR' } }),
    ]);
    const byType = await this.prisma.customerComplaint.groupBy({
      by: ['complaintType'], where, _count: { id: true },
    });
    return { total, open, investigating, responded, closed, critical, major, byType };
  }
}
