import { StockLedgerService } from './stock-ledger.service';

describe('StockLedgerService.getMaterialSummary - STORE-010', () => {
  let service: StockLedgerService;
  let prisma: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      stockBalance: { findMany: jest.fn().mockResolvedValue([]) },
      iqcItem: { findMany: jest.fn().mockResolvedValue([]) },
      holdStockItem: { findMany: jest.fn().mockResolvedValue([]) },
      rejectedStockItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new StockLedgerService(prisma, {} as any, {} as any);
  });

  it('matches the spec example: 800+700 available, 200 QC pending, 100 hold, 50 rejected -> physical total 1850', async () => {
    prisma.stockBalance.findMany.mockResolvedValue([
      { itemCode: 'DRIVER-01', itemName: 'LED Driver', availableQty: 800, reservedQty: 0, putAwayPendingQty: 0 },
      { itemCode: 'DRIVER-01', itemName: 'LED Driver', availableQty: 700, reservedQty: 0, putAwayPendingQty: 0 },
    ]);
    prisma.iqcItem.findMany.mockResolvedValue([{ receivedQty: 200 }]);
    prisma.holdStockItem.findMany.mockResolvedValue([{ holdQty: 100 }]);
    prisma.rejectedStockItem.findMany.mockResolvedValue([{ rejectedQty: 50 }]);

    const r = await service.getMaterialSummary('DRIVER-01', user);
    expect(r.available).toBe(1500);
    expect(r.qcPending).toBe(200);
    expect(r.hold).toBe(100);
    expect(r.rejected).toBe(50);
    expect(r.physicalTotal).toBe(1850);
  });

  it('reserved is a commitment against available, not extra physical stock (freeAvailable = available - reserved)', async () => {
    prisma.stockBalance.findMany.mockResolvedValue([
      { itemCode: 'DRIVER-01', itemName: 'LED Driver', availableQty: 1500, reservedQty: 300, putAwayPendingQty: 0 },
    ]);
    const r = await service.getMaterialSummary('DRIVER-01', user);
    expect(r.available).toBe(1500);
    expect(r.reserved).toBe(300);
    expect(r.freeAvailable).toBe(1200);
    // Reserved must not inflate physicalTotal - it's already inside available.
    expect(r.physicalTotal).toBe(1500);
  });

  it('only counts IqcItems from inspections that have not yet been APPROVED as QC Pending', async () => {
    await service.getMaterialSummary('DRIVER-01', user);
    const call = prisma.iqcItem.findMany.mock.calls[0][0];
    expect(call.where.iqc.status).toEqual({ not: 'APPROVED' });
  });

  it('only counts HoldStockItems still PENDING reinspection as Hold - already-reinspected items are excluded', async () => {
    await service.getMaterialSummary('DRIVER-01', user);
    const call = prisma.holdStockItem.findMany.mock.calls[0][0];
    expect(call.where.reinspectionStatus).toBe('PENDING');
  });

  it('includes Put-Away Pending in physicalTotal but not in available/freeAvailable', async () => {
    prisma.stockBalance.findMany.mockResolvedValue([
      { itemCode: 'DRIVER-01', itemName: 'LED Driver', availableQty: 600, reservedQty: 0, putAwayPendingQty: 400 },
    ]);
    const r = await service.getMaterialSummary('DRIVER-01', user);
    expect(r.available).toBe(600);
    expect(r.putAwayPending).toBe(400);
    expect(r.physicalTotal).toBe(1000);
  });

  it('never returns a negative freeAvailable even if reserved somehow exceeds available', async () => {
    prisma.stockBalance.findMany.mockResolvedValue([
      { itemCode: 'DRIVER-01', itemName: 'LED Driver', availableQty: 100, reservedQty: 150, putAwayPendingQty: 0 },
    ]);
    const r = await service.getMaterialSummary('DRIVER-01', user);
    expect(r.freeAvailable).toBe(0);
  });
});
