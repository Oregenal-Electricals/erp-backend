import { BadRequestException } from '@nestjs/common';
import { GrnService } from './grn.service';

describe('GrnService.update - Physical Verification (STORE-004 backend fix)', () => {
  let service: GrnService;
  let prisma: any;
  let audit: any;
  let shortageService: any;

  const user = { id: 'user-1', companyId: 'company-1', role: 'STORE_MANAGER' };

  const draftGrn = {
    id: 'grn-1', companyId: 'company-1', status: 'DRAFT',
    items: [
      { id: 'item-1', itemCode: 'DRIVER-01', orderedQty: 1000, previouslyReceived: 0, receivedQty: 1000 },
      { id: 'item-2', itemCode: 'PCB-01', orderedQty: 500, previouslyReceived: 0, receivedQty: 500 },
    ],
  };

  beforeEach(() => {
    prisma = {
      grnHeader: {
        findFirst: jest.fn().mockResolvedValue(draftGrn),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...draftGrn, ...data })),
      },
      grnItem: {
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([{ id: 'item-1', itemCode: 'DRIVER-01', orderedQty: 1000, receivedQty: 980 }]),
      },
      $transaction: jest.fn().mockImplementation((ops: any) => Promise.all(ops)),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    shortageService = { upsertFromGrnLine: jest.fn().mockResolvedValue(null) };
    service = new GrnService(prisma, audit, shortageService);
  });

  it('corrects an item receivedQty via the new items array, separate from header fields', async () => {
    await service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 980 }] } as any, user);
    expect(prisma.grnItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { receivedQty: 980, updatedBy: user.id },
    });
  });

  it('never touches an item not included in the verification payload', async () => {
    await service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 980 }] } as any, user);
    expect(prisma.grnItem.update).toHaveBeenCalledTimes(1);
    expect(prisma.grnItem.update).not.toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'item-2' } }));
  });

  it('applies item corrections through a single transaction, not one-by-one outside a transaction', async () => {
    await service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 980 }, { id: 'item-2', receivedQty: 490 }] } as any, user);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('STORE-004: allows a verified qty above 105% of ordered through (no longer a hard block) and runs discrepancy detection on it', async () => {
    prisma.grnItem.findMany.mockResolvedValue([{ id: 'item-1', itemCode: 'DRIVER-01', orderedQty: 1000, receivedQty: 1100 }]);
    await service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 1100 }] } as any, user);
    expect(prisma.grnItem.update).toHaveBeenCalled();
    expect(shortageService.upsertFromGrnLine).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-1', receivedQty: 1100 }), draftGrn, user,
    );
  });

  it('runs discrepancy detection (short or excess) on every corrected item after the transaction commits', async () => {
    prisma.grnItem.findMany.mockResolvedValue([
      { id: 'item-1', itemCode: 'DRIVER-01', orderedQty: 1000, receivedQty: 980 },
      { id: 'item-2', itemCode: 'PCB-01', orderedQty: 500, receivedQty: 500 },
    ]);
    await service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 980 }, { id: 'item-2', receivedQty: 500 }] } as any, user);
    expect(shortageService.upsertFromGrnLine).toHaveBeenCalledTimes(2);
  });

  it('does not run discrepancy detection when no items were corrected in this update', async () => {
    await service.update('grn-1', { remarks: 'vehicle number corrected' } as any, user);
    expect(shortageService.upsertFromGrnLine).not.toHaveBeenCalled();
  });

  it('still blocks any edit (header or items) once the GRN has left DRAFT', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({ ...draftGrn, status: 'IQC_PENDING' });
    await expect(
      service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 900 }] } as any, user),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.grnItem.update).not.toHaveBeenCalled();
  });

  it('does not pass the items array through to the header update call', async () => {
    await service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 980 }], remarks: 'verified' } as any, user);
    const headerUpdateCall = prisma.grnHeader.update.mock.calls[0][0];
    expect(headerUpdateCall.data.items).toBeUndefined();
    expect(headerUpdateCall.data.remarks).toBe('verified');
  });

  it('still allows a header-only update (no items) exactly as before', async () => {
    await service.update('grn-1', { remarks: 'vehicle number corrected' } as any, user);
    expect(prisma.grnItem.update).not.toHaveBeenCalled();
    expect(prisma.grnHeader.update).toHaveBeenCalled();
  });

  it('logs the audit trail for the header update including the verification', async () => {
    await service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 980 }] } as any, user);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'grn_headers', action: 'UPDATE' }));
  });
});

