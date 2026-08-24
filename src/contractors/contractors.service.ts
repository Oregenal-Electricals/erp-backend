import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateContractorDto, UpdateContractorDto } from './dto/contractor.dto';

@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateContractorDto, user: any) {
    const contractor = await this.prisma.contractor.create({
      data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'contractors', recordId: contractor.id, action: 'CREATE', newValues: contractor, changedBy: user.id });
    return contractor;
  }

  async findAll(user: any, query: any) {
    const { search } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    return this.prisma.contractor.findMany({
      where, orderBy: { name: 'asc' },
      include: { _count: { select: { employees: true } } },
    });
  }

  async findOne(id: string, user: any) {
    const contractor = await this.prisma.contractor.findFirst({
      where: { id, companyId: user.companyId },
      include: { employees: { where: { isActive: true }, select: { id: true, employeeNumber: true, firstName: true, lastName: true, hourlyRate: true } } },
    });
    if (!contractor) throw new NotFoundException('Contractor not found');
    return contractor;
  }

  async update(id: string, dto: UpdateContractorDto, user: any) {
    const contractor = await this.prisma.contractor.findFirst({ where: { id, companyId: user.companyId } });
    if (!contractor) throw new NotFoundException('Contractor not found');
    const updated = await this.prisma.contractor.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'contractors', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async remove(id: string, user: any) {
    const contractor = await this.prisma.contractor.findFirst({ where: { id, companyId: user.companyId }, include: { _count: { select: { employees: true } } } });
    if (!contractor) throw new NotFoundException('Contractor not found');
    if (contractor._count.employees > 0) {
      throw new BadRequestException(`Cannot remove ${contractor.name} - ${contractor._count.employees} employee(s) are still linked to this contractor`);
    }
    await this.prisma.contractor.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
    await this.audit.log({ tableName: 'contractors', recordId: id, action: 'DELETE', newValues: {}, changedBy: user.id });
    return { success: true };
  }
}
