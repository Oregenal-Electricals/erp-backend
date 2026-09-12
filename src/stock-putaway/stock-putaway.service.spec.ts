import { StockPutawayService } from './stock-putaway.service';

describe('StockPutawayService.getPendingIqcs - STORE-008 remaining-qty visibility', () => {
  let service: StockPutawayService;
  let prisma: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      iqcInspection: { findMany: jest.fn() },
      rawMaterial: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new StockPutawayService(prisma, {} as any, {} as any);
  });

  it('shows an IQC with zero put-away yet as fully remaining', async () => {
    prisma.iqcInspection.findMany.mockResolvedValue([
      { id: 'iqc-1', items: [{ id: 'ii-1', itemCode: 'X', acceptedQty: 980, putAwayQty: 0 }] },
    ]);
    const r = await service.getPendingIqcs(user);
    expect(r).toHaveLength(1);
    expect(r[0].items[0].remainingPutAwayQty).toBe(980);
  });

  it('still shows an IQC with a partial put-away already done, with the correct remainder', async () => {
    prisma.iqcInspection.findMany.mockResolvedValue([
      { id: 'iqc-1', items: [{ id: 'ii-1', itemCode: 'X', acceptedQty: 980, putAwayQty: 600 }] },
    ]);
    const r = await service.getPendingIqcs(user);
    expect(r).toHaveLength(1);
    expect(r[0].items[0].remainingPutAwayQty).toBe(380);
  });

  it('excludes an IQC once every line has been fully put away - not left visible forever', async () => {
    prisma.iqcInspection.findMany.mockResolvedValue([
      { id: 'iqc-1', items: [{ id: 'ii-1', itemCode: 'X', acceptedQty: 980, putAwayQty: 980 }] },
    ]);
    const r = await service.getPendingIqcs(user);
    expect(r).toHaveLength(0);
  });

  it('keeps a mixed-line IQC visible if any one line still has remaining qty', async () => {
    prisma.iqcInspection.findMany.mockResolvedValue([
      { id: 'iqc-1', items: [
        { id: 'ii-1', itemCode: 'X', acceptedQty: 500, putAwayQty: 500 },
        { id: 'ii-2', itemCode: 'Y', acceptedQty: 300, putAwayQty: 100 },
      ] },
    ]);
    const r = await service.getPendingIqcs(user);
    expect(r).toHaveLength(1);
  });
});

