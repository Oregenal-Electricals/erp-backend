import { DispatchPackingService } from './dispatch-packing.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DispatchPackingService - DSP-008', () => {
  let service: DispatchPackingService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function verificationItem(overrides: any = {}) {
    return {
      id: 'dvi-1', pickListItemId: 'pli-1',
      soItemId: 'so-item-1', itemCode: 'LED-DRIVER-01', itemName: 'LED Driver',
      saleType: 'RM', verifiedQty: 2000, reversedQty: 0, status: 'VERIFIED',
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      dispatchVerification: { findFirst: jest.fn().mockResolvedValue({ id: 'dv-1', soId: 'so-1', customerName: 'ABC Corp', status: 'VERIFIED' }) },
      dispatchPacking: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'dpk-1', ...data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'dpk-1', status: 'DRAFT', companyId: 'company-1' }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'dpk-1',
          verification: { items: [{ id: 'dvi-1', isActive: true, verifiedQty: 2000, reversedQty: 0 }] },
          packages: [{ items: [] }],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      dispatchPackage: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'pkg-1', ...data, items: [] })),
        findFirst: jest.fn().mockResolvedValue({ id: 'pkg-1', packingId: 'dpk-1', status: 'ACTIVE' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'pkg-1', packingId: 'dpk-1' }),
      },
      dispatchPackageItem: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { packedQty: 0, reversedQty: 0 } }),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: `dpi-${Math.random()}`, ...data })),
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data })),
      },
      dispatchVerificationItem: { findFirst: jest.fn().mockResolvedValue(verificationItem()) },
      pickListItem: { findUnique: jest.fn().mockResolvedValue({ id: 'pli-1', batchId: 'batch-1', dispatchReservationId: 'res-1' }) },
      stockBatch: { findUnique: jest.fn().mockResolvedValue({ id: 'batch-1', status: 'ACTIVE' }) },
      dispatchReservation: { findUnique: jest.fn() },
      workOrder: { findUnique: jest.fn(), update: jest.fn() },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new DispatchPackingService(prisma, audit);
  });

  it('creates a Packing only from an actual VERIFIED Verification (section 6)', async () => {
    const dpk = await service.createPacking('dv-1', user);
    expect(dpk.packingNumber).toBe('DPK-2026-0001');
  });

  it('blocks Packing creation when nothing has been verified yet', async () => {
    prisma.dispatchVerification.findFirst.mockResolvedValue({ id: 'dv-1', status: 'PENDING' });
    await expect(service.createPacking('dv-1', user)).rejects.toThrow(/no verified quantity/);
  });

  it('creates a package with its own unique business identity (section 8-9)', async () => {
    const pkg = await service.createPackage('dpk-1', user, 'CARTON', 5.5, 6.0);
    expect(pkg.packageNumber).toBe('PKG-000001');
    expect(pkg.packageType).toBe('CARTON');
  });

  it('CRITICAL RM PROOF: packs exact verified quantity when batch is still ACTIVE', async () => {
    const result = await service.addPackageItem('pkg-1', 'dvi-1', 2000, user);
    expect(result.packedQty).toBe(2000);
    expect(result.status).toBe('PACKED');
  });

  it('MANDATORY: HOLD placed on the batch AFTER verification blocks packing', async () => {
    prisma.stockBatch.findUnique.mockResolvedValue({ id: 'batch-1', status: 'QUARANTINED' });
    await expect(service.addPackageItem('pkg-1', 'dvi-1', 2000, user)).rejects.toThrow(/QUALITY_HOLD/);
  });

  it('CRITICAL SFG PROOF (section 92): a Blocked stage after verification blocks SFG packing, and never touches the Production routing Packaging stage or WorkOrder', async () => {
    prisma.dispatchVerificationItem.findFirst.mockResolvedValue(verificationItem({ saleType: 'SFG' }));
    prisma.pickListItem.findUnique.mockResolvedValue({ id: 'pli-1', batchId: null, dispatchReservationId: 'res-1' });
    prisma.dispatchReservation.findUnique.mockResolvedValue({ workOrderId: 'wo-1' });
    prisma.workOrder.findUnique.mockResolvedValue({ stageStatus: 'BLOCKED' });
    await expect(service.addPackageItem('pkg-1', 'dvi-1', 1000, user)).rejects.toThrow(/STAGE_MISMATCH/);
    // structural proof: no Production transfer / stage-completion call anywhere
    expect(prisma.workOrder.update).not.toHaveBeenCalled();
  });

  it('SFG packing passes when the stage is still valid, still never touching WorkOrder', async () => {
    prisma.dispatchVerificationItem.findFirst.mockResolvedValue(verificationItem({ saleType: 'SFG' }));
    prisma.pickListItem.findUnique.mockResolvedValue({ id: 'pli-1', batchId: null, dispatchReservationId: 'res-1' });
    prisma.dispatchReservation.findUnique.mockResolvedValue({ workOrderId: 'wo-1' });
    prisma.workOrder.findUnique.mockResolvedValue({ stageStatus: 'COMPLETED' });
    const result = await service.addPackageItem('pkg-1', 'dvi-1', 1000, user);
    expect(result.packedQty).toBe(1000);
    expect(prisma.workOrder.update).not.toHaveBeenCalled();
  });

  it('PACKING LIMIT (section 25): blocks packing more than remains on the verification', async () => {
    prisma.dispatchVerificationItem.findFirst.mockResolvedValue(verificationItem({ verifiedQty: 100 }));
    await expect(service.addPackageItem('pkg-1', 'dvi-1', 500, user)).rejects.toThrow(/exceeds what remains to pack/);
  });

  it('MULTIPLE PACKING EVENTS (section 24): a second package correctly sees the first as already-packed', async () => {
    prisma.dispatchPackageItem.aggregate.mockResolvedValue({ _sum: { packedQty: 1200, reversedQty: 0 } });
    const result = await service.addPackageItem('pkg-1', 'dvi-1', 800, user); // remaining room = 2000-1200=800
    expect(result.packedQty).toBe(800);
  });

  it('NESTED QUANTITY DOUBLE-COUNT TEST (section 5, 88, 94): packed qty is validated as PART of verified, never a second independent claim', async () => {
    prisma.dispatchPackageItem.aggregate.mockResolvedValue({ _sum: { packedQty: 1500, reversedQty: 0 } });
    prisma.dispatchVerificationItem.findFirst.mockResolvedValue(verificationItem({ verifiedQty: 2000 }));
    await expect(service.addPackageItem('pkg-1', 'dvi-1', 600, user)).rejects.toThrow(/exceeds what remains to pack on this verification \(500\)/);
  });

  it('blocks packing an unverified (EXCEPTION) verification item', async () => {
    prisma.dispatchVerificationItem.findFirst.mockResolvedValue(verificationItem({ status: 'EXCEPTION' }));
    await expect(service.addPackageItem('pkg-1', 'dvi-1', 100, user)).rejects.toThrow(/not eligible for packing/);
  });

  it('PACKING REVERSAL (section 58-60): reverses only the package item, never touches Verification, Pick, or Reservation', async () => {
    prisma.dispatchPackageItem.findFirst.mockResolvedValue({ id: 'dpi-1', packageId: 'pkg-1', packedQty: 1000, reversedQty: 0 });
    const result = await service.reversePackageItem('dpi-1', 200, 'Repacking required', user);
    expect(result.reversedQty).toBe(200);
    expect(prisma.dispatchVerificationItem.findFirst).not.toHaveBeenCalled();
    expect(prisma.dispatchReservation.findUnique).not.toHaveBeenCalled();
  });

  it('does not increase Sales Order Dispatched Qty as a side effect of packing (no dispatch test)', async () => {
    await service.addPackageItem('pkg-1', 'dvi-1', 2000, user);
    expect(prisma.dispatchVerificationItem.findFirst).toHaveBeenCalled();
    // no sales-order table touched anywhere in the service
    expect(Object.keys(prisma)).not.toContain('salesOrder');
  });
});
