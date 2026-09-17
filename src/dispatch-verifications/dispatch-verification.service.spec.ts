import { DispatchVerificationService } from './dispatch-verification.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DispatchVerificationService - DSP-007', () => {
  let service: DispatchVerificationService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function pickListItem(overrides: any = {}) {
    return {
      id: 'pli-1', pickListId: 'pl-1', dispatchReservationId: 'res-1',
      soItemId: 'so-item-1', itemCode: 'LED-DRIVER-01', itemName: 'LED Driver',
      saleType: 'RM', batchId: 'batch-1', pickedQty: 2000, reversedQty: 0, status: 'ACTIVE',
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      pickList: { findFirst: jest.fn().mockResolvedValue({ id: 'pl-1', soId: 'so-1', customerName: 'ABC Corp', status: 'PICKED' }) },
      dispatchVerification: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'dv-1', ...data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'dv-1', pickListId: 'pl-1', status: 'PENDING' }),
        update: jest.fn().mockResolvedValue({}),
      },
      dispatchVerificationItem: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { verifiedQty: 0, reversedQty: 0 } }),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: `dvi-${Math.random()}`, ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data })),
      },
      pickListItem: { findFirst: jest.fn().mockResolvedValue(pickListItem()), findMany: jest.fn().mockResolvedValue([]) },
      stockBatch: { findUnique: jest.fn().mockResolvedValue({ id: 'batch-1', status: 'ACTIVE' }) },
      dispatchReservation: { findUnique: jest.fn() },
      workOrder: { findUnique: jest.fn() },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new DispatchVerificationService(prisma, audit);
  });

  it('creates a Verification only from a Pick List with actual picked quantity (section 5-6)', async () => {
    const dv = await service.createVerification('pl-1', user);
    expect(dv.verificationNumber).toBe('DV-2026-0001');
  });

  it('blocks Verification creation when nothing has been picked yet', async () => {
    prisma.pickList.findFirst.mockResolvedValue({ id: 'pl-1', status: 'CREATED' });
    await expect(service.createVerification('pl-1', user)).rejects.toThrow(/no picked quantity/);
  });

  it('CRITICAL RM PROOF (section 94): verifies exact picked quantity when batch is still ACTIVE', async () => {
    const result = await service.verifyItem('dv-1', 'pli-1', 2000, user);
    expect(result.verifiedQty).toBe(2000);
    expect(result.status).toBe('VERIFIED');
  });

  it('CRITICAL QUALITY PROOF (section 37, 96): HOLD placed on the batch AFTER picking blocks verification, mandatory test', async () => {
    prisma.stockBatch.findUnique.mockResolvedValue({ id: 'batch-1', status: 'QUARANTINED' });
    await expect(service.verifyItem('dv-1', 'pli-1', 2000, user)).rejects.toThrow(/QC_HOLD/);
    // still records the exception, not silently drops it
    expect(prisma.dispatchVerificationItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EXCEPTION', exceptionReason: 'QC_HOLD', verifiedQty: 0 }) }),
    );
  });

  it('CRITICAL SFG PROOF (section 95-96): a Blocked stage after picking blocks SFG verification', async () => {
    prisma.pickListItem.findFirst.mockResolvedValue(pickListItem({ saleType: 'SFG', batchId: null }));
    prisma.dispatchReservation.findUnique.mockResolvedValue({ workOrderId: 'wo-1' });
    prisma.workOrder.findUnique.mockResolvedValue({ stageStatus: 'BLOCKED' });
    await expect(service.verifyItem('dv-1', 'pli-1', 1000, user)).rejects.toThrow(/STAGE_MISMATCH/);
  });

  it('SFG verification passes when the stage is still valid', async () => {
    prisma.pickListItem.findFirst.mockResolvedValue(pickListItem({ saleType: 'SFG', batchId: null }));
    prisma.dispatchReservation.findUnique.mockResolvedValue({ workOrderId: 'wo-1' });
    prisma.workOrder.findUnique.mockResolvedValue({ stageStatus: 'COMPLETED' });
    const result = await service.verifyItem('dv-1', 'pli-1', 1000, user);
    expect(result.verifiedQty).toBe(1000);
  });

  it('VERIFIED QTY LIMIT (section 22): blocks verifying more than remains on the pick', async () => {
    prisma.pickListItem.findFirst.mockResolvedValue(pickListItem({ pickedQty: 100 }));
    await expect(service.verifyItem('dv-1', 'pli-1', 500, user)).rejects.toThrow(/exceeds what remains to verify/);
  });

  it('MULTIPLE VERIFICATION EVENTS (section 24): a second event correctly sees the first as already-verified', async () => {
    prisma.dispatchVerificationItem.aggregate.mockResolvedValue({ _sum: { verifiedQty: 1200, reversedQty: 0 } });
    const result = await service.verifyItem('dv-1', 'pli-1', 800, user); // remaining room = 2000-1200=800
    expect(result.verifiedQty).toBe(800);
  });

  it('NESTED RESERVED/PICKED/VERIFIED DOUBLE-COUNT TEST (section 44-45, 90, 97): verified qty is validated as PART of picked, never a second independent claim', async () => {
    prisma.dispatchVerificationItem.aggregate.mockResolvedValue({ _sum: { verifiedQty: 1500, reversedQty: 0 } });
    prisma.pickListItem.findFirst.mockResolvedValue(pickListItem({ pickedQty: 2000 }));
    await expect(service.verifyItem('dv-1', 'pli-1', 600, user)).rejects.toThrow(/exceeds what remains to verify on this pick \(500\)/);
  });

  it('VERIFICATION REVERSAL (section 53-54): reverses only the verification state, never touches the Pick or the Reservation', async () => {
    prisma.dispatchVerificationItem.findFirst.mockResolvedValue({ id: 'dvi-1', verificationId: 'dv-1', verifiedQty: 1000, reversedQty: 0 });
    const result = await service.reverseVerification('dvi-1', 200, 'Double checked physically', user);
    expect(result.reversedQty).toBe(200);
    expect(prisma.pickListItem.update).toBeUndefined();
    expect(prisma.dispatchReservation.findUnique).not.toHaveBeenCalled();
  });

  it('blocks verifying a fully reversed pick', async () => {
    prisma.pickListItem.findFirst.mockResolvedValue(pickListItem({ status: 'REVERSED' }));
    await expect(service.verifyItem('dv-1', 'pli-1', 100, user)).rejects.toThrow(/fully reversed/);
  });

  it('does not increase Sales Order Dispatched Qty as a side effect of verification (no dispatch test)', async () => {
    await service.verifyItem('dv-1', 'pli-1', 2000, user);
    expect(prisma.pickListItem.update).toBeUndefined();
  });
});
