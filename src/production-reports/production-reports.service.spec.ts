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
});
