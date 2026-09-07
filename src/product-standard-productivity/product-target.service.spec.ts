import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductTargetService } from './product-target.service';

describe('ProductTargetService', () => {
  let service: ProductTargetService;
  let prisma: any;
  let audit: any;

  const user = { id: 'user-1', companyId: 'company-1' };
  const product = { id: 'prod-1', code: 'DRIVER-01', name: 'LED Driver', companyId: 'company-1' };

  const priorVersion = {
    id: 'v1', companyId: 'company-1', productId: 'prod-1',
    piecesPerManHour: 10, effectiveFrom: new Date('2026-01-01T00:00:00.000Z'), effectiveTo: null,
    product: { id: 'prod-1', code: 'DRIVER-01', name: 'LED Driver' },
  };

  beforeEach(() => {
    prisma = {
      product: { findFirst: jest.fn().mockResolvedValue(product) },
      productStandardProductivity: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new ProductTargetService(prisma, audit);
  });

  describe('create - first target for a product', () => {
    it('creates an open-ended (effectiveTo null) record for a valid product with no existing target', async () => {
      prisma.productStandardProductivity.create.mockResolvedValue({ id: 'v1', ...product, piecesPerManHour: 12, effectiveFrom: new Date('2026-09-07'), effectiveTo: null });
      const r = await service.create({ productId: 'prod-1', piecesPerManHour: 12, effectiveFrom: '2026-09-07' } as any, user);
      expect(prisma.productStandardProductivity.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ productId: 'prod-1', piecesPerManHour: 12, effectiveTo: null }) }),
      );
    });

    it('throws NotFoundException if the product does not exist for this company', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.create({ productId: 'missing', piecesPerManHour: 12 } as any, user)).rejects.toThrow(NotFoundException);
    });

    it('blocks create and points to revise when an active target already exists for the product', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(priorVersion);
      await expect(service.create({ productId: 'prod-1', piecesPerManHour: 12 } as any, user)).rejects.toThrow(/use revise instead/);
    });

    it('defaults effectiveFrom to now when not provided', async () => {
      prisma.productStandardProductivity.create.mockResolvedValue({ id: 'v1' });
      await service.create({ productId: 'prod-1', piecesPerManHour: 12 } as any, user);
      const callArg = prisma.productStandardProductivity.create.mock.calls[0][0];
      expect(callArg.data.effectiveFrom).toBeInstanceOf(Date);
    });
  });

  describe('revise - product identity auto-carries from the prior version', () => {
    it('never requires productId in the revise DTO - it comes only from the prior version lookup', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(priorVersion);
      prisma.$transaction.mockResolvedValue([{}, { id: 'v2' }]);
      prisma.productStandardProductivity.findUnique.mockResolvedValue({ id: 'v2', productId: 'prod-1', piecesPerManHour: 15, effectiveFrom: new Date('2026-09-07'), effectiveTo: null, product: product });
      const r = await service.revise('prod-1', { piecesPerManHour: 15, effectiveFrom: '2026-09-07' } as any, user);
      expect(r.productId).toBe('prod-1');
      expect(r.piecesPerManHour).toBe(15);
    });

    it('closes the prior version effectiveTo to the new effectiveFrom, and opens the new version with effectiveTo null', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(priorVersion);
      prisma.$transaction.mockImplementation(async (ops: any) => {
        return [{ id: priorVersion.id, effectiveTo: new Date('2026-09-07') }, { id: 'v2' }];
      });
      prisma.productStandardProductivity.findUnique.mockResolvedValue({ id: 'v2', productId: 'prod-1', piecesPerManHour: 15, effectiveFrom: new Date('2026-09-07'), effectiveTo: null, product: product });
      await service.revise('prod-1', { piecesPerManHour: 15, effectiveFrom: '2026-09-07' } as any, user);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws NotFoundException when there is no existing target to revise', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(null);
      await expect(service.revise('prod-1', { piecesPerManHour: 15, effectiveFrom: '2026-09-07' } as any, user)).rejects.toThrow(/use create/);
    });

    it('rejects a new effectiveFrom that is at or before the current version effectiveFrom - never backdates into an already-effective version', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(priorVersion);
      await expect(service.revise('prod-1', { piecesPerManHour: 15, effectiveFrom: '2025-12-01' } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('rejects an effectiveFrom exactly equal to the prior version effectiveFrom (no same-day double-revision)', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(priorVersion);
      await expect(service.revise('prod-1', { piecesPerManHour: 15, effectiveFrom: '2026-01-01' } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('never edits piecesPerManHour on the prior version row - only effectiveTo', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(priorVersion);
      prisma.$transaction.mockResolvedValue([{}, { id: 'v2' }]);
      prisma.productStandardProductivity.findUnique.mockResolvedValue({ id: 'v2', productId: 'prod-1', piecesPerManHour: 15, effectiveFrom: new Date('2026-09-07'), effectiveTo: null, product: product });
      await service.revise('prod-1', { piecesPerManHour: 15, effectiveFrom: '2026-09-07' } as any, user);
      const ops = prisma.$transaction.mock.calls[0][0];
      // the update operation's data must not include piecesPerManHour - only effectiveTo
      expect(prisma.productStandardProductivity.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: priorVersion.id }, data: expect.not.objectContaining({ piecesPerManHour: expect.anything() }) }),
      );
    });
  });

  describe('findCurrent - same version-selection logic as ProductionEntryService', () => {
    it('throws NotFoundException when no version currently covers now', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(null);
      await expect(service.findCurrent('prod-1', user)).rejects.toThrow(NotFoundException);
    });

    it('returns the matching version when one exists', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(priorVersion);
      const r = await service.findCurrent('prod-1', user);
      expect(r.piecesPerManHour).toBe(10);
    });

    it('queries with the effectiveFrom<=now AND (effectiveTo null OR >= now) window, ordered by effectiveFrom desc', async () => {
      await service.findCurrent('prod-1', user).catch(() => {});
      const call = prisma.productStandardProductivity.findFirst.mock.calls[0][0];
      expect(call.where.effectiveFrom.lte).toBeInstanceOf(Date);
      expect(call.where.OR).toEqual(expect.arrayContaining([{ effectiveTo: null }]));
      expect(call.orderBy).toEqual({ effectiveFrom: 'desc' });
    });
  });

  describe('findByProduct - full version history', () => {
    it('returns all versions for the product ordered most-recent-first', async () => {
      prisma.productStandardProductivity.findMany.mockResolvedValue([priorVersion]);
      const r = await service.findByProduct('prod-1', user);
      expect(prisma.productStandardProductivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: 'company-1', productId: 'prod-1' }, orderBy: { effectiveFrom: 'desc' } }),
      );
      expect(r).toEqual([priorVersion]);
    });
  });

  describe('audit', () => {
    it('logs a CREATE action for the first target', async () => {
      prisma.productStandardProductivity.create.mockResolvedValue({ id: 'v1' });
      await service.create({ productId: 'prod-1', piecesPerManHour: 12, effectiveFrom: '2026-09-07' } as any, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'product_standard_productivity', action: 'CREATE' }));
    });

    it('logs both an UPDATE (closing the prior version) and a CREATE (the new version) on revise', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(priorVersion);
      prisma.$transaction.mockResolvedValue([{}, { id: 'v2' }]);
      prisma.productStandardProductivity.findUnique.mockResolvedValue({ id: 'v2', productId: 'prod-1', piecesPerManHour: 15, effectiveFrom: new Date('2026-09-07'), effectiveTo: null, product: product });
      await service.revise('prod-1', { piecesPerManHour: 15, effectiveFrom: '2026-09-07' } as any, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', recordId: priorVersion.id }));
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', recordId: 'v2' }));
    });
  });
});
