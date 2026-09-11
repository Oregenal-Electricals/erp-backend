import { IqcService } from './iqc.service';

describe('IqcService.create - STORE-005 heldQty exclusion', () => {
  let service: IqcService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      grnHeader: { findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      iqcInspection: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'iqc-1', ...data })),
      },
      rawMaterial: { findMany: jest.fn().mockResolvedValue([]) },
      product: { findMany: jest.fn().mockResolvedValue([]) },
      grnItem: { update: jest.fn().mockResolvedValue({}), updateMany: jest.fn().mockResolvedValue({ count: 1 }), findMany: jest.fn().mockResolvedValue([]) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = { postTransaction: jest.fn().mockResolvedValue(undefined) };
    service = new IqcService(prisma, audit, stockLedger);
  });

  it('subtracts heldQty from receivedQty when building the IqcItem - held material never reaches IQC at all', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'IQC_PENDING',
      items: [{ id: 'gi-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', receivedQty: 1000, heldQty: 20 }],
    });
    await service.create({ grnId: 'grn-1' } as any, user);
    const createCall = prisma.iqcInspection.create.mock.calls[0][0];
    const iqcItem = createCall.data.items.create[0];
    expect(iqcItem.receivedQty).toBe(980);
    expect(iqcItem.acceptedQty).toBe(980);
  });

  it('a line with no discrepancy (heldQty 0) is completely unaffected - full receivedQty flows through as before', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'IQC_PENDING',
      items: [{ id: 'gi-1', itemCode: 'PCB-01', itemName: 'PCB', uom: 'PCS', receivedQty: 500, heldQty: 0 }],
    });
    await service.create({ grnId: 'grn-1' } as any, user);
    const createCall = prisma.iqcInspection.create.mock.calls[0][0];
    const iqcItem = createCall.data.items.create[0];
    expect(iqcItem.receivedQty).toBe(500);
    expect(iqcItem.acceptedQty).toBe(500);
  });

  it('handles a GrnItem with heldQty undefined (older rows before this migration) as zero, not NaN', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'IQC_PENDING',
      items: [{ id: 'gi-1', itemCode: 'PCB-01', itemName: 'PCB', uom: 'PCS', receivedQty: 500 }],
    });
    await service.create({ grnId: 'grn-1' } as any, user);
    const createCall = prisma.iqcInspection.create.mock.calls[0][0];
    expect(createCall.data.items.create[0].receivedQty).toBe(500);
  });

  it('mixed GRN: one line fully clean, another partially held - each line computed independently', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'IQC_PENDING',
      items: [
        { id: 'gi-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', receivedQty: 1000, heldQty: 20 },
        { id: 'gi-2', itemCode: 'PCB-01', itemName: 'PCB', uom: 'PCS', receivedQty: 500, heldQty: 0 },
      ],
    });
    await service.create({ grnId: 'grn-1' } as any, user);
    const items = prisma.iqcInspection.create.mock.calls[0][0].data.items.create;
    expect(items[0].receivedQty).toBe(980);
    expect(items[1].receivedQty).toBe(500);
  });
});

