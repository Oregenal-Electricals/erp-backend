import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return { category: true, uom: true };
  }

  async create(dto: CreateProductDto, user: any) {
    const exists = await this.prisma.product.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Product code ${dto.code} already exists`);

    const product = await this.prisma.product.create({
      data: { ...dto, code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'products', recordId: product.id, action: 'CREATE', newValues: product, changedBy: user.id });
    return product;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, productType, isActive } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { hsnCode: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
    if (productType) where.productType = productType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: this.includes() }),
      this.prisma.product.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const product = await this.prisma.product.findFirst({ where, include: this.includes() });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, user: any) {
    const product = await this.findOne(id, user);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'products', recordId: id, action: 'UPDATE', oldValues: product, newValues: updated, changedBy: user.id });
    return updated;
  }

  async remove(id: string, user: any) {
    const product = await this.findOne(id, user);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isActive: false, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'products', recordId: id, action: 'DELETE', oldValues: product, newValues: updated, changedBy: user.id });
    return { message: 'Product deactivated successfully' };
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, active, finished, semiFin, byProduct] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.count({ where: { ...where, isActive: true } }),
      this.prisma.product.count({ where: { ...where, productType: 'FINISHED_GOOD', isActive: true } }),
      this.prisma.product.count({ where: { ...where, productType: 'SEMI_FINISHED', isActive: true } }),
      this.prisma.product.count({ where: { ...where, productType: 'BY_PRODUCT', isActive: true } }),
    ]);
    return { total, active, inactive: total - active, finished, semiFin, byProduct };
  }
}
