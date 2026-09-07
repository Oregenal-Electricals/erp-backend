import { ProductionReportsService } from './production-reports.service';

describe('ProductionReportsService.getDailyOutputByProduct', () => {
  let service: ProductionReportsService;
  let prisma: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  const entries = [
    {
      id: 'pe-1', entryDate: new Date('2026-09-01T08:00:00.000Z'), goodQty: 100, scrapQty: 5, reworkQty: 2,
      workOrder: { woNumber: 'WO-1', productCode: 'DRIVER-01', productName: 'LED Driver', stageName: 'SMT' },
    },
    {
      id: 'pe-2', entryDate: new Date('2026-09-01T16:00:00.000Z'), goodQty: 80, scrapQty: 3, reworkQty: 0,
      workOrder: { woNumber: 'WO-1', productCode: 'DRIVER-01', productName: 'LED Driver', stageName: 'SMT' },
    },
    {
      id: 'pe-3', entryDate: new Date('2026-09-02T08:00:00.000Z'), goodQty: 50, scrapQty: 1, reworkQty: 0,
      workOrder: { woNumber: 'WO-2', productCode: 'PCB-01', productName: 'PCB', stageName: 'ASSEMBLY' },
    },
  ];

  beforeEach(() => {
    prisma = {
      productionEntry: { findMany: jest.fn().mockResolvedValue(entries) },
    };
    service = new ProductionReportsService(prisma);
  });

  it('only queries CONFIRMED entries for this company (never DRAFT)', async () => {
    await service.getDailyOutputByProduct(user, {});
    expect(prisma.productionEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ companyId: 'company-1', status: 'CONFIRMED' }) }),
    );
  });

  it('buckets output by calendar day, summing across multiple entries on the same day', async () => {
    const r = await service.getDailyOutputByProduct(user, {});
    const sept1 = r.byDate.find((d: any) => d.date === '2026-09-01');
    expect(sept1.goodQty).toBe(180); // 100 + 80
    expect(sept1.scrapQty).toBe(8);  // 5 + 3
    expect(sept1.entries).toBe(2);
    const sept2 = r.byDate.find((d: any) => d.date === '2026-09-02');
    expect(sept2.goodQty).toBe(50);
  });

  it('groups output by product, summing across all dates for that product', async () => {
    const r = await service.getDailyOutputByProduct(user, {});
    const driver = r.byProduct.find((p: any) => p.productCode === 'DRIVER-01');
    expect(driver.goodQty).toBe(180);
    expect(driver.productName).toBe('LED Driver');
    const pcb = r.byProduct.find((p: any) => p.productCode === 'PCB-01');
    expect(pcb.goodQty).toBe(50);
  });

  it('sorts byDate chronologically and byProduct by goodQty descending', async () => {
    const r = await service.getDailyOutputByProduct(user, {});
    expect(r.byDate.map((d: any) => d.date)).toEqual(['2026-09-01', '2026-09-02']);
    expect(r.byProduct[0].productCode).toBe('DRIVER-01'); // 180 > 50
  });

  it('applies the productCode filter to the WorkOrder relation, not a raw entry field', async () => {
    await service.getDailyOutputByProduct(user, { productCode: 'DRIVER-01' });
    expect(prisma.productionEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ workOrder: { productCode: 'DRIVER-01' } }) }),
    );
  });

  it('applies fromDate/toDate as an entryDate range filter, same pattern as the other reports', async () => {
    await service.getDailyOutputByProduct(user, { fromDate: '2026-09-01', toDate: '2026-09-02' });
    const call = prisma.productionEntry.findMany.mock.calls[0][0];
    expect(call.where.entryDate.gte).toEqual(new Date('2026-09-01'));
    expect(call.where.entryDate.lte).toEqual(new Date('2026-09-02T23:59:59.999Z'));
  });

  it('returns correct grand totals across all products/dates', async () => {
    const r = await service.getDailyOutputByProduct(user, {});
    expect(r.totalGoodQty).toBe(230); // 100+80+50
    expect(r.totalScrapQty).toBe(9);  // 5+3+1
    expect(r.totalReworkQty).toBe(2);
    expect(r.totalEntries).toBe(3);
  });

  it('handles an empty result set without throwing', async () => {
    prisma.productionEntry.findMany.mockResolvedValue([]);
    const r = await service.getDailyOutputByProduct(user, {});
    expect(r.byDate).toEqual([]);
    expect(r.byProduct).toEqual([]);
    expect(r.totalGoodQty).toBe(0);
  });

  describe('Phase 2 - HOUR/MONTH granularity (same query, different truncation)', () => {
    it('defaults to DAY granularity when none is given, and echoes it back in the response', async () => {
      const r = await service.getDailyOutputByProduct(user, {});
      expect(r.granularity).toBe('DAY');
      expect(r.byDate[0].date).toBe('2026-09-01');
    });

    it('buckets by hour when granularity=HOUR - two same-day entries at different hours stay separate', async () => {
      const r = await service.getDailyOutputByProduct(user, { granularity: 'HOUR' });
      expect(r.granularity).toBe('HOUR');
      expect(r.byDate).toHaveLength(3); // 08:00 and 16:00 on Sept 1 are different hour buckets, plus Sept 2 08:00
      expect(r.byDate.map((d: any) => d.date)).toEqual(['2026-09-01T08', '2026-09-01T16', '2026-09-02T08']);
      const hour8 = r.byDate.find((d: any) => d.date === '2026-09-01T08');
      expect(hour8.goodQty).toBe(100); // only pe-1, not merged with pe-2's 16:00 entry
    });

    it('buckets by month when granularity=MONTH - both Sept 1 and Sept 2 entries merge into one bucket', async () => {
      const r = await service.getDailyOutputByProduct(user, { granularity: 'MONTH' });
      expect(r.granularity).toBe('MONTH');
      expect(r.byDate).toHaveLength(1);
      expect(r.byDate[0].date).toBe('2026-09');
      expect(r.byDate[0].goodQty).toBe(230); // 100 + 80 + 50, all three entries in one month bucket
    });

    it('falls back to DAY for an invalid/unrecognized granularity value rather than erroring', async () => {
      const r = await service.getDailyOutputByProduct(user, { granularity: 'FORTNIGHT' });
      expect(r.granularity).toBe('DAY');
    });

    it('byProduct totals are identical across granularities - only byDate bucketing changes', async () => {
      const daily = await service.getDailyOutputByProduct(user, { granularity: 'DAY' });
      const monthly = await service.getDailyOutputByProduct(user, { granularity: 'MONTH' });
      expect(daily.byProduct).toEqual(monthly.byProduct);
      expect(daily.totalGoodQty).toBe(monthly.totalGoodQty);
    });
  });

  describe('Phase 3 - OEE', () => {
    const oeeEntries = [
      {
        id: 'pe-a', entryDate: new Date('2026-09-01T08:00:00.000Z'),
        periodStart: new Date('2026-09-01T08:00:00.000Z'), periodEnd: new Date('2026-09-01T09:00:00.000Z'),
        downtimeMinutes: 10, targetQty: 120, totalQty: 100, goodQty: 90,
        workOrder: { productCode: 'DRIVER-01', productName: 'LED Driver' },
      },
      {
        id: 'pe-b', entryDate: new Date('2026-09-01T09:00:00.000Z'),
        periodStart: new Date('2026-09-01T09:00:00.000Z'), periodEnd: new Date('2026-09-01T10:00:00.000Z'),
        downtimeMinutes: 0, targetQty: null, totalQty: 50, goodQty: 45,
        workOrder: { productCode: 'DRIVER-01', productName: 'LED Driver' },
      },
    ];

    beforeEach(() => {
      prisma.productionEntry.findMany.mockResolvedValue(oeeEntries);
    });

    it('computes availability as (duration - downtime) / duration, summed across entries', async () => {
      const r = await service.getOeeReport(user, {});
      expect(r.overall.availability).toBeCloseTo((120 - 10) / 120, 5);
    });

    it('computes performance as totalQty/targetQty, summing before dividing', async () => {
      const r = await service.getOeeReport(user, {});
      expect(r.overall.performance).toBeCloseTo(150 / 120, 5);
    });

    it('computes quality as goodQty/totalQty across all entries', async () => {
      const r = await service.getOeeReport(user, {});
      expect(r.overall.quality).toBeCloseTo((90 + 45) / (100 + 50), 5);
    });

    it('an entry with no targetQty still contributes duration/downtime/quality, only performance/oee are withheld', async () => {
      prisma.productionEntry.findMany.mockResolvedValue([oeeEntries[1]]);
      const r = await service.getOeeReport(user, {});
      expect(r.overall.performance).toBeNull();
      expect(r.overall.availability).toBeCloseTo(1, 5);
      expect(r.overall.quality).toBeCloseTo(45 / 50, 5);
      expect(r.overall.oee).toBeNull();
    });

    it('OEE is the product of all three legs when all are available', async () => {
      const r = await service.getOeeReport(user, {});
      const expected = r.overall.availability * r.overall.performance * r.overall.quality;
      expect(r.overall.oee).toBeCloseTo(expected, 10);
    });

    it('groups by product with the same aggregate-then-ratio approach', async () => {
      const r = await service.getOeeReport(user, {});
      const driver = r.byProduct.find((p: any) => p.productCode === 'DRIVER-01');
      expect(driver.totalQty).toBe(150);
      expect(driver.oee).toBeCloseTo(r.overall.oee, 10);
    });

    it('treats a missing period as zero duration without throwing', async () => {
      prisma.productionEntry.findMany.mockResolvedValue([
        { id: 'pe-c', entryDate: new Date('2026-09-03T08:00:00.000Z'), periodStart: null, periodEnd: null, downtimeMinutes: 0, targetQty: 10, totalQty: 10, goodQty: 10, workOrder: { productCode: 'X', productName: 'X' } },
      ]);
      const r = await service.getOeeReport(user, {});
      expect(r.overall.availability).toBeNull();
    });

    it('handles an empty result set without throwing', async () => {
      prisma.productionEntry.findMany.mockResolvedValue([]);
      const r = await service.getOeeReport(user, {});
      expect(r.byDate).toEqual([]);
      expect(r.byProduct).toEqual([]);
      expect(r.overall.availability).toBeNull();
      expect(r.totalEntries).toBe(0);
    });
  });

  describe('Phase 4 - Cost Trend', () => {
    const costSheets = [
      {
        id: 'pcs-a', status: 'FINALIZED',
        materialCost: 500, laborCost: 200, overheadCost: 50, otherCost: 10,
        netActualCost: 760, finalGoodFgQty: 100,
        workOrder: { woNumber: 'WO-1', productCode: 'DRIVER-01', productName: 'LED Driver', closedAt: new Date('2026-09-01T10:00:00.000Z') },
      },
      {
        id: 'pcs-b', status: 'FINALIZED',
        materialCost: 300, laborCost: 100, overheadCost: 20, otherCost: 5,
        netActualCost: 425, finalGoodFgQty: 50,
        workOrder: { woNumber: 'WO-2', productCode: 'DRIVER-01', productName: 'LED Driver', closedAt: new Date('2026-09-02T10:00:00.000Z') },
      },
    ];

    beforeEach(() => {
      prisma.productionCostSheet = {
        findMany: jest.fn().mockResolvedValue(costSheets),
      };
    });

    it('only queries FINALIZED cost sheets for this company', async () => {
      await service.getCostTrend(user, {});
      expect(prisma.productionCostSheet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ companyId: 'company-1', status: 'FINALIZED' }) }),
      );
    });

    it('buckets by WorkOrder.closedAt, not by cost sheet createdAt/updatedAt', async () => {
      const r = await service.getCostTrend(user, {});
      expect(r.byDate.map((d: any) => d.date)).toEqual(['2026-09-01', '2026-09-02']);
    });

    it('groups by product, summing cost components across multiple WOs for the same product', async () => {
      const r = await service.getCostTrend(user, {});
      const driver = r.byProduct.find((p: any) => p.productCode === 'DRIVER-01');
      expect(driver.materialCost).toBe(800); // 500 + 300
      expect(driver.laborCost).toBe(300);    // 200 + 100
      expect(driver.netActualCost).toBe(1185); // 760 + 425
      expect(driver.finalGoodFgQty).toBe(150); // 100 + 50
      expect(driver.woCount).toBe(2);
    });

    it('computes avgUnitCost from summed netActualCost/finalGoodFgQty, not an average of individual unit costs', async () => {
      const r = await service.getCostTrend(user, {});
      const driver = r.byProduct.find((p: any) => p.productCode === 'DRIVER-01');
      // pcs-a alone would be 760/100=7.6, pcs-b alone 425/50=8.5 - a naive
      // average would be 8.05, but the aggregate ratio is 1185/150=7.9
      expect(driver.avgUnitCost).toBeCloseTo(1185 / 150, 5);
      expect(driver.avgUnitCost).not.toBeCloseTo((7.6 + 8.5) / 2, 2);
    });

    it('returns null avgUnitCost rather than dividing by zero when finalGoodFgQty is 0', async () => {
      prisma.productionCostSheet.findMany.mockResolvedValue([
        { id: 'pcs-c', status: 'FINALIZED', materialCost: 100, laborCost: 0, overheadCost: 0, otherCost: 0, netActualCost: 100, finalGoodFgQty: 0, workOrder: { woNumber: 'WO-3', productCode: 'X', productName: 'X', closedAt: new Date('2026-09-05T00:00:00.000Z') } },
      ]);
      const r = await service.getCostTrend(user, {});
      expect(r.byProduct[0].avgUnitCost).toBeNull();
    });

    it('applies the productCode filter to the WorkOrder relation', async () => {
      await service.getCostTrend(user, { productCode: 'DRIVER-01' });
      expect(prisma.productionCostSheet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ workOrder: expect.objectContaining({ productCode: 'DRIVER-01' }) }) }),
      );
    });

    it('applies fromDate/toDate as a WorkOrder.closedAt range filter', async () => {
      await service.getCostTrend(user, { fromDate: '2026-09-01', toDate: '2026-09-02' });
      const call = prisma.productionCostSheet.findMany.mock.calls[0][0];
      expect(call.where.workOrder.closedAt.gte).toEqual(new Date('2026-09-01'));
      expect(call.where.workOrder.closedAt.lte).toEqual(new Date('2026-09-02T23:59:59.999Z'));
    });

    it('returns correct grand totals across all products/dates', async () => {
      const r = await service.getCostTrend(user, {});
      expect(r.totals.materialCost).toBe(800);
      expect(r.totals.netActualCost).toBe(1185);
      expect(r.totals.avgUnitCost).toBeCloseTo(1185 / 150, 5);
      expect(r.totalWos).toBe(2);
    });

    it('handles an empty result set without throwing', async () => {
      prisma.productionCostSheet.findMany.mockResolvedValue([]);
      const r = await service.getCostTrend(user, {});
      expect(r.byDate).toEqual([]);
      expect(r.byProduct).toEqual([]);
      expect(r.totals.avgUnitCost).toBeNull();
      expect(r.totalWos).toBe(0);
    });

    it('skips a sheet defensively if its WorkOrder has no closedAt rather than throwing', async () => {
      prisma.productionCostSheet.findMany.mockResolvedValue([
        { id: 'pcs-d', status: 'FINALIZED', materialCost: 10, laborCost: 0, overheadCost: 0, otherCost: 0, netActualCost: 10, finalGoodFgQty: 5, workOrder: { woNumber: 'WO-4', productCode: 'Y', productName: 'Y', closedAt: null } },
      ]);
      const r = await service.getCostTrend(user, {});
      expect(r.byDate).toEqual([]);
      expect(r.totalWos).toBe(1); // still counted in the raw fetch, just not bucketed
    });
  });
});
