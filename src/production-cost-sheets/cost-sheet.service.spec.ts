import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CostSheetService } from './cost-sheet.service';

describe('CostSheetService PROD018', () => {
  let service: CostSheetService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const cleanWo = {
    id: 'wo-1', companyId: 'company-1', woNumber: 'WO-TEST-001', status: 'IN_PROGRESS',
    stageStatus: 'IN_PRODUCTION', stageName: 'Packaging', cumulativeInputQty: 200, cumulativeProcessedQty: 200,
    closedAt: null, bomId: null, plannedQty: 1000, completedQty: 200,
  };

  beforeEach(() => {
    prisma = {
      workOrder: { findFirst: jest.fn().mockResolvedValue(cleanWo), update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...cleanWo, ...data })) },
      downtime: { findFirst: jest.fn().mockResolvedValue(null) },
      productionQc: { count: jest.fn().mockResolvedValue(0), aggregate: jest.fn().mockResolvedValue({ _sum: { holdQty: 0 } }) },
      rework: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      scrap: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      productionEntry: { findMany: jest.fn().mockResolvedValue([]) },
      fgReceipt: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      productionIssueItem: { findMany: jest.fn().mockResolvedValue([]) },
      bom: { findFirst: jest.fn().mockResolvedValue(null) },
      productionCostSheet: {
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'pcs-1', ...data })),
        findFirst: jest.fn().mockImplementation(({ where }: any) => Promise.resolve({ id: where.id, companyId: 'company-1', status: 'DRAFT' })),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'pcs-1', ...data })),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new CostSheetService(prisma, audit);
  });

  describe('validateClosure: passes when clean', () => {
    it('passes with no blockers when everything is resolved', async () => {
      const result = await service.validateClosure('wo-1', user);
      expect(result.passed).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });
  });

  describe('validateClosure: blockers (manual tests 1-9)', () => {
    it('blocks on unresolved WIP', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...cleanWo, cumulativeInputQty: 200, cumulativeProcessedQty: 195 });
      const result = await service.validateClosure('wo-1', user);
      expect(result.passed).toBe(false);
      expect(result.blockers[0]).toContain('5 PCS UNRESOLVED WIP');
    });

    it('blocks on an open downtime record', async () => {
      prisma.downtime.findFirst.mockResolvedValue({ reason: 'Machine breakdown', status: 'OPEN' });
      const result = await service.validateClosure('wo-1', user);
      expect(result.passed).toBe(false);
      expect(result.blockers.some((b: string) => b.includes('downtime'))).toBe(true);
    });

    it('blocks on QC pending inspections', async () => {
      prisma.productionQc.count.mockResolvedValue(2);
      const result = await service.validateClosure('wo-1', user);
      expect(result.passed).toBe(false);
      expect(result.blockers.some((b: string) => b.includes('PENDING'))).toBe(true);
    });

    it('blocks on unresolved QC Hold quantity', async () => {
      prisma.productionQc.aggregate.mockResolvedValue({ _sum: { holdQty: 3 } });
      const result = await service.validateClosure('wo-1', user);
      expect(result.passed).toBe(false);
      expect(result.blockers.some((b: string) => b.includes('QC HOLD'))).toBe(true);
    });

    it('blocks on open rework records', async () => {
      prisma.rework.count.mockResolvedValue(1);
      const result = await service.validateClosure('wo-1', user);
      expect(result.passed).toBe(false);
      expect(result.blockers.some((b: string) => b.includes('rework'))).toBe(true);
    });

    it('blocks on pending final rejection disposition', async () => {
      prisma.scrap.count.mockResolvedValue(1);
      const result = await service.validateClosure('wo-1', user);
      expect(result.passed).toBe(false);
      expect(result.blockers.some((b: string) => b.includes('pending disposition'))).toBe(true);
    });

    it('blocks on a paused stage', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...cleanWo, stageStatus: 'PAUSED' });
      const result = await service.validateClosure('wo-1', user);
      expect(result.passed).toBe(false);
    });
  });

  describe('closeWorkOrder: gated on revalidation', () => {
    it('blocks closure when validation fails, revalidating rather than trusting a stale check', async () => {
      prisma.rework.count.mockResolvedValue(1);
      await expect(service.closeWorkOrder('wo-1', user)).rejects.toThrow(BadRequestException);
    });

    it('closes the WO when validation passes, setting COMPLETED/closedAt/closedById', async () => {
      const result = await service.closeWorkOrder('wo-1', user);
      expect(result.workOrder.status).toBe('COMPLETED');
      expect(result.workOrder.closedById).toBe(user.id);
      expect(result.workOrder.closedAt).toBeDefined();
    });

    it('blocks a duplicate close attempt on an already-closed WO', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...cleanWo, closedAt: new Date() });
      await expect(service.closeWorkOrder('wo-1', user)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for a nonexistent WO', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(null);
      await expect(service.closeWorkOrder('wo-nonexistent', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('corrected labour cost (manual test 12) - real timeline, not a hardcoded rate', () => {
    it('sums actualLabourHours/actualLabourCost from confirmed entries instead of totalShifts * 8 * 50', async () => {
      prisma.productionEntry.findMany.mockResolvedValue([
        { status: 'CONFIRMED', actualLabourHours: 100, actualLabourCost: 1500 },
        { status: 'CONFIRMED', actualLabourHours: 87, actualLabourCost: 1305 },
      ]);
      const sheet = await service.generateFromWo('wo-1', user);
      expect(sheet.laborHours).toBe(187);
      expect(sheet.laborCost).toBe(2805);
    });
  });

  describe('rework cost included, never reset (manual test 13)', () => {
    it('sums Rework.totalAdditionalCost into reworkCost and gross cost', async () => {
      prisma.rework.findMany.mockResolvedValue([{ totalAdditionalCost: 300 }]);
      const sheet = await service.generateFromWo('wo-1', user);
      expect(sheet.reworkCost).toBe(300);
      expect(sheet.grossActualCost).toBeGreaterThanOrEqual(300);
    });
  });

  describe('scrap recovery offsets net cost, never estimated value (manual test 14)', () => {
    it('subtracts only recognizedScrapRecovery from gross to compute net', async () => {
      prisma.productionEntry.findMany.mockResolvedValue([{ status: 'CONFIRMED', actualLabourHours: 0, actualLabourCost: 25000 }]);
      prisma.scrap.findMany.mockResolvedValue([{ recognizedScrapRecovery: 500 }]);
      const sheet = await service.generateFromWo('wo-1', user);
      expect(sheet.scrapRecovery).toBe(500);
      expect(sheet.netActualCost).toBe(sheet.grossActualCost - 500);
    });
  });

  describe('correct denominator - final good FG qty, not completedQty (manual tests 15-16)', () => {
    it('uses sum of FgReceipt.receivedQty with sourceProductionQcId set, not wo.completedQty', async () => {
      prisma.fgReceipt.findMany.mockResolvedValue([{ receivedQty: 980, sourceProductionQcId: 'qc-1' }]);
      prisma.productionEntry.findMany.mockResolvedValue([{ status: 'CONFIRMED', actualLabourHours: 0, actualLabourCost: 24500 }]);
      const sheet = await service.generateFromWo('wo-1', user);
      expect(sheet.finalGoodFgQty).toBe(980);
      expect(sheet.unitCost).toBeCloseTo(25.0, 2);
    });
  });

  describe('zero good FG - no divide by zero (manual test 18)', () => {
    it('returns unitCost 0 rather than throwing when finalGoodFgQty is zero', async () => {
      prisma.fgReceipt.findMany.mockResolvedValue([]);
      const sheet = await service.generateFromWo('wo-1', user);
      expect(sheet.finalGoodFgQty).toBe(0);
      expect(sheet.unitCost).toBe(0);
    });
  });
});
