import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateBomRevisionDto } from './dto/bom-revision.dto';

@Injectable()
export class BomRevisionService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateBomRevisionDto, user: any) {
    // Validate product exists
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
    if (!product) throw new NotFoundException('Product not found');

    // Validate new BOM exists and belongs to this product
    const bom = await this.prisma.bom.findFirst({ where: { id: dto.bomId, companyId: user.companyId } });
    if (!bom) throw new NotFoundException('BOM not found');
    if (bom.productId !== dto.productId) throw new BadRequestException('BOM does not belong to this product');

    // Check revision number uniqueness
    const exists = await this.prisma.bomRevision.findUnique({
      where: { companyId_productId_revisionNumber: { companyId: user.companyId, productId: dto.productId, revisionNumber: dto.revisionNumber } },
    });
    if (exists) throw new ConflictException(`Revision ${dto.revisionNumber} already exists for this product`);

    const rev = await this.prisma.bomRevision.create({
      data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: {
        product: { select: { code: true, name: true } },
        bom: { select: { bomNumber: true, version: true, status: true } },
        previousBom: { select: { bomNumber: true, version: true } },
      },
    });
    await this.audit.log({ tableName: 'bom_revisions', recordId: rev.id, action: 'CREATE', newValues: rev, changedBy: user.id });
    return rev;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, productId, changeType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { revisionNumber: { contains: search, mode: 'insensitive' } },
      { ecnNumber: { contains: search, mode: 'insensitive' } },
      { changeDescription: { contains: search, mode: 'insensitive' } },
      { product: { name: { contains: search, mode: 'insensitive' } } },
      { product: { code: { contains: search, mode: 'insensitive' } } },
    ];
    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (changeType) where.changeType = changeType;

    const [data, total] = await Promise.all([
      this.prisma.bomRevision.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { code: true, name: true } },
          bom: { select: { bomNumber: true, version: true, status: true } },
          previousBom: { select: { bomNumber: true, version: true } },
        },
      }),
      this.prisma.bomRevision.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const rev = await this.prisma.bomRevision.findFirst({
      where,
      include: {
        product: { select: { code: true, name: true } },
        bom: { include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } } },
        previousBom: { include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } } },
      },
    });
    if (!rev) throw new NotFoundException('BOM revision not found');
    return rev;
  }

  async findByProduct(productId: string, user: any) {
    const where: any = { productId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.bomRevision.findMany({
      where, orderBy: { effectiveDate: 'desc' },
      include: {
        product: { select: { code: true, name: true } },
        bom: { select: { bomNumber: true, version: true, status: true } },
        previousBom: { select: { bomNumber: true, version: true } },
      },
    });
  }

  async approve(id: string, user: any) {
    const rev = await this.findOne(id, user);
    if (rev.status !== 'DRAFT') throw new BadRequestException('Only DRAFT revisions can be approved');
    const updated = await this.prisma.bomRevision.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
      include: {
        product: { select: { code: true, name: true } },
        bom: { select: { bomNumber: true, version: true, status: true } },
      },
    });
    await this.audit.log({ tableName: 'bom_revisions', recordId: id, action: 'UPDATE', oldValues: rev, newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, approved, major, minor, patch] = await Promise.all([
      this.prisma.bomRevision.count({ where }),
      this.prisma.bomRevision.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.bomRevision.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.bomRevision.count({ where: { ...where, changeType: 'MAJOR' } }),
      this.prisma.bomRevision.count({ where: { ...where, changeType: 'MINOR' } }),
      this.prisma.bomRevision.count({ where: { ...where, changeType: 'PATCH' } }),
    ]);
    return { total, draft, approved, major, minor, patch };
  }
}
