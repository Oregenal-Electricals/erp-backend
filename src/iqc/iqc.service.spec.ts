import { IqcService } from './iqc.service';

describe('IqcService.create - STORE-005 heldQty exclusion', () => {
  let service: IqcService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;
  let rejectedStockSvc: any;
  let holdStockSvc: any;

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
    rejectedStockSvc = rejectedStockSvc || { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    holdStockSvc = holdStockSvc || { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    service = new IqcService(prisma, audit, stockLedger, rejectedStockSvc, holdStockSvc);
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
  let rejectedStockSvc: any;
  let holdStockSvc: any;

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
    rejectedStockSvc = rejectedStockSvc || { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    holdStockSvc = holdStockSvc || { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    service = new IqcService(prisma, audit, stockLedger, rejectedStockSvc, holdStockSvc);
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
  let rejectedStockSvc: any;
  let holdStockSvc: any;

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
    rejectedStockSvc = rejectedStockSvc || { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    holdStockSvc = holdStockSvc || { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    service = new IqcService(prisma, audit, stockLedger, rejectedStockSvc, holdStockSvc);
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

describe('IqcService.confirmReceipt - STORE-007 QC-confirms-receipt', () => {
  let service: IqcService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;
  let rejectedStockSvc: any;
  let holdStockSvc: any;

  const user = { id: 'qc-1', companyId: 'company-1' };
  const iqcItem = { id: 'iqc-item-1', itemCode: 'DRIVER-01', receivedQty: 1000, acceptedQty: 1000, rejectedQty: 0 };

  beforeEach(() => {
    prisma = {
      iqcInspection: {
        findFirst: jest.fn().mockResolvedValue({ id: 'iqc-1', companyId: 'company-1', status: 'AWAITING_QC_RECEIPT', items: [iqcItem] }),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'iqc-1', status: 'AWAITING_QC_RECEIPT', ...data })),
      },
      iqcItem: { update: jest.fn().mockResolvedValue({}) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = {};
    rejectedStockSvc = rejectedStockSvc || { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    holdStockSvc = holdStockSvc || { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    service = new IqcService(prisma, audit, stockLedger, rejectedStockSvc, holdStockSvc);
  });

  it('an exact-match confirmation moves status to IN_PROGRESS with no mismatch flagged', async () => {
    const r = await service.confirmReceipt('iqc-1', { items: [{ itemId: 'iqc-item-1', confirmedQty: 1000 }] }, user);
    expect(r.status).toBe('IN_PROGRESS');
    expect(r.handoverMismatches).toEqual([]);
  });

  it('a short confirmation caps acceptedQty at what was actually confirmed and flags a mismatch', async () => {
    const r = await service.confirmReceipt('iqc-1', { items: [{ itemId: 'iqc-item-1', confirmedQty: 980 }] }, user);
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'iqc-item-1' }, data: expect.objectContaining({ confirmedQty: 980, acceptedQty: 980 }),
    }));
    expect(r.handoverMismatches).toEqual([
      expect.objectContaining({ itemCode: 'DRIVER-01', sentQty: 1000, confirmedQty: 980, shortfall: 20 }),
    ]);
  });

  it('never silently treats a short confirmation as a full handover - status advances but mismatch is recorded', async () => {
    const r = await service.confirmReceipt('iqc-1', { items: [{ itemId: 'iqc-item-1', confirmedQty: 980 }] }, user);
    expect(r.status).toBe('IN_PROGRESS');
    expect(r.handoverMismatches.length).toBe(1);
  });

  it('blocks confirming more than what Store actually sent', async () => {
    await expect(
      service.confirmReceipt('iqc-1', { items: [{ itemId: 'iqc-item-1', confirmedQty: 1100 }] }, user),
    ).rejects.toThrow(/cannot exceed what Store sent/);
  });

  it('blocks confirmReceipt when the inspection is not awaiting QC receipt', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue({ id: 'iqc-1', companyId: 'company-1', status: 'IN_PROGRESS', items: [iqcItem] });
    await expect(
      service.confirmReceipt('iqc-1', { items: [{ itemId: 'iqc-item-1', confirmedQty: 1000 }] }, user),
    ).rejects.toThrow(/not awaiting QC receipt confirmation/);
  });

  it('throws NotFoundException for an item id not on this inspection', async () => {
    await expect(
      service.confirmReceipt('iqc-1', { items: [{ itemId: 'missing-item', confirmedQty: 100 }] }, user),
    ).rejects.toThrow(/not found on this inspection/);
  });

  it('logs the audit trail including any mismatches', async () => {
    await service.confirmReceipt('iqc-1', { items: [{ itemId: 'iqc-item-1', confirmedQty: 980 }] }, user);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      tableName: 'iqc_inspections',
      newValues: expect.objectContaining({ receiptConfirmed: true, mismatches: expect.arrayContaining([expect.objectContaining({ shortfall: 20 })]) }),
    }));
  });
});

describe('IqcService.approve - STORE-007 blocked until QC receipt is confirmed', () => {
  let service: IqcService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;
  let rejectedStockSvc: any;
  let holdStockSvc: any;

  const user = { id: 'qc-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      iqcInspection: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      grnItem: { update: jest.fn().mockResolvedValue({}) },
      grnHeader: { update: jest.fn().mockResolvedValue({}) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = { receiveFromIqc: jest.fn().mockResolvedValue(undefined) };
    rejectedStockSvc = rejectedStockSvc || { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    holdStockSvc = holdStockSvc || { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    service = new IqcService(prisma, audit, stockLedger, rejectedStockSvc, holdStockSvc);
  });

  it('blocks approve() while status is AWAITING_QC_RECEIPT', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue({ id: 'iqc-1', companyId: 'company-1', status: 'AWAITING_QC_RECEIPT', items: [] });
    await expect(service.approve('iqc-1', user)).rejects.toThrow(/QC must confirm physical receipt/);
  });

  it('allows approve() once status is IN_PROGRESS', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue({
      id: 'iqc-1', companyId: 'company-1', status: 'IN_PROGRESS', grnId: 'grn-1',
      items: [{ grnItemId: 'gi-1', acceptedQty: 980, rejectedQty: 0, receivedQty: 980 }],
    });
    await expect(service.approve('iqc-1', user)).resolves.toBeDefined();
  });
});

describe('IqcService.approve - STORE-008 three-way reconciliation and Rejected/Hold tracking', () => {
  let service: IqcService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;
  let rejectedStockSvc: any;
  let holdStockSvc: any;

  const user = { id: 'qc-1', companyId: 'company-1' };

  function makeIqc(items: any[]) {
    return { id: 'iqc-1', companyId: 'company-1', status: 'IN_PROGRESS', grnId: 'grn-1', items };
  }

  beforeEach(() => {
    prisma = {
      iqcInspection: { findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      grnItem: { update: jest.fn().mockResolvedValue({}) },
      grnHeader: { update: jest.fn().mockResolvedValue({}) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = { receiveFromIqc: jest.fn().mockResolvedValue(undefined) };
    rejectedStockSvc = { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    holdStockSvc = { createFromIqc: jest.fn().mockResolvedValue(undefined) };
    service = new IqcService(prisma, audit, stockLedger, rejectedStockSvc, holdStockSvc);
  });

  it('blocks approval when accepted + rejected + hold exceeds received', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue(makeIqc([
      { grnItemId: 'gi-1', itemCode: 'X', acceptedQty: 800, rejectedQty: 150, holdQty: 100, receivedQty: 1000 },
    ]));
    await expect(service.approve('iqc-1', user)).rejects.toThrow(/quantities don't balance/);
  });

  it('allows approval when accepted + rejected + hold reconciles exactly to received (three-way split)', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue(makeIqc([
      { grnItemId: 'gi-1', itemCode: 'X', acceptedQty: 800, rejectedQty: 150, holdQty: 50, receivedQty: 1000 },
    ]));
    await expect(service.approve('iqc-1', user)).resolves.toBeDefined();
  });

  it('calls RejectedStockService.createFromIqc when rejectedQty > 0', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue(makeIqc([
      { grnItemId: 'gi-1', itemCode: 'X', acceptedQty: 980, rejectedQty: 20, holdQty: 0, receivedQty: 1000 },
    ]));
    await service.approve('iqc-1', user);
    expect(rejectedStockSvc.createFromIqc).toHaveBeenCalledWith('iqc-1', user);
    expect(holdStockSvc.createFromIqc).not.toHaveBeenCalled();
  });

  it('calls HoldStockService.createFromIqc when holdQty > 0', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue(makeIqc([
      { grnItemId: 'gi-1', itemCode: 'X', acceptedQty: 900, rejectedQty: 0, holdQty: 100, receivedQty: 1000 },
    ]));
    await service.approve('iqc-1', user);
    expect(holdStockSvc.createFromIqc).toHaveBeenCalledWith('iqc-1', user);
    expect(rejectedStockSvc.createFromIqc).not.toHaveBeenCalled();
  });

  it('calls both RejectedStockService and HoldStockService for a full three-way Pass/Fail/Hold split', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue(makeIqc([
      { grnItemId: 'gi-1', itemCode: 'X', acceptedQty: 800, rejectedQty: 150, holdQty: 50, receivedQty: 1000 },
    ]));
    await service.approve('iqc-1', user);
    expect(rejectedStockSvc.createFromIqc).toHaveBeenCalledWith('iqc-1', user);
    expect(holdStockSvc.createFromIqc).toHaveBeenCalledWith('iqc-1', user);
  });

  it('calls neither tracking service on a full, clean pass with no rejection or hold', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue(makeIqc([
      { grnItemId: 'gi-1', itemCode: 'X', acceptedQty: 1000, rejectedQty: 0, holdQty: 0, receivedQty: 1000 },
    ]));
    await service.approve('iqc-1', user);
    expect(rejectedStockSvc.createFromIqc).not.toHaveBeenCalled();
    expect(holdStockSvc.createFromIqc).not.toHaveBeenCalled();
  });

  it('handles a GrnItem/IqcItem with holdQty undefined (rows predating this migration) as zero, not NaN', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue(makeIqc([
      { grnItemId: 'gi-1', itemCode: 'X', acceptedQty: 980, rejectedQty: 20, receivedQty: 1000 },
    ]));
    await expect(service.approve('iqc-1', user)).resolves.toBeDefined();
  });
});
