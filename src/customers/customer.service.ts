import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private includes() {
    return {
      addresses: { where: { isActive: true } },
      contacts: { where: { isActive: true } },
      gstNumbers: { where: { isActive: true } },
    };
  }

  async create(dto: CreateCustomerDto, user: any) {
    const existing = await this.prisma.customer.findFirst({
      where: { companyId: user.companyId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`Customer code ${dto.code} already exists`);

    const customer = await this.prisma.customer.create({
      data: {
        companyId: user.companyId, code: dto.code, name: dto.name,
        email: dto.email, phone: dto.phone,
        createdBy: user.id, updatedBy: user.id,
        addresses: dto.addresses?.length ? {
          create: dto.addresses.map(a => ({
            companyId: user.companyId, addressType: a.addressType || 'DELIVERY',
            addressLine: a.addressLine, city: a.city, state: a.state, pincode: a.pincode,
            isDefault: a.isDefault || false, createdBy: user.id, updatedBy: user.id,
          })),
        } : undefined,
        contacts: dto.contacts?.length ? {
          create: dto.contacts.map(c => ({
            companyId: user.companyId, name: c.name, designation: c.designation,
            phone: c.phone, email: c.email, isPrimary: c.isPrimary || false,
            createdBy: user.id, updatedBy: user.id,
          })),
        } : undefined,
        gstNumbers: dto.gstNumbers?.length ? {
          create: dto.gstNumbers.map(g => ({
            companyId: user.companyId, gstNumber: g.gstNumber, branchLabel: g.branchLabel,
            createdBy: user.id, updatedBy: user.id,
          })),
        } : undefined,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'customers', recordId: customer.id, action: 'CREATE', newValues: customer, changedBy: user.id });
    return customer;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { isActive: true };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { _count: { select: { addresses: true, contacts: true, gstNumbers: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const customer = await this.prisma.customer.findFirst({ where, include: this.includes() });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, user: any) {
    const customer = await this.findOne(id, user);

    await this.prisma.customerAddress.updateMany({ where: { customerId: id }, data: { isActive: false } });
    await this.prisma.customerContact.updateMany({ where: { customerId: id }, data: { isActive: false } });
    await this.prisma.customerGst.updateMany({ where: { customerId: id }, data: { isActive: false } });

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name, email: dto.email, phone: dto.phone, updatedBy: user.id,
        addresses: dto.addresses?.length ? {
          create: dto.addresses.map(a => ({
            companyId: user.companyId, addressType: a.addressType || 'DELIVERY',
            addressLine: a.addressLine, city: a.city, state: a.state, pincode: a.pincode,
            isDefault: a.isDefault || false, createdBy: user.id, updatedBy: user.id,
          })),
        } : undefined,
        contacts: dto.contacts?.length ? {
          create: dto.contacts.map(c => ({
            companyId: user.companyId, name: c.name, designation: c.designation,
            phone: c.phone, email: c.email, isPrimary: c.isPrimary || false,
            createdBy: user.id, updatedBy: user.id,
          })),
        } : undefined,
        gstNumbers: dto.gstNumbers?.length ? {
          create: dto.gstNumbers.map(g => ({
            companyId: user.companyId, gstNumber: g.gstNumber, branchLabel: g.branchLabel,
            createdBy: user.id, updatedBy: user.id,
          })),
        } : undefined,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'customers', recordId: id, action: 'UPDATE', oldValues: customer, newValues: updated, changedBy: user.id });
    return updated;
  }

  async remove(id: string, user: any) {
    const customer = await this.findOne(id, user);
    const updated = await this.prisma.customer.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
    await this.audit.log({ tableName: 'customers', recordId: id, action: 'DELETE', oldValues: customer, newValues: updated, changedBy: user.id });
    return { message: 'Customer deactivated' };
  }

  async getStats(user: any) {
    const where: any = { isActive: true };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const total = await this.prisma.customer.count({ where });
    return { total };
  }
}
