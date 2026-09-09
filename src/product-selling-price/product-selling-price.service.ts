import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateSellingPriceDto, ReviseSellingPriceDto } from './dto/product-selling-price.dto';

@Injectable()
export class ProductSellingPriceService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return { product: { select: { id: true, code: true, name: true } } };
  }

  // Same version-chain discipline as ProductStandardProductivity: once
  // any record exists for a product, all further changes go through
  // revise() so there's never more than one open-ended (effectiveTo=null)
  // "current" price per product.
  async create(dto: CreateSellingPriceDto, user: any) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.productSellingPrice.findFirst({
      where: { companyId: user.companyId, productId: dto.productId, isActive: true },
    });
    if (existing) {
      throw new BadRequestException('A selling price already exists for this product - use revise instead of create');
    }

    const effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();

    const record = await this.prisma.productSellingPrice.create({
      data: {
        companyId: user.companyId, productId: dto.productId,
        sellingPrice: dto.sellingPrice, effectiveFrom, effectiveTo: null,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({
      tableName: 'product_selling_prices', recordId: record.id, action: 'CREATE',
      newValues: { productId: dto.productId, sellingPrice: dto.sellingPrice, effectiveFrom },
      changedBy: user.id,
    });

    return record;
  }

  // Atomically closes the prior version's effectiveTo and opens the new
  // one - never an in-place update of the old row's price, so a
  // completed sale's P&L always reflects the price that was actually in
  // force at the time, per the project's own price-revision rule (old
  // approved order prices never change after a revision).
  async revise(productId: string, dto: ReviseSellingPriceDto, user: any) {
    const prior = await this.prisma.productSellingPrice.findFirst({
      where: { companyId: user.companyId, productId, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
      include: this.includes(),
    });
    if (!prior) {
      throw new NotFoundException('No existing selling price found for this product - use create to set the first price');
    }

    const newEffectiveFrom = new Date(dto.effectiveFrom);
    if (newEffectiveFrom <= prior.effectiveFrom) {
      throw new BadRequestException(
        `New effective date must be after the current version's effective date (${prior.effectiveFrom.toISOString().slice(0, 10)}) - a price revision cannot be backdated into an already-effective version`,
      );
    }

    const [, created] = await this.prisma.$transaction([
      this.prisma.productSellingPrice.update({
        where: { id: prior.id },
        data: { effectiveTo: newEffectiveFrom, updatedBy: user.id },
      }),
      this.prisma.productSellingPrice.create({
        data: {
          companyId: user.companyId, productId,
          sellingPrice: dto.sellingPrice, effectiveFrom: newEffectiveFrom, effectiveTo: null,
          createdBy: user.id, updatedBy: user.id,
        },
      }),
    ]);

    const full = await this.prisma.productSellingPrice.findUnique({ where: { id: created.id }, include: this.includes() });

    await this.audit.log({
      tableName: 'product_selling_prices', recordId: prior.id, action: 'UPDATE',
      oldValues: { effectiveTo: null, sellingPrice: prior.sellingPrice },
      newValues: { effectiveTo: newEffectiveFrom },
      changedBy: user.id,
    });
    await this.audit.log({
      tableName: 'product_selling_prices', recordId: created.id, action: 'CREATE',
      newValues: { productId, sellingPrice: dto.sellingPrice, effectiveFrom: newEffectiveFrom, previousVersionId: prior.id },
      changedBy: user.id,
    });

    return full;
  }

  async findAll(user: any, query: any) {
    const where: any = { companyId: user.companyId };
    if (query?.productId) where.productId = query.productId;
    return this.prisma.productSellingPrice.findMany({
      where, include: this.includes(),
      orderBy: [{ productId: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  async findByProduct(productId: string, user: any) {
    return this.prisma.productSellingPrice.findMany({
      where: { companyId: user.companyId, productId },
      include: this.includes(),
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  // Same window-selection logic as ProductStandardProductivity.findCurrent -
  // the version whose [effectiveFrom, effectiveTo) window contains "now".
  async findCurrent(productId: string, user: any) {
    const now = new Date();
    const current = await this.prisma.productSellingPrice.findFirst({
      where: {
        companyId: user.companyId, productId, isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { effectiveFrom: 'desc' },
      include: this.includes(),
    });
    if (!current) throw new NotFoundException('No current selling price set for this product');
    return current;
  }
}