describe('StockPutawayService.complete - STORE-008 over-put-away and partial put-away', () => {
  let service: StockPutawayService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  let iqcItemState: any;

  function makePutaway(items: any[]) {
    return { id: 'put-1', companyId: 'company-1', status: 'IN_PROGRESS', items };
  }

  beforeEach(() => {
    iqcItemState = { id: 'ii-1', itemCode: 'DRIVER-01', acceptedQty: 800, putAwayQty: 0 };
    prisma = {
      stockPutaway: {
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'put-1', ...data })),
      },
      iqcItem: {
        findUnique: jest.fn().mockImplementation(() => Promise.resolve(iqcItemState)),
        updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
          const threshold = where.putAwayQty.lte;
          if (iqcItemState.putAwayQty > threshold) return Promise.resolve({ count: 0 });
          iqcItemState = { ...iqcItemState, putAwayQty: iqcItemState.putAwayQty + data.putAwayQty.increment };
          return Promise.resolve({ count: 1 });
        }),
      },
      warehouseBin: {
        findUnique: jest.fn().mockResolvedValue({ id: 'bin-1', code: 'R02-B04', currentQty: 0, maxQty: null }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new StockPutawayService(prisma, audit, {} as any);
  });

  it('a first partial put-away of 500 (of 800 accepted) claims exactly 500 and completes normally', async () => {
    prisma.stockPutaway.findFirst.mockResolvedValue(makePutaway([
      { binId: 'bin-1', iqcItemId: 'ii-1', itemCode: 'DRIVER-01', qty: 500 },
    ]));
    await service.complete('put-1', user);
    expect(iqcItemState.putAwayQty).toBe(500);
  });

  it('a second put-away of the remaining 300 completes and reaches the full 800 cumulative', async () => {
    prisma.stockPutaway.findFirst.mockResolvedValue(makePutaway([
      { binId: 'bin-1', iqcItemId: 'ii-1', itemCode: 'DRIVER-01', qty: 500 },
    ]));
    await service.complete('put-1', user);

    prisma.stockPutaway.findFirst.mockResolvedValue(makePutaway([
      { binId: 'bin-1', iqcItemId: 'ii-1', itemCode: 'DRIVER-01', qty: 300 },
    ]));
    await service.complete('put-2', user);

    expect(iqcItemState.putAwayQty).toBe(800);
  });

  it('blocks putting away more than the remaining accepted qty', async () => {
    iqcItemState = { ...iqcItemState, putAwayQty: 600 };
    prisma.stockPutaway.findFirst.mockResolvedValue(makePutaway([
      { binId: 'bin-1', iqcItemId: 'ii-1', itemCode: 'DRIVER-01', qty: 300 },
    ]));
    await expect(service.complete('put-1', user)).rejects.toThrow(/would exceed the remaining accepted qty/);
  });

  it('a duplicate/retry complete on an already-fully-put-away line is blocked, not double-counted', async () => {
    iqcItemState = { ...iqcItemState, putAwayQty: 800 };
    prisma.stockPutaway.findFirst.mockResolvedValue(makePutaway([
      { binId: 'bin-1', iqcItemId: 'ii-1', itemCode: 'DRIVER-01', qty: 800 },
    ]));
    await expect(service.complete('put-1', user)).rejects.toThrow(/would exceed the remaining accepted qty/);
    expect(iqcItemState.putAwayQty).toBe(800);
  });

  it('rejects the claim if the remaining qty changed concurrently between validation and claim', async () => {
    prisma.stockPutaway.findFirst.mockResolvedValue(makePutaway([
      { binId: 'bin-1', iqcItemId: 'ii-1', itemCode: 'DRIVER-01', qty: 500 },
    ]));
    prisma.iqcItem.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.complete('put-1', user)).rejects.toThrow(/could not claim/);
  });

  it('items without an iqcItemId (non-IQC put-away sources) skip the accepted-qty check entirely', async () => {
    prisma.stockPutaway.findFirst.mockResolvedValue(makePutaway([
      { binId: 'bin-1', itemCode: 'MISC-01', qty: 50 },
    ]));
    await expect(service.complete('put-1', user)).resolves.toBeDefined();
    expect(prisma.iqcItem.findUnique).not.toHaveBeenCalled();
  });

  it('still enforces bin capacity after the accepted-qty check passes', async () => {
    prisma.warehouseBin.findUnique.mockResolvedValue({ id: 'bin-1', code: 'R02-B04', currentQty: 700, maxQty: 800 });
    prisma.stockPutaway.findFirst.mockResolvedValue(makePutaway([
      { binId: 'bin-1', iqcItemId: 'ii-1', itemCode: 'DRIVER-01', qty: 500 },
    ]));
    await expect(service.complete('put-1', user)).rejects.toThrow(/can only hold/);
  });
});

describe('StockPutawayService.create - STORE-009 auto-links the correct StockBatch', () => {
  let service: StockPutawayService;
  let prisma: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      grnHeader: { findFirst: jest.fn().mockResolvedValue({ id: 'grn-1' }) },
      stockPutaway: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'put-1', ...data })),
      },
      iqcItem: { findUnique: jest.fn() },
      rawMaterial: { findMany: jest.fn().mockResolvedValue([]) },
      stockBatch: { findFirst: jest.fn() },
    };
    service = new StockPutawayService(prisma, { log: jest.fn().mockResolvedValue(undefined) } as any, {} as any);
  });

  it('links stockBatchId when the IqcItem has a batchNumber that matches an existing StockBatch', async () => {
    prisma.iqcItem.findUnique.mockResolvedValue({ id: 'ii-1', batchNumber: 'DRV-B001' });
    prisma.stockBatch.findFirst.mockResolvedValue({ id: 'batch-1' });
    await service.create({ grnId: 'grn-1', warehouseId: 'wh-1', items: [{ binId: 'bin-1', iqcItemId: 'ii-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', qty: 500, unitCost: 0 }] } as any, user);
    const call = prisma.stockPutaway.create.mock.calls[0][0];
    expect(call.data.items.create[0].stockBatchId).toBe('batch-1');
  });

  it('leaves stockBatchId undefined when the IqcItem has no batchNumber', async () => {
    prisma.iqcItem.findUnique.mockResolvedValue({ id: 'ii-1', batchNumber: null });
    await service.create({ grnId: 'grn-1', warehouseId: 'wh-1', items: [{ binId: 'bin-1', iqcItemId: 'ii-1', itemCode: 'SCREW-01', itemName: 'Screw', uom: 'PCS', qty: 100, unitCost: 0 }] } as any, user);
    expect(prisma.stockBatch.findFirst).not.toHaveBeenCalled();
    const call = prisma.stockPutaway.create.mock.calls[0][0];
    expect(call.data.items.create[0].stockBatchId).toBeUndefined();
  });

  it('leaves stockBatchId undefined for items with no iqcItemId (non-IQC put-away sources)', async () => {
    await service.create({ grnId: 'grn-1', warehouseId: 'wh-1', items: [{ binId: 'bin-1', itemCode: 'MISC-01', itemName: 'Misc', uom: 'PCS', qty: 10, unitCost: 0 }] } as any, user);
    expect(prisma.iqcItem.findUnique).not.toHaveBeenCalled();
  });
});