describe('IqcService.create - STORE-007 IQC-required per-line skip', () => {
  let service: IqcService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;

  const user = { id: 'user-1', companyId: 'company-1' };
  const grn = { id: 'grn-1', warehouseId: 'wh-1', grnNumber: 'GRN-2026-0001', status: 'IQC_PENDING' };

  beforeEach(() => {
    prisma = {
      grnHeader: { findFirst: jest.fn(), update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...grn, ...data })) },
      iqcInspection: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'iqc-1', ...data })),
      },
      rawMaterial: { findMany: jest.fn().mockResolvedValue([]) },
      product: { findMany: jest.fn().mockResolvedValue([]) },
      grnItem: { update: jest.fn().mockResolvedValue({}), updateMany: jest.fn().mockResolvedValue({ count: 1 }), findMany: jest.fn().mockResolvedValue([]) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = { postTransaction: jest.fn().mockResolvedValue(undefined) };
    service = new IqcService(prisma, audit, stockLedger);
  });

  it('a line whose material is configured IQC-not-required never becomes an IqcItem - directly accepted instead', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      ...grn, items: [{ id: 'gi-1', itemCode: 'SCREW-01', itemName: 'Screw', uom: 'PCS', receivedQty: 500, heldQty: 0 }],
    });
    prisma.rawMaterial.findMany.mockResolvedValue([{ code: 'SCREW-01', iqcRequired: false }]);

    const r = await service.create({ grnId: 'grn-1' } as any, user);
    expect((r as any).skippedIqc).toBe(true);
    expect(prisma.iqcInspection.create).not.toHaveBeenCalled();
    expect(prisma.grnItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'gi-1' }, data: expect.objectContaining({ acceptedQty: { increment: 500 } }),
    }));
    expect(stockLedger.postTransaction).toHaveBeenCalledWith(expect.objectContaining({
      transactionType: 'GRN_DIRECT_ACCEPT', itemCode: 'SCREW-01', inQty: 500,
    }));
  });

  it('when every line is IQC-not-required, closes the GRN directly with no IqcInspection at all', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      ...grn, items: [{ id: 'gi-1', itemCode: 'SCREW-01', itemName: 'Screw', uom: 'PCS', receivedQty: 500, heldQty: 0 }],
    });
    prisma.rawMaterial.findMany.mockResolvedValue([{ code: 'SCREW-01', iqcRequired: false }]);

    const r = await service.create({ grnId: 'grn-1' } as any, user);
    expect((r as any).skippedIqc).toBe(true);
    expect(prisma.grnHeader.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'grn-1' }, data: expect.objectContaining({ status: 'ACCEPTED' }),
    }));
  });

  it('mixed GRN: the IQC-required line becomes an IqcItem, the not-required line is directly accepted - both in one create() call', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      ...grn, items: [
        { id: 'gi-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', receivedQty: 1000, heldQty: 0 },
        { id: 'gi-2', itemCode: 'SCREW-01', itemName: 'Screw', uom: 'PCS', receivedQty: 500, heldQty: 0 },
      ],
    });
    prisma.rawMaterial.findMany.mockResolvedValue([
      { code: 'DRIVER-01', iqcRequired: true },
      { code: 'SCREW-01', iqcRequired: false },
    ]);

    const r = await service.create({ grnId: 'grn-1' } as any, user);
    expect((r as any).skippedIqc).toBeUndefined();
    const createCall = prisma.iqcInspection.create.mock.calls[0][0];
    expect(createCall.data.items.create).toHaveLength(1);
    expect(createCall.data.items.create[0].itemCode).toBe('DRIVER-01');
    expect(stockLedger.postTransaction).toHaveBeenCalledWith(expect.objectContaining({ itemCode: 'SCREW-01' }));
  });

  it('a material with no matching master record defaults to IQC-required (safe default, not a silent skip)', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      ...grn, items: [{ id: 'gi-1', itemCode: 'UNKNOWN-ITEM', itemName: 'Unknown', uom: 'PCS', receivedQty: 100, heldQty: 0 }],
    });
    // rawMaterial and product both return [] - no match found for this code

    const r = await service.create({ grnId: 'grn-1' } as any, user);
    expect((r as any).skippedIqc).toBeUndefined();
    expect(prisma.iqcInspection.create).toHaveBeenCalled();
    expect(stockLedger.postTransaction).not.toHaveBeenCalled();
  });

  it('falls back to the Product master when no RawMaterial match exists for the code', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      ...grn, items: [{ id: 'gi-1', itemCode: 'FG-01', itemName: 'Finished Good Return', uom: 'PCS', receivedQty: 200, heldQty: 0 }],
    });
    prisma.rawMaterial.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([{ code: 'FG-01', iqcRequired: false }]);

    const r = await service.create({ grnId: 'grn-1' } as any, user);
    expect((r as any).skippedIqc).toBe(true);
  });

  it('a directly-accepted line still respects heldQty exclusion (STORE-005 discrepancy holds still apply)', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      ...grn, items: [{ id: 'gi-1', itemCode: 'SCREW-01', itemName: 'Screw', uom: 'PCS', receivedQty: 500, heldQty: 20 }],
    });
    prisma.rawMaterial.findMany.mockResolvedValue([{ code: 'SCREW-01', iqcRequired: false }]);

    await service.create({ grnId: 'grn-1' } as any, user);
    expect(stockLedger.postTransaction).toHaveBeenCalledWith(expect.objectContaining({ inQty: 480 }));
  });
});

