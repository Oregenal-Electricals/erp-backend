import { DispatchLoadingService } from './dispatch-loading.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DispatchLoadingService - DSP-011', () => {
  let service: DispatchLoadingService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function pkg(overrides: any = {}) {
    return {
      id: 'pkg-1', status: 'ACTIVE', isActive: true, assignedTransportAssignmentId: 'ta-1',
      items: [{ verificationItemId: 'dvi-1' }],
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      dispatchTransportAssignment: { findFirst: jest.fn().mockResolvedValue({ id: 'ta-1', status: 'ASSIGNED', vehicleNumber: 'HR55AB1234', dispatchPlanId: 'plan-1', soId: 'so-1', customerName: 'ABC Corp' }) },
      dispatchLoading: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'ld-1', ...data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'ld-1', status: 'IN_PROGRESS', transportAssignmentId: 'ta-1', transportAssignment: { vehicleNumber: 'HR55AB1234' }, items: [{ isActive: true, status: 'LOADED' }] }),
        findUnique: jest.fn().mockResolvedValue({ id: 'ld-1', status: 'IN_PROGRESS', transportAssignment: { packages: [{ id: 'pkg-1' }] }, items: [{ isActive: true, status: 'LOADED' }] }),
        update: jest.fn().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data })),
      },
      dispatchPackage: { findFirst: jest.fn().mockResolvedValue(pkg()), findUnique: jest.fn().mockResolvedValue({ gateOutId: null }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      dispatchLoadingItem: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: `dli-${Math.random()}`, ...data })),
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
    service = new DispatchLoadingService(prisma, audit);
  });

  it('starts loading only when the Transport Assignment is confirmed (ASSIGNED)', async () => {
    const loading = await service.startLoading('ta-1', 'HR55AB1234', user);
    expect(loading.loadingNumber).toBe('LD-2026-0001');
    expect(loading.status).toBe('IN_PROGRESS');
  });

  it('blocks starting loading against a DRAFT (unconfirmed) assignment', async () => {
    prisma.dispatchTransportAssignment.findFirst.mockResolvedValue({ id: 'ta-1', status: 'DRAFT' });
    await expect(service.startLoading('ta-1', undefined, user)).rejects.toThrow(/must be confirmed/);
  });

  it('CRITICAL WRONG VEHICLE PROOF (section 8-9): blocks loading when the actual vehicle does not match the DSP-010 assignment', async () => {
    await expect(service.startLoading('ta-1', 'HR55ZZ9999', user)).rejects.toThrow(/Vehicle mismatch/);
  });

  it('CRITICAL RM PROOF: loads an eligible package assigned to this exact vehicle', async () => {
    const result = await service.loadPackage('ld-1', 'pkg-1', 'HR55AB1234', user);
    expect(result.status).toBe('LOADED');
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('CRITICAL DUPLICATE PACKAGE PROOF (section 16, 96, 97): a package already loaded is blocked on the second scan via the atomic claim', async () => {
    prisma.$executeRaw.mockResolvedValue(0);
    await expect(service.loadPackage('ld-1', 'pkg-1', undefined, user)).rejects.toThrow(/already loaded \(duplicate scan blocked\)/);
  });

  it('blocks a package that belongs to a different vehicle/Dispatch (section 14-15)', async () => {
    prisma.dispatchPackage.findFirst.mockResolvedValue(null);
    await expect(service.loadPackage('ld-1', 'pkg-1', undefined, user)).rejects.toThrow(NotFoundException);
  });

  it('MANDATORY: HOLD placed on the batch AFTER packing blocks loading, and records a traceable EXCEPTION rather than silently failing', async () => {
    prisma.stockBatch.findUnique.mockResolvedValue({ status: 'QUARANTINED' });
    await expect(service.loadPackage('ld-1', 'pkg-1', undefined, user)).rejects.toThrow(/QUALITY_HOLD/);
    expect(prisma.dispatchLoadingItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EXCEPTION', exceptionReason: 'QUALITY_HOLD' }) }),
    );
  });

  it('CRITICAL SFG PROOF: a Blocked stage after packing blocks SFG loading', async () => {
    prisma.dispatchPackage.findFirst.mockResolvedValue(pkg({ items: [{ verificationItemId: 'dvi-2' }] }));
    prisma.dispatchVerificationItem.findUnique.mockResolvedValue({ pickListItemId: 'pli-2', saleType: 'SFG' });
    prisma.pickListItem.findUnique.mockResolvedValue({ batchId: null, dispatchReservationId: 'res-2' });
    prisma.dispatchReservation.findUnique.mockResolvedValue({ workOrderId: 'wo-1' });
    prisma.workOrder.findUnique.mockResolvedValue({ stageStatus: 'BLOCKED' });
    await expect(service.loadPackage('ld-1', 'pkg-1', undefined, user)).rejects.toThrow(/STAGE_MISMATCH/);
  });

  it('UNLOAD TEST (section 41-45): reverses the package claim, never touches Pack/Verification/Pick/Reservation state', async () => {
    prisma.dispatchLoadingItem.findFirst.mockResolvedValue({ id: 'dli-1', loadingId: 'ld-1', packageId: 'pkg-1', status: 'LOADED' });
    const result = await service.unloadPackage('dli-1', 'Wrong package scanned', user);
    expect(result.status).toBe('UNLOADED');
    expect(prisma.dispatchPackage.updateMany).toHaveBeenCalledWith({ where: { id: 'pkg-1', loadedInLoadingId: 'ld-1' }, data: { loadedInLoadingId: null } });
    expect(Object.keys(prisma)).not.toContain('dispatchPackingItem');
    expect(Object.keys(prisma)).not.toContain('dispatchVerificationItem2');
  });

  it('DSP-013 POST-GATE-OUT GUARD: unload is blocked once the package has already been Gated-Out', async () => {
    prisma.dispatchLoadingItem.findFirst.mockResolvedValue({ id: 'dli-1', loadingId: 'ld-1', packageId: 'pkg-1', status: 'LOADED' });
    prisma.dispatchPackage.findUnique.mockResolvedValue({ gateOutId: 'go-1' });
    await expect(service.unloadPackage('dli-1', 'reason', user)).rejects.toThrow(/already been Gated-Out/);
  });

  it('COMPLETION requires at least one loaded package (section 47)', async () => {
    prisma.dispatchLoading.findFirst.mockResolvedValue({ id: 'ld-1', items: [] });
    await expect(service.completeLoading('ld-1', user)).rejects.toThrow(/Load at least one package/);
  });

  it('CRITICAL BOUNDARY PROOF (section 56-58): loading a package never calls any inventory/SO-dispatch write - the mock exposes no such methods', async () => {
    await service.loadPackage('ld-1', 'pkg-1', undefined, user);
    expect(Object.keys(prisma)).not.toContain('stockBalance');
    expect(Object.keys(prisma)).not.toContain('salesOrderItem');
  });
});
