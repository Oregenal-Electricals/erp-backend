import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.lead.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `LEAD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateLeadDto, user: any) {
    const leadNumber = await this.generateNumber(user.companyId);
    const lead = await this.prisma.lead.create({
      data: {
        leadNumber, companyName: dto.companyName, contactPerson: dto.contactPerson,
        phone: dto.phone, email: dto.email, source: dto.source,
        productInterest: dto.productInterest, estimatedValue: dto.estimatedValue,
        currency: dto.currency || 'INR',
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        followUpNotes: dto.followUpNotes, assignedTo: dto.assignedTo, remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'leads', recordId: lead.id, action: 'CREATE', newValues: lead, changedBy: user.id });
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, user: any) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId: user.companyId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === 'CONVERTED') throw new BadRequestException('Cannot edit converted lead');

    const updateData: any = { ...dto, updatedBy: user.id };
    if (dto.followUpDate) updateData.followUpDate = new Date(dto.followUpDate);
    if (dto.status === 'LOST' && !dto.lostReason) throw new BadRequestException('Lost reason required when marking as lost');

    const updated = await this.prisma.lead.update({ where: { id }, data: updateData });
    await this.audit.log({ tableName: 'leads', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async convert(id: string, user: any) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId: user.companyId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === 'CONVERTED') throw new BadRequestException('Already converted');
    if (lead.status === 'LOST') throw new BadRequestException('Cannot convert lost lead');

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { status: 'CONVERTED', updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'leads', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, source, assignedTo } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search) where.OR = [
      { leadNumber: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } },
      { productInterest: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedTo) where.assignedTo = { contains: assignedTo, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      this.prisma.lead.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId: user.companyId } });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, newL, contacted, qualified, converted, lost, overdueFollowup] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, status: 'NEW' } }),
      this.prisma.lead.count({ where: { ...where, status: 'CONTACTED' } }),
      this.prisma.lead.count({ where: { ...where, status: 'QUALIFIED' } }),
      this.prisma.lead.count({ where: { ...where, status: 'CONVERTED' } }),
      this.prisma.lead.count({ where: { ...where, status: 'LOST' } }),
      this.prisma.lead.count({ where: { ...where, status: { notIn: ['CONVERTED','LOST'] }, followUpDate: { lt: new Date() } } }),
    ]);
    const valueAgg = await this.prisma.lead.aggregate({ where: { ...where, status: 'QUALIFIED' }, _sum: { estimatedValue: true } });
    return { total, new: newL, contacted, qualified, converted, lost, overdueFollowup, qualifiedPipelineValue: valueAgg._sum.estimatedValue || 0 };
  }
}