describe('IqcService.create - STORE-007 partial/cumulative handover', () => {
  let service: IqcService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;

  const user = { id: 'user-1', companyId: 'company-1' };
  const grn = { id: 'grn-1', warehouseId: 'wh-1', grnNumber: 'GRN-2026-0001', status: 'IQC_PENDING' };
  let lastGrnItemState: any;

  beforeEach(() => {
    lastGrnItemState = { id: 'gi-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', receivedQty: 1000, heldQty: 0, sentToIqcQty: 0 };
    prisma = {
      grnHeader: { findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      iqcInspection: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'iqc-x', ...data })),
      },
      rawMaterial: { findMany: jest.fn().mockResolvedValue([{ code: 'DRIVER-01', iqcRequired: true }]) },
      product: { findMany: jest.fn().mockResolvedValue([]) },
      grnItem: {
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
          const eligibleMinusQty = where.sentToIqcQty.lte;
          if (lastGrnItemState.sentToIqcQty > eligibleMinusQty) return Promise.resolve({ count: 0 });
          lastGrnItemState = { ...lastGrnItemState, sentToIqcQty: lastGrnItemState.sentToIqcQty + data.sentToIqcQty.increment };
          return Promise.resolve({ count: 1 });
        }),
        findMany: jest.fn().mockImplementation(() => Promise.resolve([lastGrnItemState])),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = { postTransaction: jest.fn().mockResolvedValue(undefined) };
    service = new IqcService(prisma, audit, stockLedger);
  });

  it('a partial send only covers the requested qty - IqcItem gets that qty, not the full line', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({ ...grn, items: [lastGrnItemState] });
    const r: any = await service.create({ grnId: 'grn-1', items: [{ grnItemId: 'gi-1', qty: 600 }] } as any, user);
    expect(r.items.create[0].receivedQty).toBe(600);
    expect(lastGrnItemState.sentToIqcQty).toBe(600);
  });

  it('a second handover call sends the remainder, and two IqcInspection records now coexist for the same GRN (no longer blocked)', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({ ...grn, items: [lastGrnItemState] });
    await service.create({ grnId: 'grn-1', items: [{ grnItemId: 'gi-1', qty: 600 }] } as any, user);

    prisma.grnHeader.findFirst.mockResolvedValue({ ...grn, items: [lastGrnItemState] });
    const r2: any = await service.create({ grnId: 'grn-1', items: [{ grnItemId: 'gi-1', qty: 400 }] } as any, user);
    expect(r2.items.create[0].receivedQty).toBe(400);
    expect(lastGrnItemState.sentToIqcQty).toBe(1000);
    expect(prisma.iqcInspection.create).toHaveBeenCalledTimes(2);
  });

  it('omitting items defaults to sending the full remaining eligible qty (backward-compatible one-shot behavior)', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({ ...grn, items: [lastGrnItemState] });
    const r: any = await service.create({ grnId: 'grn-1' } as any, user);
    expect(r.items.create[0].receivedQty).toBe(1000);
  });

  it('blocks a request exceeding the remaining eligible qty on a line', async () => {
    lastGrnItemState = { ...lastGrnItemState, sentToIqcQty: 600 };
    prisma.grnHeader.findFirst.mockResolvedValue({ ...grn, items: [lastGrnItemState] });
    await expect(
      service.create({ grnId: 'grn-1', items: [{ grnItemId: 'gi-1', qty: 500 }] } as any, user),
    ).rejects.toThrow(/exceeds remaining eligible qty/);
  });

  it('blocks when the entire request has nothing eligible to send (already fully sent)', async () => {
    lastGrnItemState = { ...lastGrnItemState, sentToIqcQty: 1000 };
    prisma.grnHeader.findFirst.mockResolvedValue({ ...grn, items: [lastGrnItemState] });
    await expect(service.create({ grnId: 'grn-1' } as any, user)).rejects.toThrow(/Nothing eligible to send/);
  });

  it('rejects the claim if the remaining qty changed concurrently (updateMany count 0)', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({ ...grn, items: [lastGrnItemState] });
    prisma.grnItem.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      service.create({ grnId: 'grn-1', items: [{ grnItemId: 'gi-1', qty: 600 }] } as any, user),
    ).rejects.toThrow(/could not claim/);
  });

  it('cumulative validation applies whether sent in one call or several - cannot exceed eligible qty in total', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({ ...grn, items: [lastGrnItemState] });
    await service.create({ grnId: 'grn-1', items: [{ grnItemId: 'gi-1', qty: 700 }] } as any, user);
    expect(lastGrnItemState.sentToIqcQty).toBe(700);

    prisma.grnHeader.findFirst.mockResolvedValue({ ...grn, items: [lastGrnItemState] });
    await expect(
      service.create({ grnId: 'grn-1', items: [{ grnItemId: 'gi-1', qty: 400 }] } as any, user),
    ).rejects.toThrow(/exceeds remaining eligible qty/);
  });
});
