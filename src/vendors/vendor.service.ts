import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateVendorDto, user: any) {
    const exists = await this.prisma.vendor.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Vendor code ${dto.code} already exists`);

    const vendor = await this.prisma.vendor.create({
      data: { ...dto, code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'vendors', recordId: vendor.id, action: 'CREATE', newValues: vendor, changedBy: user.id });
    return vendor;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, vendorType, isActive } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { gstin: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
    if (vendorType) where.vendorType = vendorType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.vendor.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      this.prisma.vendor.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const vendor = await this.prisma.vendor.findFirst({ where });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto, user: any) {
    const vendor = await this.findOne(id, user);
    const updated = await this.prisma.vendor.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'vendors', recordId: id, action: 'UPDATE', oldValues: vendor, newValues: updated, changedBy: user.id });
    return updated;
  }

  async remove(id: string, user: any) {
    const vendor = await this.findOne(id, user);
    const updated = await this.prisma.vendor.update({
      where: { id },
      data: { isActive: false, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'vendors', recordId: id, action: 'DELETE', oldValues: vendor, newValues: updated, changedBy: user.id });
    return { message: 'Vendor deactivated successfully' };
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, active, msme, suppliers, contractors] = await Promise.all([
      this.prisma.vendor.count({ where }),
      this.prisma.vendor.count({ where: { ...where, isActive: true } }),
      this.prisma.vendor.count({ where: { ...where, isMsme: true, isActive: true } }),
      this.prisma.vendor.count({ where: { ...where, vendorType: 'SUPPLIER', isActive: true } }),
      this.prisma.vendor.count({ where: { ...where, vendorType: 'CONTRACTOR', isActive: true } }),
    ]);
    return { total, active, inactive: total - active, msme, suppliers, contractors };
  }
}