describe('StockPutawayService.create - STORE-009 material-location restriction', () => {
  let service: StockPutawayService;
  let prisma: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      grnHeader: { findFirst: jest.fn().mockResolvedValue({ id: 'grn-1' }) },
      stockPutaway: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'put-1', ...data })),
      },
      iqcItem: { findUnique: jest.fn().mockResolvedValue(null) },
      stockBatch: { findFirst: jest.fn() },
      rawMaterial: { findMany: jest.fn() },
    };
    service = new StockPutawayService(prisma, { log: jest.fn().mockResolvedValue(undefined) } as any, {} as any);
  });

  it('blocks put-away to a different warehouse than the material is restricted to, without an override reason', async () => {
    prisma.rawMaterial.findMany.mockResolvedValue([{ code: 'HAZ-01', restrictedWarehouseId: 'wh-secure', restrictedWarehouse: { name: 'Secure Store' } }]);
    await expect(
      service.create({ grnId: 'grn-1', warehouseId: 'wh-1', items: [{ binId: 'bin-1', itemCode: 'HAZ-01', itemName: 'Hazmat', uom: 'PCS', qty: 10, unitCost: 0 }] } as any, user),
    ).rejects.toThrow(/is restricted to Secure Store/);
  });

  it('allows put-away to a different warehouse when an override reason is provided', async () => {
    prisma.rawMaterial.findMany.mockResolvedValue([{ code: 'HAZ-01', restrictedWarehouseId: 'wh-secure', restrictedWarehouse: { name: 'Secure Store' } }]);
    await expect(
      service.create({ grnId: 'grn-1', warehouseId: 'wh-1', overrideReason: 'Secure store full, plant head approved', items: [{ binId: 'bin-1', itemCode: 'HAZ-01', itemName: 'Hazmat', uom: 'PCS', qty: 10, unitCost: 0 }] } as any, user),
    ).resolves.toBeDefined();
  });

  it('allows put-away to the material\'s own restricted warehouse with no override needed', async () => {
    prisma.rawMaterial.findMany.mockResolvedValue([{ code: 'HAZ-01', restrictedWarehouseId: 'wh-secure', restrictedWarehouse: { name: 'Secure Store' } }]);
    await expect(
      service.create({ grnId: 'grn-1', warehouseId: 'wh-secure', items: [{ binId: 'bin-1', itemCode: 'HAZ-01', itemName: 'Hazmat', uom: 'PCS', qty: 10, unitCost: 0 }] } as any, user),
    ).resolves.toBeDefined();
  });

  it('does not restrict materials with no restrictedWarehouseId configured', async () => {
    prisma.rawMaterial.findMany.mockResolvedValue([]);
    await expect(
      service.create({ grnId: 'grn-1', warehouseId: 'wh-1', items: [{ binId: 'bin-1', itemCode: 'SCREW-01', itemName: 'Screw', uom: 'PCS', qty: 10, unitCost: 0 }] } as any, user),
    ).resolves.toBeDefined();
  });
});

describe('StockPutawayService.findByItem - STORE-009 Material View', () => {
  let service: StockPutawayService;
  let prisma: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = { stockPutawayItem: { findMany: jest.fn() } };
    service = new StockPutawayService(prisma, {} as any, {} as any);
  });

  it('sums qty across all bin locations for the item', async () => {
    prisma.stockPutawayItem.findMany.mockResolvedValue([
      { itemCode: 'DRIVER-01', qty: 600, bin: { code: 'B01' }, stockBatch: { batchNumber: 'B1' } },
      { itemCode: 'DRIVER-01', qty: 400, bin: { code: 'B02' }, stockBatch: { batchNumber: 'B1' } },
    ]);
    const r = await service.findByItem('DRIVER-01', user);
    expect(r.totalQty).toBe(1000);
    expect(r.locations).toHaveLength(2);
  });

  it('only counts completed put-away batches', async () => {
    prisma.stockPutawayItem.findMany.mockResolvedValue([]);
    await service.findByItem('DRIVER-01', user);
    const call = prisma.stockPutawayItem.findMany.mock.calls[0][0];
    expect(call.where.putaway.status).toBe('COMPLETED');
  });
});
