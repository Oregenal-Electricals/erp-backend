import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductFamilyDto, UpdateProductFamilyDto, AssignProductsToFamilyDto } from './dto/product-family.dto';

@Injectable()
export class ProductFamilyService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return {
      products: {
        where: { isActive: true },
        select: { id: true, code: true, name: true, productType: true, isActive: true },
      },
    };
  }

  async create(dto: CreateProductFamilyDto, user: any) {
    const exists = await this.prisma.productFamily.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Product Family code ${dto.code} already exists`);

    const family = await this.prisma.productFamily.create({
      data: { ...dto, code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'product_families', recordId: family.id, action: 'CREATE', newValues: family, changedBy: user.id });
    return family;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, isActive } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.productFamily.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: this.includes() }),
      this.prisma.productFamily.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const family = await this.prisma.productFamily.findFirst({ where, include: this.includes() });
    if (!family) throw new NotFoundException('Product Family not found');
    return family;
  }

  async update(id: string, dto: UpdateProductFamilyDto, user: any) {
    const family = await this.findOne(id, user);
    const updated = await this.prisma.productFamily.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'product_families', recordId: id, action: 'UPDATE', oldValues: family, newValues: updated, changedBy: user.id });
    return updated;
  }

  async remove(id: string, user: any) {
    const family = await this.findOne(id, user);
    const updated = await this.prisma.productFamily.update({
      where: { id },
      data: { isActive: false, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'product_families', recordId: id, action: 'DELETE', oldValues: family, newValues: updated, changedBy: user.id });
    return { message: 'Product Family deactivated successfully' };
  }

  async assignProducts(id: string, dto: AssignProductsToFamilyDto, user: any) {
    const family = await this.findOne(id, user);
    if (!dto.productIds || dto.productIds.length === 0) {
      throw new BadRequestException('productIds must be a non-empty array');
    }

    const matchingProducts = await this.prisma.product.findMany({
      where: { id: { in: dto.productIds }, companyId: family.companyId },
      select: { id: true },
    });
    if (matchingProducts.length !== dto.productIds.length) {
      throw new BadRequestException('One or more productIds do not exist in this company');
    }

    await this.prisma.product.updateMany({
      where: { id: { in: dto.productIds }, companyId: family.companyId },
      data: { familyId: family.id, updatedBy: user.id },
    });

    await this.audit.log({
      tableName: 'products', recordId: family.id, action: 'UPDATE',
      newValues: { familyId: family.id, assignedProductIds: dto.productIds },
      changedBy: user.id, reason: `Assigned to Product Family ${family.code}`,
    });

    return this.findOne(id, user);
  }

  async removeProduct(productId: string, user: any) {
    const where: any = { id: productId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const product = await this.prisma.product.findFirst({ where });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.familyId) throw new BadRequestException('Product is not assigned to any Product Family');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { familyId: null, updatedBy: user.id },
    });
    await this.audit.log({
      tableName: 'products', recordId: productId, action: 'UPDATE',
      oldValues: { familyId: product.familyId }, newValues: { familyId: null },
      changedBy: user.id, reason: 'Removed from Product Family',
    });
    return updated;
  }
}
