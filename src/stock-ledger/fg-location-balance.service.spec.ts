import { StockLedgerService } from './stock-ledger.service';

// TASK-057: FG receipts previously only ever touched StockBalance
// (item+warehouse) via receiveFromOqc() - there was no bin-level
// StockLocationBalance row for FG at all, unlike raw material, which
// gets one from StockPutawayService.complete(). These tests cover the
// new call into StockLocationBalanceService.adjustQty() that closes
// that gap.
describe('StockLedgerService.receiveFromOqc - TASK-057 StockLocationBalance integration', () => {
  let service: StockLedgerService;
  let prisma: any;
  let locationBalance: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const fgReceipt = {
    id: 'fgr-1', itemCode: '9W-LED', itemName: '9W Emergency LED Bulb',
    warehouseId: 'wh-fg', receivedQty: 150, unitCost: 42, batchNumber: null,
  };
  const oqc = { id: 'oqc-1', companyId: 'company-1', oqcNumber: 'OQC-2026-0001', status: 'RELEASED', fgReceipt };

  beforeEach(() => {
    prisma = {
      oqcInspection: { findFirst: jest.fn().mockResolvedValue(oqc) },
      stockLedger: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'ledger-1', ...data })),
      },
      stockBalance: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'bal-1', availableQty: 0, unitCost: 0 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      stockBatch: { create: jest.fn().mockResolvedValue({ id: 'batch-1' }) },
    };
    locationBalance = { adjustQty: jest.fn().mockResolvedValue(150) };
    service = new StockLedgerService(
      prisma,
      { log: jest.fn().mockResolvedValue(undefined) } as any,
      { recheckAllOpenPos: jest.fn().mockResolvedValue(undefined) } as any,
      locationBalance,
    );
  });

  it('credits a bin-less (binId: null) StockLocationBalance row for the FG item/warehouse', async () => {
    await service.receiveFromOqc('oqc-1', user);
    expect(locationBalance.adjustQty).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 'company-1', itemCode: '9W-LED', itemName: '9W Emergency LED Bulb',
      warehouseId: 'wh-fg', binId: null, status: 'AVAILABLE', deltaQty: 150, userId: 'user-1',
    }));
  });

  it('links the StockLocationBalance row to the StockBatch created for a batch-tracked receipt', async () => {
    prisma.oqcInspection.findFirst.mockResolvedValue({ ...oqc, fgReceipt: { ...fgReceipt, batchNumber: 'FG-B001' } });
    await service.receiveFromOqc('oqc-1', user);
    expect(prisma.stockBatch.create).toHaveBeenCalled();
    expect(locationBalance.adjustQty).toHaveBeenCalledWith(expect.objectContaining({ batchId: 'batch-1' }));
  });

  it('passes batchId: null when the receipt has no batch number', async () => {
    await service.receiveFromOqc('oqc-1', user);
    expect(prisma.stockBatch.create).not.toHaveBeenCalled();
    expect(locationBalance.adjustQty).toHaveBeenCalledWith(expect.objectContaining({ batchId: null }));
  });

  it('still credits StockLocationBalance even if StockBatch creation fails (e.g. duplicate batch number)', async () => {
    prisma.oqcInspection.findFirst.mockResolvedValue({ ...oqc, fgReceipt: { ...fgReceipt, batchNumber: 'FG-B001' } });
    prisma.stockBatch.create.mockRejectedValue(new Error('unique constraint'));
    await service.receiveFromOqc('oqc-1', user);
    expect(locationBalance.adjustQty).toHaveBeenCalledWith(expect.objectContaining({ batchId: null }));
  });

  it('does not credit StockLocationBalance at all when the OQC was already received (guard short-circuits first)', async () => {
    prisma.stockLedger.findFirst.mockResolvedValue({ id: 'ledger-existing' });
    await expect(service.receiveFromOqc('oqc-1', user)).rejects.toThrow(/already been received/);
    expect(locationBalance.adjustQty).not.toHaveBeenCalled();
  });
});
