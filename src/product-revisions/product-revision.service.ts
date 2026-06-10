import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductRevisionDto, UpdateProductRevisionDto } from './dto/product-revision.dto';

@Injectable()
export class ProductRevisionService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateProductRevisionDto, user: any) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
    if (!product) throw new NotFoundException('Product not found');

    const exists = await this.prisma.productRevision.findUnique({
      where: { companyId_productId_revisionNumber: { companyId: user.companyId, productId: dto.productId, revisionNumber: dto.revisionNumber } },
    });
    if (exists) throw new ConflictException(`Revision ${dto.revisionNumber} already exists for this product`);

    const rev = await this.prisma.productRevision.create({
      data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: { product: { select: { code: true, name: true } } },
    });
    await this.audit.log({ tableName: 'product_revisions', recordId: rev.id, action: 'CREATE', newValues: rev, changedBy: user.id });
    return rev;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, productId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { revisionNumber: { contains: search, mode: 'insensitive' } },
      { changeDescription: { contains: search, mode: 'insensitive' } },
      { product: { name: { contains: search, mode: 'insensitive' } } },
      { product: { code: { contains: search, mode: 'insensitive' } } },
    ];
    if (status) where.status = status;
    if (productId) where.productId = productId;

    const [data, total] = await Promise.all([
      this.prisma.productRevision.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { product: { select: { code: true, name: true } } } }),
      this.prisma.productRevision.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const rev = await this.prisma.productRevision.findFirst({ where, include: { product: { select: { code: true, name: true } } } });
    if (!rev) throw new NotFoundException('Product revision not found');
    return rev;
  }

  async findByProduct(productId: string, user: any) {
    const where: any = { productId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.productRevision.findMany({ where, orderBy: { effectiveDate: 'desc' }, include: { product: { select: { code: true, name: true } } } });
  }

  async update(id: string, dto: UpdateProductRevisionDto, user: any) {
    const rev = await this.findOne(id, user);
    if (rev.status !== 'DRAFT') throw new BadRequestException('Only DRAFT revisions can be edited');
    const updated = await this.prisma.productRevision.update({ where: { id }, data: { ...dto, updatedBy: user.id }, include: { product: { select: { code: true, name: true } } } });
    await this.audit.log({ tableName: 'product_revisions', recordId: id, action: 'UPDATE', oldValues: rev, newValues: updated, changedBy: user.id });
    return updated;
  }

  async approve(id: string, user: any) {
    const rev = await this.findOne(id, user);
    if (rev.status !== 'DRAFT') throw new BadRequestException('Only DRAFT revisions can be approved');
    const updated = await this.prisma.productRevision.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
      include: { product: { select: { code: true, name: true } } },
    });
    await this.audit.log({ tableName: 'product_revisions', recordId: id, action: 'UPDATE', oldValues: rev, newValues: updated, changedBy: user.id });
    return updated;
  }

  async obsolete(id: string, user: any) {
    const rev = await this.findOne(id, user);
    if (rev.status === 'OBSOLETE') throw new BadRequestException('Already obsolete');
    const updated = await this.prisma.productRevision.update({ where: { id }, data: { status: 'OBSOLETE', updatedBy: user.id }, include: { product: { select: { code: true, name: true } } } });
    await this.audit.log({ tableName: 'product_revisions', recordId: id, action: 'UPDATE', oldValues: rev, newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, approved, obsolete] = await Promise.all([
      this.prisma.productRevision.count({ where }),
      this.prisma.productRevision.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.productRevision.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.productRevision.count({ where: { ...where, status: 'OBSOLETE' } }),
    ]);
    return { total, draft, approved, obsolete };
  }
}
