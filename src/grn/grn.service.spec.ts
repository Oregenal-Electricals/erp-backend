import { BadRequestException } from '@nestjs/common';
import { GrnService } from './grn.service';

describe('GrnService.update - Physical Verification (STORE-004 backend fix)', () => {
  let service: GrnService;
  let prisma: any;
  let audit: any;

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
      },
      $transaction: jest.fn().mockImplementation((ops: any) => Promise.all(ops)),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new GrnService(prisma, audit);
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

  it('rejects a verified qty that exceeds 105% of ordered - same tolerance as create()', async () => {
    await expect(
      service.update('grn-1', { items: [{ id: 'item-1', receivedQty: 1100 }] } as any, user),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.grnItem.update).not.toHaveBeenCalled();
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
