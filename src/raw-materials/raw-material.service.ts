import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateRawMaterialDto, UpdateRawMaterialDto } from './dto/raw-material.dto';

@Injectable()
export class RawMaterialService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return { category: true, uom: true };
  }

  async create(dto: CreateRawMaterialDto, user: any) {
    const exists = await this.prisma.rawMaterial.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Raw material code ${dto.code} already exists`);

    const rm = await this.prisma.rawMaterial.create({
      data: { ...dto, code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'raw_materials', recordId: rm.id, action: 'CREATE', newValues: rm, changedBy: user.id });
    return rm;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, materialType, isActive } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { partNumber: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { hsnCode: { contains: search, mode: 'insensitive' } },
    ];
    if (materialType) where.materialType = materialType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.rawMaterial.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: this.includes() }),
      this.prisma.rawMaterial.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const rm = await this.prisma.rawMaterial.findFirst({ where, include: this.includes() });
    if (!rm) throw new NotFoundException('Raw material not found');
    return rm;
  }

  async update(id: string, dto: UpdateRawMaterialDto, user: any) {
    const rm = await this.findOne(id, user);
    const updated = await this.prisma.rawMaterial.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'raw_materials', recordId: id, action: 'UPDATE', oldValues: rm, newValues: updated, changedBy: user.id });
    return updated;
  }

  async remove(id: string, user: any) {
    const rm = await this.findOne(id, user);
    const updated = await this.prisma.rawMaterial.update({
      where: { id },
      data: { isActive: false, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'raw_materials', recordId: id, action: 'DELETE', oldValues: rm, newValues: updated, changedBy: user.id });
    return { message: 'Raw material deactivated successfully' };
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, active, electronic, mechanical, electrical, packaging] = await Promise.all([
      this.prisma.rawMaterial.count({ where }),
      this.prisma.rawMaterial.count({ where: { ...where, isActive: true } }),
      this.prisma.rawMaterial.count({ where: { ...where, materialType: 'ELECTRONIC', isActive: true } }),
      this.prisma.rawMaterial.count({ where: { ...where, materialType: 'MECHANICAL', isActive: true } }),
      this.prisma.rawMaterial.count({ where: { ...where, materialType: 'ELECTRICAL', isActive: true } }),
      this.prisma.rawMaterial.count({ where: { ...where, materialType: 'PACKAGING', isActive: true } }),
    ]);
    return { total, active, inactive: total - active, electronic, mechanical, electrical, packaging };
  }
}
