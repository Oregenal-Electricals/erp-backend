import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateHsnSacDto, UpdateHsnSacDto } from './dto/hsn-sac.dto';

@Injectable()
export class HsnSacService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateHsnSacDto, user: any) {
    const exists = await this.prisma.hsnSacCode.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code } },
    });
    if (exists) throw new ConflictException(`HSN/SAC code ${dto.code} already exists`);

    const half = dto.gstRate / 2;
    const record = await this.prisma.hsnSacCode.create({
      data: {
        ...dto,
        igstRate: dto.gstRate,
        cgstRate: half,
        sgstRate: half,
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'hsn_sac_codes', recordId: record.id, action: 'CREATE', newValues: record, changedBy: user.id });
    return record;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, codeType, isActive } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
    if (codeType) where.codeType = codeType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.hsnSacCode.findMany({ where, skip, take: Number(limit), orderBy: { code: 'asc' } }),
      this.prisma.hsnSacCode.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const record = await this.prisma.hsnSacCode.findFirst({ where });
    if (!record) throw new NotFoundException('HSN/SAC code not found');
    return record;
  }

  async update(id: string, dto: UpdateHsnSacDto, user: any) {
    const record = await this.findOne(id, user);
    const updateData: any = { ...dto, updatedBy: user.id };
    if (dto.gstRate !== undefined) {
      updateData.igstRate = dto.gstRate;
      updateData.cgstRate = dto.gstRate / 2;
      updateData.sgstRate = dto.gstRate / 2;
    }
    const updated = await this.prisma.hsnSacCode.update({ where: { id }, data: updateData });
    await this.audit.log({ tableName: 'hsn_sac_codes', recordId: id, action: 'UPDATE', oldValues: record, newValues: updated, changedBy: user.id });
    return updated;
  }

  async remove(id: string, user: any) {
    const record = await this.findOne(id, user);
    const updated = await this.prisma.hsnSacCode.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
    await this.audit.log({ tableName: 'hsn_sac_codes', recordId: id, action: 'DELETE', oldValues: record, newValues: updated, changedBy: user.id });
    return { message: 'HSN/SAC code deactivated successfully' };
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, active, hsn, sac, zeroRated, standard] = await Promise.all([
      this.prisma.hsnSacCode.count({ where }),
      this.prisma.hsnSacCode.count({ where: { ...where, isActive: true } }),
      this.prisma.hsnSacCode.count({ where: { ...where, codeType: 'HSN', isActive: true } }),
      this.prisma.hsnSacCode.count({ where: { ...where, codeType: 'SAC', isActive: true } }),
      this.prisma.hsnSacCode.count({ where: { ...where, gstRate: 0, isActive: true } }),
      this.prisma.hsnSacCode.count({ where: { ...where, gstRate: 18, isActive: true } }),
    ]);
    return { total, active, inactive: total - active, hsn, sac, zeroRated, standard };
  }
}