describe('GrnService.create - STORE-004 discrepancy detection', () => {
  let service: GrnService;
  let prisma: any;
  let audit: any;
  let shortageService: any;

  const user = { id: 'user-1', companyId: 'company-1', role: 'STORE_MANAGER' };
  const warehouse = { id: 'wh-1', companyId: 'company-1' };
  const dto = {
    grnType: 'DOMESTIC', poId: 'po-1', warehouseId: 'wh-1',
    items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', orderedQty: 1000, previouslyReceived: 0, receivedQty: 1100, unitPrice: 0 }],
  };

  beforeEach(() => {
    const createdGrn = { id: 'grn-1', items: [{ id: 'item-1', itemCode: 'DRIVER-01', orderedQty: 1000, receivedQty: 1100 }] };
    prisma = {
      warehouse: { findFirst: jest.fn().mockResolvedValue(warehouse) },
      grnHeader: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(createdGrn),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    shortageService = { upsertFromGrnLine: jest.fn().mockResolvedValue(null) };
    service = new GrnService(prisma, audit, shortageService);
  });

  it('STORE-004: allows a receivedQty above 105% of ordered through on create (no longer a hard block)', async () => {
    const r = await service.create(dto as any, user);
    expect(r.id).toBe('grn-1');
  });

  it('runs discrepancy detection on every line after the GRN is created', async () => {
    await service.create(dto as any, user);
    expect(shortageService.upsertFromGrnLine).toHaveBeenCalledWith(
      expect.objectContaining({ itemCode: 'DRIVER-01', receivedQty: 1100 }),
      expect.objectContaining({ id: 'grn-1' }),
      user,
    );
  });
});

describe('GrnService.update - STORE-006 physicallyVerifiedAt stamping', () => {
  let service: GrnService;
  let prisma: any;
  let audit: any;
  let shortageService: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  const grnBase = {
    id: 'grn-1', companyId: 'company-1', status: 'DRAFT', physicallyVerifiedAt: null,
    items: [{ id: 'item-1', itemCode: 'DRIVER-01', orderedQty: 1000, previouslyReceived: 0, receivedQty: 1000, heldQty: 0 }],
  };

  beforeEach(() => {
    prisma = {
      grnHeader: {
        findFirst: jest.fn().mockResolvedValue(grnBase),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...grnBase, ...data })),
      },
      grnItem: {
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([{ id: 'item-1', itemCode: 'DRIVER-01', orderedQty: 1000, receivedQty: 980 }]),
      },
      iqcInspection: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn().mockImplementation((ops: any) => Promise.all(ops)),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    shortageService = { upsertFromGrnLine: jest.fn().mockResolvedValue(null) };
    service = new GrnService(prisma, audit, shortageService);
  });

  it('stamps physicallyVerifiedAt the first time an items correction is applied', async () => {
    const r = await service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 980 }] } as any, user);
    expect(r.physicallyVerifiedAt).toBeInstanceOf(Date);
  });

  it('does not restamp physicallyVerifiedAt on a later correction', async () => {
    const already = new Date('2026-01-01T00:00:00Z');
    const verifiedGrn = { ...grnBase, physicallyVerifiedAt: already };
    prisma.grnHeader.findFirst.mockResolvedValue(verifiedGrn);
    prisma.grnHeader.update.mockImplementation(({ data }: any) => Promise.resolve({ ...verifiedGrn, ...data }));
    const r = await service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 970 }] } as any, user);
    expect(r.physicallyVerifiedAt).toEqual(already);
  });

  it('does not stamp physicallyVerifiedAt on a header-only update (no items)', async () => {
    const r = await service.update('grn-1', { remarks: 'vehicle corrected' } as any, user);
    expect(r.physicallyVerifiedAt).toBeNull();
  });
});

describe('GrnService.submit - STORE-006 verification gate', () => {
  let service: GrnService;
  let prisma: any;
  let audit: any;
  let shortageService: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      grnHeader: {
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'grn-1', ...data })),
      },
      iqcInspection: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    shortageService = {};
    service = new GrnService(prisma, audit, shortageService);
  });

  it('blocks submit when physical verification never happened', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'DRAFT', physicallyVerifiedAt: null, items: [{ id: 'item-1' }],
    });
    await expect(service.submit('grn-1', user)).rejects.toThrow(/[Pp]hysical verification is required/);
  });

  it('allows submit once physical verification has been recorded', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'DRAFT', physicallyVerifiedAt: new Date(), items: [{ id: 'item-1' }],
    });
    const r = await service.submit('grn-1', user);
    expect(r.status).toBe('IQC_PENDING');
  });

  it('still blocks submit with no items regardless of verification', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'DRAFT', physicallyVerifiedAt: new Date(), items: [],
    });
    await expect(service.submit('grn-1', user)).rejects.toThrow(BadRequestException);
  });
});

describe('GrnService.reverse - STORE-006', () => {
  let service: GrnService;
  let prisma: any;
  let audit: any;
  let shortageService: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      grnHeader: {
        findFirst: jest.fn().mockResolvedValue({ id: 'grn-1', status: 'IQC_PENDING' }),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'grn-1', ...data })),
      },
      iqcInspection: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    shortageService = {};
    service = new GrnService(prisma, audit, shortageService);
  });

  it('reverses a submitted GRN with no IQC inspection yet, recording reason and reversedBy', async () => {
    const r = await service.reverse('grn-1', { reason: 'Wrong PO linked' }, user);
    expect(r.status).toBe('REVERSED');
    expect(r.reversalReason).toBe('Wrong PO linked');
    expect(r.reversedById).toBe(user.id);
    expect(r.reversedAt).toBeInstanceOf(Date);
  });

  it('blocks reversal once an IQC inspection already exists for this GRN', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue({ id: 'iqc-1' });
    await expect(service.reverse('grn-1', { reason: 'x' }, user)).rejects.toThrow(/already exists/);
  });

  it('blocks reversal on a still-DRAFT GRN - it should be edited directly, not reversed', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({ id: 'grn-1', status: 'DRAFT' });
    await expect(service.reverse('grn-1', { reason: 'x' }, user)).rejects.toThrow(/does not need reversal/);
  });

  it('blocks reversing an already-reversed GRN', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({ id: 'grn-1', status: 'REVERSED' });
    await expect(service.reverse('grn-1', { reason: 'x' }, user)).rejects.toThrow(/already reversed/);
  });

  it('logs the audit trail for the reversal', async () => {
    await service.reverse('grn-1', { reason: 'Wrong PO linked' }, user);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'grn_headers', action: 'UPDATE' }));
  });
});
