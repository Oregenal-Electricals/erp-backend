import { StockLedgerService } from './stock-ledger.service';

describe('StockLedgerService.postTransaction - STORE-010 concurrency-safe balance updates', () => {
  let service: StockLedgerService;
  let prisma: any;
  let audit: any;

  const user = { id: 'user-1', companyId: 'company-1' };
  let balanceState: any;

  beforeEach(() => {
    balanceState = { id: 'bal-1', companyId: 'company-1', itemCode: 'DRIVER-01', warehouseId: 'wh-1', availableQty: 500, unitCost: 10 };
    prisma = {
      stockBalance: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve({ ...balanceState })),
        create: jest.fn(),
        updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
          if (where.availableQty !== balanceState.availableQty) return Promise.resolve({ count: 0 });
          balanceState = { ...balanceState, availableQty: data.availableQty, unitCost: data.unitCost };
          return Promise.resolve({ count: 1 });
        }),
      },
      stockLedger: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'ledger-1', ...data })),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new StockLedgerService(prisma, audit, { recheckAllOpenPos: jest.fn().mockResolvedValue(undefined) } as any);
  });

  it('credits stock normally and posts a matching ledger entry', async () => {
    const r = await service.postTransaction({
      companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1',
      transactionType: 'RECEIPT', inQty: 200, unitCost: 10, userId: 'user-1',
    });
    expect(balanceState.availableQty).toBe(700);
    expect(r.balanceQty).toBe(700);
  });

  it('blocks a debit that would take availableQty negative', async () => {
    await expect(service.postTransaction({
      companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1',
      transactionType: 'ISSUE', outQty: 600, userId: 'user-1',
    })).rejects.toThrow(/Insufficient stock/);
    expect(balanceState.availableQty).toBe(500);
  });

  it('retries with a fresh read when the balance changed concurrently between read and write', async () => {
    let callCount = 0;
    const originalUpdateMany = prisma.stockBalance.updateMany;
    prisma.stockBalance.updateMany = jest.fn().mockImplementation((args: any) => {
      callCount++;
      if (callCount === 1) {
        // Simulate a concurrent transaction that changed the balance
        // between this call's read and its write.
        balanceState = { ...balanceState, availableQty: balanceState.availableQty - 50 };
        return Promise.resolve({ count: 0 });
      }
      return originalUpdateMany(args);
    });

    const r = await service.postTransaction({
      companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1',
      transactionType: 'ISSUE', outQty: 100, userId: 'user-1',
    });
    // Started at 500, a concurrent -50 landed first (450), then our -100 applied on retry
    expect(balanceState.availableQty).toBe(350);
    expect(r.outQty).toBe(100);
  });

  it('gives up after too many concurrent conflicts rather than retrying forever', async () => {
    prisma.stockBalance.updateMany = jest.fn().mockResolvedValue({ count: 0 });
    await expect(service.postTransaction({
      companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1',
      transactionType: 'RECEIPT', inQty: 10, userId: 'user-1',
    })).rejects.toThrow(/too many concurrent updates/);
  });

  it('computes weighted average cost correctly for a new receipt', async () => {
    await service.postTransaction({
      companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1',
      transactionType: 'RECEIPT', inQty: 500, unitCost: 20, userId: 'user-1',
    });
    // (500*10 + 500*20) / 1000 = 15
    expect(balanceState.unitCost).toBe(15);
  });

  it('creates the stockBalance row on first use for a brand-new item/warehouse combination', async () => {
    prisma.stockBalance.findFirst = jest.fn().mockResolvedValueOnce(null).mockResolvedValue({ id: 'bal-2', availableQty: 0, unitCost: 0 });
    prisma.stockBalance.create = jest.fn().mockResolvedValue({ id: 'bal-2', availableQty: 0, unitCost: 0 });
    prisma.stockBalance.updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const r = await service.postTransaction({
      companyId: 'company-1', itemCode: 'NEW-ITEM', itemName: 'New Item', warehouseId: 'wh-1',
      transactionType: 'RECEIPT', inQty: 50, unitCost: 5, userId: 'user-1',
    });
    expect(prisma.stockBalance.create).toHaveBeenCalled();
    expect(r.balanceQty).toBe(50);
  });
});

describe('StockLedgerService.postTransaction - STORE-010 targetField (Available vs Put-Away Pending)', () => {
  let service: StockLedgerService;
  let prisma: any;
  let balanceState: any;

  beforeEach(() => {
    balanceState = { id: 'bal-1', companyId: 'company-1', itemCode: 'DRIVER-01', warehouseId: 'wh-1', availableQty: 100, putAwayPendingQty: 0, unitCost: 10 };
    prisma = {
      stockBalance: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve({ ...balanceState })),
        create: jest.fn(),
        updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
          const field = 'availableQty' in where ? 'availableQty' : 'putAwayPendingQty';
          if (where[field] !== balanceState[field]) return Promise.resolve({ count: 0 });
          balanceState = { ...balanceState, ...data };
          return Promise.resolve({ count: 1 });
        }),
      },
      stockLedger: { create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'ledger-1', ...data })) },
    };
    service = new StockLedgerService(prisma, { log: jest.fn().mockResolvedValue(undefined) } as any, { recheckAllOpenPos: jest.fn().mockResolvedValue(undefined) } as any);
  });

  it('defaults to crediting availableQty when targetField is omitted (backward-compatible)', async () => {
    await service.postTransaction({
      companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1',
      transactionType: 'RECEIPT', inQty: 50, userId: 'user-1',
    });
    expect(balanceState.availableQty).toBe(150);
    expect(balanceState.putAwayPendingQty).toBe(0);
  });

  it('credits putAwayPendingQty, not availableQty, when targetField is putAwayPending', async () => {
    await service.postTransaction({
      companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1',
      transactionType: 'IQC_ACCEPT', inQty: 50, userId: 'user-1', targetField: 'putAwayPending',
    });
    expect(balanceState.availableQty).toBe(100);
    expect(balanceState.putAwayPendingQty).toBe(50);
  });

  it('validates negative-stock against putAwayPendingQty specifically when debiting that bucket', async () => {
    await expect(service.postTransaction({
      companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1',
      transactionType: 'PUTAWAY', outQty: 10, userId: 'user-1', targetField: 'putAwayPending',
    })).rejects.toThrow(/Insufficient stock/);
  });

  it('moving qty from putAwayPending to available via two calls nets to the same physical total', async () => {
    balanceState = { ...balanceState, putAwayPendingQty: 200 };
    await service.postTransaction({
      companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1',
      transactionType: 'PUTAWAY', outQty: 200, userId: 'user-1', targetField: 'putAwayPending',
    });
    await service.postTransaction({
      companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1',
      transactionType: 'PUTAWAY', inQty: 200, userId: 'user-1', targetField: 'available',
    });
    expect(balanceState.putAwayPendingQty).toBe(0);
    expect(balanceState.availableQty).toBe(300);
  });
});
