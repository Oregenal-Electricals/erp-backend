import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductTargetDto, ReviseProductTargetDto } from './dto/product-target.dto';

@Injectable()
export class ProductTargetService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return { product: { select: { id: true, code: true, name: true } } };
  }

  // Creating the very first target for a product. Once any record
  // exists for a product (active or expired), all further changes
  // must go through revise() so the version chain has no gaps and no
  // duplicate open-ended ("current") records - two rows with
  // effectiveTo=null for the same product would make "what's the
  // current target" ambiguous.
  async create(dto: CreateProductTargetDto, user: any) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.productStandardProductivity.findFirst({
      where: { companyId: user.companyId, productId: dto.productId, isActive: true },
    });
    if (existing) {
      throw new BadRequestException('A target already exists for this product - use revise instead of create');
    }

    const effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();

    const record = await this.prisma.productStandardProductivity.create({
      data: {
        companyId: user.companyId, productId: dto.productId,
        piecesPerManHour: dto.piecesPerManHour, effectiveFrom, effectiveTo: null,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({
      tableName: 'product_standard_productivity', recordId: record.id, action: 'CREATE',
      newValues: { productId: dto.productId, piecesPerManHour: dto.piecesPerManHour, effectiveFrom },
      changedBy: user.id,
    });

    return record;
  }

  // Revising an existing target - productId is never re-submitted by
  // the caller, it comes only from the prior version's own record, so
  // the product's identity always carries over automatically exactly
  // as the person asked for. Atomically closes the prior version's
  // effectiveTo and opens the new one - never an in-place update of
  // the old row's rate, which would silently rewrite what the target
  // used to be during the period it was actually in force.
  async revise(productId: string, dto: ReviseProductTargetDto, user: any) {
    const prior = await this.prisma.productStandardProductivity.findFirst({
      where: { companyId: user.companyId, productId, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
      include: this.includes(),
    });
    if (!prior) {
      throw new NotFoundException('No existing target found for this product - use create to set the first target');
    }

    const newEffectiveFrom = new Date(dto.effectiveFrom);
    if (newEffectiveFrom <= prior.effectiveFrom) {
      throw new BadRequestException(
        `New effective date must be after the current version's effective date (${prior.effectiveFrom.toISOString().slice(0, 10)}) - a target revision cannot be backdated into an already-effective version`,
      );
    }

    const [, created] = await this.prisma.$transaction([
      this.prisma.productStandardProductivity.update({
        where: { id: prior.id },
        data: { effectiveTo: newEffectiveFrom, updatedBy: user.id },
      }),
      this.prisma.productStandardProductivity.create({
        data: {
          companyId: user.companyId, productId,
          piecesPerManHour: dto.piecesPerManHour, effectiveFrom: newEffectiveFrom, effectiveTo: null,
          createdBy: user.id, updatedBy: user.id,
        },
      }),
    ]);

    const full = await this.prisma.productStandardProductivity.findUnique({ where: { id: created.id }, include: this.includes() });

    await this.audit.log({
      tableName: 'product_standard_productivity', recordId: prior.id, action: 'UPDATE',
      oldValues: { effectiveTo: null, piecesPerManHour: prior.piecesPerManHour },
      newValues: { effectiveTo: newEffectiveFrom },
      changedBy: user.id,
    });
    await this.audit.log({
      tableName: 'product_standard_productivity', recordId: created.id, action: 'CREATE',
      newValues: { productId, piecesPerManHour: dto.piecesPerManHour, effectiveFrom: newEffectiveFrom, previousVersionId: prior.id },
      changedBy: user.id,
    });

    return full;
  }

  async findAll(user: any, query: any) {
    const where: any = { companyId: user.companyId };
    if (query?.productId) where.productId = query.productId;
    return this.prisma.productStandardProductivity.findMany({
      where, include: this.includes(),
      orderBy: [{ productId: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  async findByProduct(productId: string, user: any) {
    return this.prisma.productStandardProductivity.findMany({
      where: { companyId: user.companyId, productId },
      include: this.includes(),
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  // Same selection logic as ProductionEntryService's snapshot query -
  // the version whose window contains "now". Used by the frontend to
  // show the current target and to auto-fill the product identity
  // when opening the revise form, so this is the single source of
  // truth for "what does the current target say" in both places.
  async findCurrent(productId: string, user: any) {
    const now = new Date();
    const current = await this.prisma.productStandardProductivity.findFirst({
      where: {
        companyId: user.companyId, productId, isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { effectiveFrom: 'desc' },
      include: this.includes(),
    });
    if (!current) throw new NotFoundException('No current target set for this product');
    return current;
  }
}
