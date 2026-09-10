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
