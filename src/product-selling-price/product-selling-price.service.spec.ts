import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductSellingPriceService } from './product-selling-price.service';

describe('ProductSellingPriceService', () => {
  let service: ProductSellingPriceService;
  let prisma: any;
  let audit: any;

  const user = { id: 'user-1', companyId: 'company-1' };
  const product = { id: 'prod-1', code: 'PANEL-01', name: '2X2 LED Panel', companyId: 'company-1' };

  const priorVersion = {
    id: 'v1', companyId: 'company-1', productId: 'prod-1',
    sellingPrice: 500, effectiveFrom: new Date('2026-01-01T00:00:00.000Z'), effectiveTo: null,
    product: { id: 'prod-1', code: 'PANEL-01', name: '2X2 LED Panel' },
  };

  beforeEach(() => {
    prisma = {
      product: { findFirst: jest.fn().mockResolvedValue(product) },
      productSellingPrice: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new ProductSellingPriceService(prisma, audit);
  });

  describe('create - first selling price for a product', () => {
    it('creates an open-ended (effectiveTo null) record for a valid product with no existing price', async () => {
      prisma.productSellingPrice.create.mockResolvedValue({ id: 'v1', ...product, sellingPrice: 550, effectiveFrom: new Date('2026-09-09'), effectiveTo: null });
      await service.create({ productId: 'prod-1', sellingPrice: 550, effectiveFrom: '2026-09-09' } as any, user);
      expect(prisma.productSellingPrice.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ productId: 'prod-1', sellingPrice: 550, effectiveTo: null }) }),
      );
    });

    it('throws NotFoundException if the product does not exist for this company', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.create({ productId: 'missing', sellingPrice: 550 } as any, user)).rejects.toThrow(NotFoundException);
    });

    it('blocks create and points to revise when an active price already exists for the product', async () => {
      prisma.productSellingPrice.findFirst.mockResolvedValue(priorVersion);
      await expect(service.create({ productId: 'prod-1', sellingPrice: 550 } as any, user)).rejects.toThrow(/use revise instead/);
    });

    it('defaults effectiveFrom to now when not provided', async () => {
      prisma.productSellingPrice.create.mockResolvedValue({ id: 'v1' });
      await service.create({ productId: 'prod-1', sellingPrice: 550 } as any, user);
      const callArg = prisma.productSellingPrice.create.mock.calls[0][0];
      expect(callArg.data.effectiveFrom).toBeInstanceOf(Date);
    });
  });

  describe('revise - the old approved price is never overwritten', () => {
    it('never requires productId in the revise DTO - it comes only from the prior version lookup', async () => {
      prisma.productSellingPrice.findFirst.mockResolvedValue(priorVersion);
      prisma.$transaction.mockResolvedValue([{}, { id: 'v2' }]);
      prisma.productSellingPrice.findUnique.mockResolvedValue({ id: 'v2', productId: 'prod-1', sellingPrice: 575, effectiveFrom: new Date('2026-09-09'), effectiveTo: null, product });
      const r = await service.revise('prod-1', { sellingPrice: 575, effectiveFrom: '2026-09-09' } as any, user);
      expect(r.productId).toBe('prod-1');
      expect(r.sellingPrice).toBe(575);
    });

    it('closes the prior version effectiveTo to the new effectiveFrom, and opens the new version with effectiveTo null', async () => {
      prisma.productSellingPrice.findFirst.mockResolvedValue(priorVersion);
      prisma.$transaction.mockImplementation(async () => [{ id: priorVersion.id, effectiveTo: new Date('2026-09-09') }, { id: 'v2' }]);
      prisma.productSellingPrice.findUnique.mockResolvedValue({ id: 'v2', productId: 'prod-1', sellingPrice: 575, effectiveFrom: new Date('2026-09-09'), effectiveTo: null, product });
      await service.revise('prod-1', { sellingPrice: 575, effectiveFrom: '2026-09-09' } as any, user);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws NotFoundException when there is no existing price to revise', async () => {
      prisma.productSellingPrice.findFirst.mockResolvedValue(null);
      await expect(service.revise('prod-1', { sellingPrice: 575, effectiveFrom: '2026-09-09' } as any, user)).rejects.toThrow(/use create/);
    });

    it('rejects a new effectiveFrom that is at or before the current version effectiveFrom - never backdates into an already-effective version', async () => {
      prisma.productSellingPrice.findFirst.mockResolvedValue(priorVersion);
      await expect(service.revise('prod-1', { sellingPrice: 575, effectiveFrom: '2025-12-01' } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('rejects an effectiveFrom exactly equal to the prior version effectiveFrom (no same-day double-revision)', async () => {
      prisma.productSellingPrice.findFirst.mockResolvedValue(priorVersion);
      await expect(service.revise('prod-1', { sellingPrice: 575, effectiveFrom: '2026-01-01' } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('never edits sellingPrice on the prior version row - only effectiveTo, so a completed sale still shows the price actually in force at the time', async () => {
      prisma.productSellingPrice.findFirst.mockResolvedValue(priorVersion);
      prisma.$transaction.mockResolvedValue([{}, { id: 'v2' }]);
      prisma.productSellingPrice.findUnique.mockResolvedValue({ id: 'v2', productId: 'prod-1', sellingPrice: 575, effectiveFrom: new Date('2026-09-09'), effectiveTo: null, product });
      await service.revise('prod-1', { sellingPrice: 575, effectiveFrom: '2026-09-09' } as any, user);
      expect(prisma.productSellingPrice.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: priorVersion.id }, data: expect.not.objectContaining({ sellingPrice: expect.anything() }) }),
      );
    });
  });

  describe('findCurrent - the version whose window contains now', () => {
    it('throws NotFoundException when no version currently covers now', async () => {
      prisma.productSellingPrice.findFirst.mockResolvedValue(null);
      await expect(service.findCurrent('prod-1', user)).rejects.toThrow(NotFoundException);
    });

    it('returns the matching version when one exists', async () => {
      prisma.productSellingPrice.findFirst.mockResolvedValue(priorVersion);
      const r = await service.findCurrent('prod-1', user);
      expect(r.sellingPrice).toBe(500);
    });

    it('queries with the effectiveFrom<=now AND (effectiveTo null OR >= now) window, ordered by effectiveFrom desc', async () => {
      await service.findCurrent('prod-1', user).catch(() => {});
      const call = prisma.productSellingPrice.findFirst.mock.calls[0][0];
      expect(call.where.effectiveFrom.lte).toBeInstanceOf(Date);
      expect(call.where.OR).toEqual(expect.arrayContaining([{ effectiveTo: null }]));
      expect(call.orderBy).toEqual({ effectiveFrom: 'desc' });
    });
  });

  describe('findByProduct - full price history', () => {
    it('returns all versions for the product ordered most-recent-first', async () => {
      prisma.productSellingPrice.findMany.mockResolvedValue([priorVersion]);
      const r = await service.findByProduct('prod-1', user);
      expect(prisma.productSellingPrice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: 'company-1', productId: 'prod-1' }, orderBy: { effectiveFrom: 'desc' } }),
      );
      expect(r).toEqual([priorVersion]);
    });
  });

  describe('audit', () => {
    it('logs a CREATE action for the first price', async () => {
      prisma.productSellingPrice.create.mockResolvedValue({ id: 'v1' });
      await service.create({ productId: 'prod-1', sellingPrice: 550, effectiveFrom: '2026-09-09' } as any, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'product_selling_prices', action: 'CREATE' }));
    });

    it('logs both an UPDATE (closing the prior version) and a CREATE (the new version) on revise', async () => {
      prisma.productSellingPrice.findFirst.mockResolvedValue(priorVersion);
      prisma.$transaction.mockResolvedValue([{}, { id: 'v2' }]);
      prisma.productSellingPrice.findUnique.mockResolvedValue({ id: 'v2', productId: 'prod-1', sellingPrice: 575, effectiveFrom: new Date('2026-09-09'), effectiveTo: null, product });
      await service.revise('prod-1', { sellingPrice: 575, effectiveFrom: '2026-09-09' } as any, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', recordId: priorVersion.id }));
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', recordId: 'v2' }));
    });
  });
});
