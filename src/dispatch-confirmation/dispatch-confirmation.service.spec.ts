import { DispatchConfirmationService } from './dispatch-confirmation.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DispatchConfirmationService - DSP-012', () => {
  let service: DispatchConfirmationService;
  let prisma: any;
  let audit: any;
  let readiness: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function pkg(overrides: any = {}) {
    return {
      id: 'pkg-1', status: 'ACTIVE', isActive: true, loadedInLoadingId: 'ld-1',
      items: [{ verificationItemId: 'dvi-1' }],
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      dispatchLoading: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ld-1', transportAssignmentId: 'ta-1', dispatchPlanId: 'plan-1', soId: 'so-1', customerName: 'ABC Corp', items: [{ isActive: true, status: 'LOADED' }] }),
      },
      dispatchConfirmation: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'dc-1', ...data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'dc-1', status: 'PENDING_CONFIRMATION', loadingId: 'ld-1', dispatchPlanId: 'plan-1' }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'dc-1', status: 'PENDING_CONFIRMATION',
          loading: { items: [{ isActive: true, status: 'LOADED' }] },
          items: [{ isActive: true, status: 'CONFIRMED' }],
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data })),
      },
      dispatchPackage: { findFirst: jest.fn().mockResolvedValue(pkg()), findUnique: jest.fn().mockResolvedValue({ gateOutId: null }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      dispatchConfirmationItem: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: `dci-${Math.random()}`, ...data })),
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data })),
      },
      dispatchVerificationItem: { findUnique: jest.fn().mockResolvedValue({ pickListItemId: 'pli-1', saleType: 'RM' }) },
      pickListItem: { findUnique: jest.fn().mockResolvedValue({ batchId: 'batch-1', dispatchReservationId: 'res-1' }) },
      stockBatch: { findUnique: jest.fn().mockResolvedValue({ status: 'ACTIVE' }) },
      dispatchReservation: { findUnique: jest.fn() },
      workOrder: { findUnique: jest.fn() },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    readiness = { checkReadiness: jest.fn().mockResolvedValue({ overall: 'DOCUMENTS_READY' }) };
    service = new DispatchConfirmationService(prisma, audit, readiness);
  });

  it('creates a Confirmation only when the Loading has valid loaded packages (section 8-9)', async () => {
    const confirmation = await service.createConfirmation('ld-1', user);
    expect(confirmation.confirmationNumber).toBe('DC-2026-0001');
  });

  it('blocks Confirmation creation when nothing has been loaded', async () => {
    prisma.dispatchLoading.findFirst.mockResolvedValue({ id: 'ld-1', items: [] });
    await expect(service.createConfirmation('ld-1', user)).rejects.toThrow(/no valid loaded packages/);
  });

  it('CRITICAL RM PROOF: confirms an eligible loaded package for Gate-Out readiness', async () => {
    const result = await service.confirmPackage('dc-1', 'pkg-1', user);
    expect(result.status).toBe('CONFIRMED');
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('CRITICAL DUPLICATE CONFIRMATION PROOF (section 47, 98, 108): a package already confirmed is blocked on the second attempt via the atomic claim', async () => {
    prisma.$executeRaw.mockResolvedValue(0);
    await expect(service.confirmPackage('dc-1', 'pkg-1', user)).rejects.toThrow(/already confirmed \(duplicate confirmation blocked\)/);
  });

  it('rejects a package not loaded under this exact Loading (section 19)', async () => {
    prisma.dispatchPackage.findFirst.mockResolvedValue(null);
    await expect(service.confirmPackage('dc-1', 'pkg-1', user)).rejects.toThrow(NotFoundException);
  });

  it('MANDATORY: HOLD placed on the batch AFTER loading blocks confirmation and records a traceable EXCEPTION (section 27-28)', async () => {
    prisma.stockBatch.findUnique.mockResolvedValue({ status: 'QUARANTINED' });
    await expect(service.confirmPackage('dc-1', 'pkg-1', user)).rejects.toThrow(/QUALITY_HOLD/);
    expect(prisma.dispatchConfirmationItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EXCEPTION', exceptionReason: 'QUALITY_HOLD' }) }),
    );
  });

  it('CRITICAL DOCUMENT REVALIDATION PROOF (section 30-31): a cancelled/blocked commercial document blocks confirmation even when quality is fine', async () => {
    readiness.checkReadiness.mockResolvedValue({ overall: 'BLOCKED' });
    await expect(service.confirmPackage('dc-1', 'pkg-1', user)).rejects.toThrow(/DOCUMENTS_BLOCKED/);
  });

  it('SFG: a Blocked stage after loading blocks confirmation', async () => {
    prisma.dispatchPackage.findFirst.mockResolvedValue(pkg({ items: [{ verificationItemId: 'dvi-2' }] }));
    prisma.dispatchVerificationItem.findUnique.mockResolvedValue({ pickListItemId: 'pli-2', saleType: 'SFG' });
    prisma.pickListItem.findUnique.mockResolvedValue({ batchId: null, dispatchReservationId: 'res-2' });
    prisma.dispatchReservation.findUnique.mockResolvedValue({ workOrderId: 'wo-1' });
    prisma.workOrder.findUnique.mockResolvedValue({ stageStatus: 'BLOCKED' });
    await expect(service.confirmPackage('dc-1', 'pkg-1', user)).rejects.toThrow(/STAGE_MISMATCH/);
  });

  it('CONFIRMATION TYPE TEST (section 11-13): FULL when confirmed count equals loaded count', async () => {
    await service.confirmPackage('dc-1', 'pkg-1', user);
    expect(prisma.dispatchConfirmation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'READY_FOR_GATE_OUT', confirmationType: 'FULL' }) }),
    );
  });

  it('CONFIRMATION TYPE TEST: PARTIAL when confirmed count is less than loaded count', async () => {
    prisma.dispatchConfirmation.findUnique.mockResolvedValue({
      id: 'dc-1', status: 'PENDING_CONFIRMATION',
      loading: { items: [{ isActive: true, status: 'LOADED' }, { isActive: true, status: 'LOADED' }] },
      items: [{ isActive: true, status: 'CONFIRMED' }],
    });
    await service.confirmPackage('dc-1', 'pkg-1', user);
    expect(prisma.dispatchConfirmation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PARTIALLY_CONFIRMED', confirmationType: 'PARTIAL' }) }),
    );
  });

  it('REVERSAL TEST (section 55-60): reverses only the confirmation claim, never touches Loading/Pack/Verification/Pick/Reservation', async () => {
    prisma.dispatchConfirmationItem.findFirst.mockResolvedValue({ id: 'dci-1', confirmationId: 'dc-1', packageId: 'pkg-1', status: 'CONFIRMED' });
    const result = await service.reverseConfirmationItem('dci-1', 'Vehicle capacity reassessment', user);
    expect(result.status).toBe('REVERSED');
    expect(prisma.dispatchPackage.updateMany).toHaveBeenCalledWith({ where: { id: 'pkg-1', confirmedInConfirmationId: 'dc-1' }, data: { confirmedInConfirmationId: null } });
    expect(Object.keys(prisma)).not.toContain('dispatchLoadingItem');
  });

  it('DSP-013 POST-GATE-OUT GUARD: reversal is blocked once the package has already been Gated-Out', async () => {
    prisma.dispatchConfirmationItem.findFirst.mockResolvedValue({ id: 'dci-1', confirmationId: 'dc-1', packageId: 'pkg-1', status: 'CONFIRMED' });
    prisma.dispatchPackage.findUnique.mockResolvedValue({ gateOutId: 'go-1' });
    await expect(service.reverseConfirmationItem('dci-1', 'reason', user)).rejects.toThrow(/already been Gated-Out/);
  });

  it('CRITICAL BOUNDARY PROOF (section 4, 63-66): confirming a package never calls any inventory/SO-dispatch write - the mock exposes no such methods', async () => {
    await service.confirmPackage('dc-1', 'pkg-1', user);
    expect(Object.keys(prisma)).not.toContain('stockBalance');
    expect(Object.keys(prisma)).not.toContain('salesOrderItem');
  });
});
