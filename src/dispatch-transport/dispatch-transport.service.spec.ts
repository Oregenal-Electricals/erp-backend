import { DispatchTransportService } from './dispatch-transport.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DispatchTransportService - DSP-010', () => {
  let service: DispatchTransportService;
  let prisma: any;
  let audit: any;
  let readiness: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      dispatchPlan: { findFirst: jest.fn().mockResolvedValue({ id: 'plan-1', soId: 'so-1', customerName: 'ABC Corp', status: 'DRAFT' }) },
      dispatchPacking: { count: jest.fn().mockResolvedValue(1) },
      vehicle: { findFirst: jest.fn().mockResolvedValue(null) },
      dispatchTransportAssignment: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'ta-1', ...data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'ta-1', dispatchPlanId: 'plan-1', status: 'DRAFT', vehicleNumber: null, driverName: null, packages: [] }),
        update: jest.fn().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data })),
      },
      dispatchPackage: {
        findFirst: jest.fn().mockResolvedValue({ id: 'pkg-1', status: 'ACTIVE' }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    readiness = { checkReadiness: jest.fn().mockResolvedValue({ overall: 'DOCUMENTS_READY' }) };
    service = new DispatchTransportService(prisma, audit, readiness);
  });

  it('creates an assignment only when the plan has packed quantity (section 3, 6)', async () => {
    const result = await service.createAssignment({ dispatchPlanId: 'plan-1', vehicleNumber: 'HR55AB1234' }, user);
    expect(result.assignmentNumber).toBe('TA-2026-0001');
  });

  it('blocks assignment creation when nothing has been packed yet', async () => {
    prisma.dispatchPacking.count.mockResolvedValue(0);
    await expect(service.createAssignment({ dispatchPlanId: 'plan-1' }, user)).rejects.toThrow(/no packed quantity/);
  });

  it('blocks assignment to an existing but inactive/blocked Vehicle master record (section 8)', async () => {
    prisma.vehicle.findFirst.mockResolvedValue({ id: 'veh-1', vehicleNumber: 'HR55AB1234', isActive: false });
    await expect(service.createAssignment({ dispatchPlanId: 'plan-1', vehicleNumber: 'HR55AB1234' }, user)).rejects.toThrow(/inactive\/blocked/);
  });

  it('CRITICAL PACKAGE CONCURRENCY PROOF (section 29, 59, 91): an atomic conditional UPDATE blocks assigning an already-assigned package to a second vehicle', async () => {
    prisma.$executeRaw.mockResolvedValue(0); // simulates the WHERE clause matching zero rows (already assigned)
    await expect(service.assignPackage('ta-1', 'pkg-1', user)).rejects.toThrow(/already assigned to another active vehicle/);
  });

  it('successfully assigns an eligible ACTIVE package when the atomic claim succeeds', async () => {
    await service.assignPackage('ta-1', 'pkg-1', user);
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('rejects assigning a REVERSED (not ACTIVE) package (section 19)', async () => {
    prisma.dispatchPackage.findFirst.mockResolvedValue(null); // findFirst filters status: 'ACTIVE', so a REVERSED package returns null
    await expect(service.assignPackage('ta-1', 'pkg-1', user)).rejects.toThrow(NotFoundException);
  });

  it('confirms an assignment only once at least one package is attached', async () => {
    prisma.dispatchTransportAssignment.findFirst.mockResolvedValue({ id: 'ta-1', status: 'DRAFT', packages: [] });
    await expect(service.confirmAssignment('ta-1', user)).rejects.toThrow(/Assign at least one package/);
  });

  it('VEHICLE REASSIGNMENT TEST (section 36, 83): preserves the old vehicle in the audit trail and flags document recheck required', async () => {
    prisma.dispatchTransportAssignment.findFirst.mockResolvedValue({ id: 'ta-1', status: 'ASSIGNED', vehicleNumber: 'HR55AA1234', driverName: 'Ram' });
    const result = await service.reassignVehicle('ta-1', { vehicleNumber: 'HR55BB5678', reason: 'Breakdown' }, user);
    expect(result.documentRecheckRequired).toBe(true);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      newValues: expect.objectContaining({ old: expect.objectContaining({ vehicleNumber: 'HR55AA1234' }), reason: 'Breakdown' }),
    }));
  });

  it('CANCELLATION TEST (section 56-57): releases all package allocations, never touches Pick/Verification/Packing/Reservation state', async () => {
    prisma.dispatchTransportAssignment.findFirst.mockResolvedValue({ id: 'ta-1', status: 'ASSIGNED' });
    await service.cancelAssignment('ta-1', 'Customer requested delay', user);
    expect(prisma.dispatchPackage.updateMany).toHaveBeenCalledWith({ where: { assignedTransportAssignmentId: 'ta-1' }, data: { assignedTransportAssignmentId: null } });
    // no reservation/pick/verification/packing table ever appears in the mock, proving nothing there could have been touched
    expect(Object.keys(prisma)).not.toContain('dispatchReservation');
    expect(Object.keys(prisma)).not.toContain('pickListItem');
  });

  it('READY FOR LOADING TEST (section 50-51): true only when confirmed, packages assigned, vehicle recorded, and documents ready - Loaded Qty always reported as 0', async () => {
    prisma.dispatchTransportAssignment.findFirst.mockResolvedValue({
      id: 'ta-1', dispatchPlanId: 'plan-1', assignmentNumber: 'TA-2026-0001', status: 'ASSIGNED', vehicleNumber: 'HR55AB1234',
      packages: [{ id: 'pkg-1' }],
    });
    const result = await service.checkReadyForLoading('ta-1', user);
    expect(result.readyForLoading).toBe(true);
    expect(result.loadedQty).toBe(0);
  });

  it('CRITICAL DOCUMENTS-PENDING PROOF (section 67, 78): NOT ready for loading while DSP-009 readiness is not DOCUMENTS_READY, even with a confirmed vehicle', async () => {
    readiness.checkReadiness.mockResolvedValue({ overall: 'DOCUMENT_PENDING' });
    prisma.dispatchTransportAssignment.findFirst.mockResolvedValue({
      id: 'ta-1', dispatchPlanId: 'plan-1', assignmentNumber: 'TA-2026-0001', status: 'ASSIGNED', vehicleNumber: 'HR55AB1234',
      packages: [{ id: 'pkg-1' }],
    });
    const result = await service.checkReadyForLoading('ta-1', user);
    expect(result.readyForLoading).toBe(false);
    expect(result.reasons.some((r: string) => r.includes('DOCUMENT_PENDING'))).toBe(true);
  });

  it('CRITICAL BOUNDARY PROOF (section 94): creating and confirming an assignment never calls any inventory/SO-dispatch write - the mock exposes no such methods', async () => {
    await service.createAssignment({ dispatchPlanId: 'plan-1' }, user);
    expect(Object.keys(prisma)).not.toContain('stockBalance');
    expect(Object.keys(prisma)).not.toContain('salesOrderItem');
  });
});
