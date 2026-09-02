import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductionEntryService } from './production-entry.service';

describe('ProductionEntryService — PROD-007: Stage-Wise Hourly Production Entry', () => {
  let service: ProductionEntryService;
  let prisma: any;
  let audit: any;
  let materialReservation: any;
  let settings: any;
  const user = { id: 'user-1', companyId: 'company-1', role: 'SUPERVISOR' };

  const firstStageWo = {
    id: 'wo-smt', companyId: 'company-1', woNumber: 'WO-2026-0001-SMT', status: 'IN_PROGRESS',
    productCode: '9W-LED', plannedQty: 1000, completedQty: 0, rejectedQty: 0,
    parentWorkOrderId: null, cumulativeInputQty: 0, cumulativeProcessedQty: 0,
    actualStartDate: new Date('2026-05-10T08:00:00'),
  };
  const subsequentStageWo = {
    ...firstStageWo, id: 'wo-mi', woNumber: 'WO-2026-0001-MI', parentWorkOrderId: 'wo-smt',
    cumulativeInputQty: 200, cumulativeProcessedQty: 0,
    actualStartDate: new Date('2026-05-10T10:15:00'),
  };

  beforeEach(() => {
    prisma = {
      workOrder: { findFirst: jest.fn(), update: jest.fn() },
      productionEntry: {
        findFirst: jest.fn().mockResolvedValue(null), // no overlap by default
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(), update: jest.fn(), count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: {} }),
      },
      manpowerAllocation: { findFirst: jest.fn().mockResolvedValue({ count: 25 }) },
      product: { findFirst: jest.fn().mockResolvedValue({ id: 'prod-1', code: '9W-LED' }) },
      productStandardProductivity: { findFirst: jest.fn().mockResolvedValue({ piecesPerManHour: 8, effectiveFrom: new Date('2026-01-01'), effectiveTo: null }) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    materialReservation = { releaseReservations: jest.fn() };
    settings = {
      getSettingValue: jest.fn((key: string, def: string) => {
        if (key === 'STANDARD_LABOUR_RATE_PER_SHIFT') return Promise.resolve('120');
        if (key === 'STANDARD_SHIFT_HOURS') return Promise.resolve('8');
        return Promise.resolve(def);
      }),
    };
    service = new ProductionEntryService(prisma, audit, materialReservation, settings);
  });

  describe('the exact spec example: normal hourly entry (manual test 1, section 65)', () => {
    it('25 manpower, 1 hour, 8pcs/man/hr -> target 200, 25 actual labour-hours, ₹375 cost', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(firstStageWo);
      prisma.productionEntry.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'entry-1', ...data }));

      const entry = await service.create({
        workOrderId: 'wo-smt', manpowerQty: 25, goodQty: 180, scrapQty: 10, reworkQty: 10,
        periodStart: '2026-05-10T08:00:00', periodEnd: '2026-05-10T09:00:00',
      } as any, user);

      expect(entry.targetQty).toBe(200);
      expect(entry.achievementPercent).toBe(90);
      expect(entry.actualLabourHours).toBe(25);
      expect(entry.labourRateSnapshot).toBe(15);
      expect(entry.actualLabourCost).toBe(375);
      expect(entry.totalQty).toBe(200);
      // target direct labour cost/pc = 15 / 8 = 1.875, computable from returned snapshot fields
      expect(entry.labourRateSnapshot / entry.productivityRateSnapshot).toBeCloseTo(1.875, 5);
      // actual direct labour cost per good piece = 375 / 180
      expect(entry.actualLabourCost / entry.goodQty).toBeCloseTo(2.0833, 3);
    });
  });

  describe('partial-hour entry uses actual duration, never a fabricated full hour (manual test 3, section 42)', () => {
    it('15 manpower, 40 minutes -> 10 labour-hours, 80 pcs target, ₹150 cost', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...firstStageWo, actualStartDate: new Date('2026-05-10T10:20:00') });
      prisma.productionEntry.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'entry-1', ...data }));

      const entry = await service.create({
        workOrderId: 'wo-smt', manpowerQty: 15, goodQty: 75,
        periodStart: '2026-05-10T10:20:00', periodEnd: '2026-05-10T11:00:00',
      } as any, user);

      expect(entry.actualLabourHours).toBe(10);
      expect(entry.targetQty).toBe(80);
      expect(entry.actualLabourCost).toBe(150);
    });
  });

  describe('input-availability control (spec sections 11-12, manual tests 6-7)', () => {
    it('blocks a downstream stage from processing more than its available upstream input', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(subsequentStageWo); // 200 available

      await expect(
        service.create({
          workOrderId: 'wo-mi', manpowerQty: 15, goodQty: 190, scrapQty: 10, reworkQty: 20,
          periodStart: '2026-05-10T10:15:00', periodEnd: '2026-05-10T11:00:00',
        } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows processing exactly the available input', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(subsequentStageWo);
      prisma.productionEntry.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'entry-1', ...data }));

      const entry = await service.create({
        workOrderId: 'wo-mi', manpowerQty: 15, goodQty: 170, scrapQty: 10, reworkQty: 20,
        periodStart: '2026-05-10T10:15:00', periodEnd: '2026-05-10T11:00:00',
      } as any, user);

      expect(entry.totalQty).toBe(200);
    });

    it('the first stage (no parentWorkOrderId) skips the input-availability check entirely', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(firstStageWo); // cumulativeInputQty 0, but no parent
      prisma.productionEntry.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'entry-1', ...data }));

      const entry = await service.create({
        workOrderId: 'wo-smt', manpowerQty: 25, goodQty: 180, scrapQty: 10, reworkQty: 10,
        periodStart: '2026-05-10T08:00:00', periodEnd: '2026-05-10T09:00:00',
      } as any, user);

      expect(entry.totalQty).toBe(200);
    });
  });

  describe('duplicate/overlapping period control (spec section 35, manual test 13)', () => {
    it('blocks an entry whose period overlaps an existing one', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(firstStageWo);
      prisma.productionEntry.findFirst.mockResolvedValue({ id: 'entry-existing', entryNumber: 'PE-2026-0001' });

      await expect(
        service.create({ workOrderId: 'wo-smt', manpowerQty: 25, goodQty: 100, periodStart: '2026-05-10T08:30:00', periodEnd: '2026-05-10T09:30:00' } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('time validations (spec sections 36-37, manual test scenarios)', () => {
    it('blocks a future-dated entry', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(firstStageWo);
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await expect(
        service.create({ workOrderId: 'wo-smt', manpowerQty: 25, goodQty: 100, periodStart: future.toISOString(), periodEnd: new Date(future.getTime() + 3600000).toISOString() } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks an entry period starting before the stage actually started', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...firstStageWo, actualStartDate: new Date('2026-05-10T09:20:00') });
      await expect(
        service.create({ workOrderId: 'wo-smt', manpowerQty: 25, goodQty: 100, periodStart: '2026-05-10T08:00:00', periodEnd: '2026-05-10T09:00:00' } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks a WO that is not yet IN_PROGRESS', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...firstStageWo, status: 'RELEASED' });
      await expect(
        service.create({ workOrderId: 'wo-smt', manpowerQty: 25, goodQty: 100, periodStart: '2026-05-10T08:00:00', periodEnd: '2026-05-10T09:00:00' } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('below/above target output (manual tests 8-9)', () => {
    it('below-target output does not reduce labour cost - cost stays time-based', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(firstStageWo);
      prisma.productionEntry.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'entry-1', ...data }));

      const entry = await service.create({
        workOrderId: 'wo-smt', manpowerQty: 25, goodQty: 160,
        periodStart: '2026-05-10T08:00:00', periodEnd: '2026-05-10T09:00:00',
      } as any, user);

      expect(entry.achievementPercent).toBe(80);
      expect(entry.actualLabourCost).toBe(375); // unchanged - time-based, not output-scaled
    });

    it('above-target output is allowed when sufficient input exists - target is not a production ceiling', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(firstStageWo);
      prisma.productionEntry.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'entry-1', ...data }));

      const entry = await service.create({
        workOrderId: 'wo-smt', manpowerQty: 25, goodQty: 220,
        periodStart: '2026-05-10T08:00:00', periodEnd: '2026-05-10T09:00:00',
      } as any, user);

      expect(entry.achievementPercent).toBe(110);
    });
  });

  describe('confirm() - the critical bug fix: no automatic WO completion (spec section 59)', () => {
    it('accumulating goodQty up to plannedQty never flips WO status to COMPLETED', async () => {
      const draftEntry = {
        id: 'entry-1', workOrderId: 'wo-smt', status: 'DRAFT', goodQty: 1000, scrapQty: 0, reworkQty: 0,
        workOrder: { ...firstStageWo, completedQty: 0, plannedQty: 1000 },
      };
      prisma.productionEntry.findFirst.mockResolvedValue(draftEntry);
      prisma.productionEntry.update.mockResolvedValue({ ...draftEntry, status: 'CONFIRMED' });

      await service.confirm('entry-1', user);

      const woUpdateCall = prisma.workOrder.update.mock.calls[0][0];
      expect(woUpdateCall.data.status).toBeUndefined();
      expect(woUpdateCall.data.completedQty).toBe(1000);
    });

    it('increments cumulativeProcessedQty by total processed (good+reject+rework), so downstream availableInput stays correct', async () => {
      const draftEntry = {
        id: 'entry-1', workOrderId: 'wo-mi', status: 'DRAFT', goodQty: 170, scrapQty: 10, reworkQty: 20,
        workOrder: { ...subsequentStageWo, completedQty: 0 },
      };
      prisma.productionEntry.findFirst.mockResolvedValue(draftEntry);
      prisma.productionEntry.update.mockResolvedValue({ ...draftEntry, status: 'CONFIRMED' });

      await service.confirm('entry-1', user);

      const woUpdateCall = prisma.workOrder.update.mock.calls[0][0];
      expect(woUpdateCall.data.cumulativeProcessedQty).toEqual({ increment: 200 });
    });

    it('never calls materialReservation.releaseReservations - completion-triggered release belongs to a later workflow now', async () => {
      const draftEntry = { id: 'entry-1', workOrderId: 'wo-smt', status: 'DRAFT', goodQty: 100, scrapQty: 0, reworkQty: 0, workOrder: { ...firstStageWo, completedQty: 900, plannedQty: 1000 } };
      prisma.productionEntry.findFirst.mockResolvedValue(draftEntry);
      prisma.productionEntry.update.mockResolvedValue({ ...draftEntry, status: 'CONFIRMED' });

      await service.confirm('entry-1', user);

      expect(materialReservation.releaseReservations).not.toHaveBeenCalled();
    });

    it('refuses to confirm an already-confirmed entry', async () => {
      prisma.productionEntry.findFirst.mockResolvedValue({ id: 'entry-1', status: 'CONFIRMED', workOrder: firstStageWo });
      await expect(service.confirm('entry-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('audit', () => {
    it('logs entry creation', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(firstStageWo);
      prisma.productionEntry.create.mockResolvedValue({ id: 'entry-1' });

      await service.create({ workOrderId: 'wo-smt', manpowerQty: 25, goodQty: 180, periodStart: '2026-05-10T08:00:00', periodEnd: '2026-05-10T09:00:00' } as any, user);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: 'production_entries', action: 'CREATE', changedBy: user.id }),
      );
    });
  });
});
