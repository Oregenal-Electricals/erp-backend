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
});
