import { BadRequestException } from '@nestjs/common';
import { StockLocationBalanceService } from './stock-location-balance.service';

describe('StockLocationBalanceService - STORE-015 foundation', () => {
  let service: StockLocationBalanceService;
  let prisma: any;
  const base = { companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', warehouseId: 'wh-1', binId: 'bin-1', userId: 'user-1' };

  beforeEach(() => {
    let record: any = null;
    prisma = {
      stockLocationBalance: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(record ? { ...record } : null)),
        create: jest.fn().mockImplementation(({ data }: any) => { record = { id: 'slb-1', ...data }; return Promise.resolve(record); }),
        updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
          if (!record) return Promise.resolve({ count: 0 });
          if (where.qty !== undefined && where.qty !== record.qty) return Promise.resolve({ count: 0 });
          record = { ...record, ...data };
          return Promise.resolve({ count: 1 });
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new StockLocationBalanceService(prisma);
  });

  it('creates a new row on the first positive adjustment', async () => {
    const qty = await service.adjustQty({ ...base, deltaQty: 100 });
    expect(qty).toBe(100);
    expect(prisma.stockLocationBalance.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ itemCode: 'DRIVER-01', binId: 'bin-1', batchId: null, status: 'AVAILABLE', qty: 100 }),
    }));
  });

  it('increments an existing row rather than creating a duplicate', async () => {
    await service.adjustQty({ ...base, deltaQty: 100 });
    const qty = await service.adjustQty({ ...base, deltaQty: 50 });
    expect(qty).toBe(150);
    expect(prisma.stockLocationBalance.create).toHaveBeenCalledTimes(1);
  });

  it('decrements correctly', async () => {
    await service.adjustQty({ ...base, deltaQty: 100 });
    const qty = await service.adjustQty({ ...base, deltaQty: -30 });
    expect(qty).toBe(70);
  });

  it('blocks decrementing below zero rather than silently flooring', async () => {
    await service.adjustQty({ ...base, deltaQty: 20 });
    await expect(service.adjustQty({ ...base, deltaQty: -50 })).rejects.toThrow(BadRequestException);
  });

  it('blocks decrementing a bin/batch/status combination that has no row at all', async () => {
    await expect(service.adjustQty({ ...base, deltaQty: -10 })).rejects.toThrow(/No stock/);
  });

  it('keeps different batches in the same bin as separate rows', async () => {
    await service.adjustQty({ ...base, batchId: 'batch-A', deltaQty: 60 });
    // Second batch creates its own new row - the mock's shared `record`
    // only models one row, so just confirm create() was called twice
    // with different batchId values rather than reusing the first row.
    prisma.stockLocationBalance.findFirst.mockResolvedValueOnce(null);
    await service.adjustQty({ ...base, batchId: 'batch-B', deltaQty: 40 });
    const createCalls = prisma.stockLocationBalance.create.mock.calls;
    expect(createCalls[0][0].data.batchId).toBe('batch-A');
    expect(createCalls[1][0].data.batchId).toBe('batch-B');
  });

  it('retries on a concurrent qty conflict rather than failing outright', async () => {
    await service.adjustQty({ ...base, deltaQty: 100 });
    let callCount = 0;
    const original = prisma.stockLocationBalance.updateMany;
    prisma.stockLocationBalance.updateMany = jest.fn().mockImplementation((args: any) => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ count: 0 });
      return original(args);
    });
    const qty = await service.adjustQty({ ...base, deltaQty: 25 });
    expect(qty).toBe(125);
    expect(callCount).toBeGreaterThan(1);
  });
});
