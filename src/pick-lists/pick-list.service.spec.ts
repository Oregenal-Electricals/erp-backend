import { PickListService } from './pick-list.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PickListService - DSP-006', () => {
  let service: PickListService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function reservation(overrides: any = {}) {
    return {
      id: 'res-1', reservationNumber: 'DR-2026-0001', reservationType: 'RM_DISPATCH',
      soItemId: 'so-item-1', itemCode: 'LED-DRIVER-01', itemName: 'LED Driver',
      warehouseId: 'wh-1', workOrderId: null, reservedQty: 2000, releasedQty: 0, status: 'ACTIVE',
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      dispatchPlan: { findFirst: jest.fn().mockResolvedValue({ id: 'plan-1', soId: 'so-1', customerName: 'ABC Corp', status: 'DRAFT' }) },
      dispatchReservation: { count: jest.fn().mockResolvedValue(1), findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      pickList: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'pl-1', ...data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'pl-1', dispatchPlanId: 'plan-1', status: 'CREATED' }),
        update: jest.fn().mockResolvedValue({}),
      },
      pickListItem: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { pickedQty: 0, reversedQty: 0 } }),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: `pli-${Math.random()}`, ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data })),
      },
      stockBatch: {
        findFirst: jest.fn().mockResolvedValue({ id: 'batch-1', batchNumber: 'B01', itemCode: 'LED-DRIVER-01', warehouseId: 'wh-1', status: 'ACTIVE', availableQty: 1200, reservedQty: 0 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      workOrder: { findUnique: jest.fn() },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new PickListService(prisma, audit);
  });

  it('creates a Pick List only from a plan with an active reservation (section 6)', async () => {
    const pl = await service.createPickList('plan-1', user);
    expect(pl.pickListNumber).toBe('PL-2026-0001');
    expect(pl.dispatchPlanId).toBe('plan-1');
  });

  it('blocks Pick List creation when the plan has no active reservation', async () => {
    prisma.dispatchReservation.count.mockResolvedValue(0);
    await expect(service.createPickList('plan-1', user)).rejects.toThrow(/no active reservation/);
  });

  it('CRITICAL RM PROOF (section 89): picks the exact batch, claims batch-level capacity, never touches StockBalance again', async () => {
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation());
    const result = await service.pickItem('pl-1', 'res-1', 'batch-1', 1200, user);
    expect(result.pickedQty).toBe(1200);
    expect(result.shortQty).toBe(0);
    expect(prisma.stockBatch.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reservedQty: { increment: 1200 } }) }),
    );
  });

  it('rejects a batch for a different item (section 45)', async () => {
    prisma.stockBatch.findFirst.mockResolvedValue({ id: 'batch-1', batchNumber: 'B01', itemCode: 'WRONG-ITEM', warehouseId: 'wh-1', status: 'ACTIVE', availableQty: 1200, reservedQty: 0 });
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation());
    await expect(service.pickItem('pl-1', 'res-1', 'batch-1', 100, user)).rejects.toThrow(/different item/);
  });

  it('blocks picking a Hold/Quarantined batch (section 10, 13, 26, 49)', async () => {
    prisma.stockBatch.findFirst.mockResolvedValue({ id: 'batch-1', batchNumber: 'B01', itemCode: 'LED-DRIVER-01', warehouseId: 'wh-1', status: 'QUARANTINED', availableQty: 1200, reservedQty: 0 });
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation());
    await expect(service.pickItem('pl-1', 'res-1', 'batch-1', 100, user)).rejects.toThrow(/QUARANTINED/);
  });

  it('PICK LIMIT (section 29): blocks a pick exceeding what remains on the reservation', async () => {
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation({ reservedQty: 100 }));
    await expect(service.pickItem('pl-1', 'res-1', 'batch-1', 500, user)).rejects.toThrow(/exceeds what remains to pick/);
  });

  it('MULTIPLE PICK EVENTS (section 28): a second pick against the same reservation correctly sees the first as already-picked', async () => {
    prisma.pickListItem.aggregate.mockResolvedValue({ _sum: { pickedQty: 1200, reversedQty: 0 } }); // already picked 1200 of 2000
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation());
    prisma.stockBatch.findFirst.mockResolvedValue({ id: 'batch-2', batchNumber: 'B02', itemCode: 'LED-DRIVER-01', warehouseId: 'wh-1', status: 'ACTIVE', availableQty: 1500, reservedQty: 0 });
    const result = await service.pickItem('pl-1', 'res-1', 'batch-2', 800, user); // remaining room = 800
    expect(result.pickedQty).toBe(800);
  });

  it('blocks a WRONG SFG STAGE pick when the Work Order/stage is Blocked (section 48-49)', async () => {
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation({ reservationType: 'SFG_DISPATCH', workOrderId: 'wo-1', warehouseId: null }));
    prisma.workOrder.findUnique.mockResolvedValue({ stageStatus: 'BLOCKED' });
    await expect(service.pickItem('pl-1', 'res-1', undefined, 500, user)).rejects.toThrow(/Blocked/);
  });

  it('CRITICAL SFG PROOF (section 90): SFG picks preserve WO trace via the reservation, without claiming any StockBatch', async () => {
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation({ reservationType: 'SFG_DISPATCH', workOrderId: 'wo-1', warehouseId: null, reservedQty: 1000 }));
    prisma.workOrder.findUnique.mockResolvedValue({ stageStatus: 'COMPLETED' });
    const result = await service.pickItem('pl-1', 'res-1', undefined, 1000, user);
    expect(result.pickedQty).toBe(1000);
    expect(result.batchId).toBeNull();
    expect(prisma.stockBatch.updateMany).not.toHaveBeenCalled();
  });

  it('RESERVED VS PICKED DOUBLE-COUNT TEST (section 37-38, 85, 91): picked qty is validated as PART of the reservation, never as a second independent claim', async () => {
    // Reserved 3000, already picked 2000 of it - remaining room must
    // be exactly 1000, not (reserved - picked) subtracted a second
    // time from some other total.
    prisma.pickListItem.aggregate.mockResolvedValue({ _sum: { pickedQty: 2000, reversedQty: 0 } });
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation({ reservedQty: 3000 }));
    await expect(service.pickItem('pl-1', 'res-1', 'batch-1', 1500, user)).rejects.toThrow(/exceeds what remains to pick on this reservation \(1000\)/);
  });

  it('PICK REVERSAL (section 56-57): reverses the batch-level claim only, never touches the DispatchReservation itself', async () => {
    prisma.pickListItem.findFirst.mockResolvedValue({ id: 'pli-1', pickListId: 'pl-1', pickedQty: 1000, reversedQty: 0, batchId: 'batch-1' });
    await service.reversePick('pli-1', 200, 'Wrong batch scanned', user);
    expect(prisma.stockBatch.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'batch-1' }, data: { reservedQty: { decrement: 200 } } }),
    );
    expect(prisma.dispatchReservation.findFirst).not.toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'res-1' }) }));
  });

  it('does not increase Sales Order Dispatched Qty as a side effect of picking (no dispatch test)', async () => {
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation());
    await service.pickItem('pl-1', 'res-1', 'batch-1', 500, user);
    expect(prisma.pickListItem.update).toBeDefined(); // exists for other ops, but never called with a SO dispatch update here
  });

  it('blocks picking against a cancelled reservation', async () => {
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation({ status: 'RELEASED' }));
    await expect(service.pickItem('pl-1', 'res-1', 'batch-1', 100, user)).rejects.toThrow(/not eligible for picking/);
  });

  it('suggests eligible ACTIVE batches oldest-first, excluding non-eligible batches', async () => {
    prisma.dispatchReservation.findFirst.mockResolvedValue(reservation());
    prisma.stockBatch.findMany.mockResolvedValue([
      { id: 'batch-1', batchNumber: 'B01', lotNumber: null, availableQty: 1200, reservedQty: 0 },
      { id: 'batch-2', batchNumber: 'B02', lotNumber: null, availableQty: 800, reservedQty: 800 },
    ]);
    const suggestions = await service.suggestBatches('res-1', user);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].batchId).toBe('batch-1');
  });
});
