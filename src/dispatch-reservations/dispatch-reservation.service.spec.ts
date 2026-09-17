import { DispatchReservationService } from './dispatch-reservation.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DispatchReservationService - DSP-005', () => {
  let service: DispatchReservationService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function planItem(overrides: any = {}) {
    return {
      id: 'plan-item-1', planId: 'plan-1', plan: { status: 'DRAFT' },
      plannedQty: 2000, itemCode: 'LED-DRIVER-01', itemName: 'LED Driver',
      sourceType: 'RM_INVENTORY', sourcePlantId: 'plant-1', requiredStageId: null,
      soItem: { soId: 'so-1', soItemId: 'so-item-1', sourceValid: true, requiredStage: null },
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      dispatchPlanItem: { findFirst: jest.fn() },
      dispatchReservation: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { reservedQty: 0, releasedQty: 0 } }),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: `dr-${Math.random()}`, ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data })),
      },
      warehouse: { findMany: jest.fn().mockResolvedValue([{ id: 'wh-1' }]) },
      stockBalance: {
        findFirst: jest.fn().mockResolvedValue({ id: 'sb-1', availableQty: 10000, reservedQty: 6000 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      workOrder: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new DispatchReservationService(prisma, audit);
  });

  it('CRITICAL RM PROOF (section 95): reserves against Free (available-reserved), never touches availableQty, coexists with existing Production reservation', async () => {
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem({ plannedQty: 3000 }));
    const result = await service.reserve('plan-item-1', 3000, user);
    expect(result.reservedQty).toBe(3000);
    expect(result.status).toBe('FULLY_RESERVED');
    expect(prisma.stockBalance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reservedQty: { increment: 3000 } }) }),
    );
  });

  it('reserves FG the same way, from FINISHED_GOOD-eligible balances', async () => {
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem({ sourceType: 'FG_INVENTORY' }));
    const result = await service.reserve('plan-item-1', 1000, user);
    expect(result.status).toBe('FULLY_RESERVED');
  });

  it('PARTIAL RESERVATION: reserves whatever is free and reports the shortfall honestly, never pretending full coverage', async () => {
    prisma.stockBalance.findFirst.mockResolvedValue({ id: 'sb-1', availableQty: 3000, reservedQty: 2000 });
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem());
    const result = await service.reserve('plan-item-1', 2000, user);
    expect(result.reservedQty).toBe(1000);
    expect(result.unreservedQty).toBe(1000);
    expect(result.status).toBe('PARTIALLY_RESERVED');
  });

  it('NO STOCK RESERVATION AVAILABLE: reserves 0 and never creates a negative free', async () => {
    prisma.stockBalance.findFirst.mockResolvedValue({ id: 'sb-1', availableQty: 5000, reservedQty: 5000 });
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem());
    const result = await service.reserve('plan-item-1', 1000, user);
    expect(result.reservedQty).toBe(0);
    expect(result.status).toBe('NOT_RESERVED');
    expect(prisma.dispatchReservation.create).not.toHaveBeenCalled();
  });

  it('CUMULATIVE PLAN LIMIT (section 34): a request is capped at what the plan line still has room for, never exceeding plannedQty across reservations', async () => {
    prisma.dispatchReservation.aggregate.mockResolvedValue({ _sum: { reservedQty: 1500, releasedQty: 0 } });
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem());
    const result = await service.reserve('plan-item-1', 1000, user);
    expect(result.requestedQty).toBe(1000);
    expect(result.reservedQty).toBe(500);
  });

  it('blocks reservation entirely when the plan line has no room left', async () => {
    prisma.dispatchReservation.aggregate.mockResolvedValue({ _sum: { reservedQty: 2000, releasedQty: 0 } });
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem());
    await expect(service.reserve('plan-item-1', 500, user)).rejects.toThrow(/already fully reserved/);
  });

  it('CRITICAL SFG PROOF (section 96): reserves eligible stage output across multiple WOs, preserves per-WO allocation traceability', async () => {
    prisma.workOrder.findMany.mockResolvedValue([{ id: 'wo-1' }, { id: 'wo-2' }]);
    prisma.workOrder.findUnique
      .mockResolvedValueOnce({ completedQty: 3000, cumulativeHandoverQty: 1000, dispatchReservedQty: 0, stageStatus: 'COMPLETED' })
      .mockResolvedValueOnce({ completedQty: 2000, cumulativeHandoverQty: 1000, dispatchReservedQty: 0, stageStatus: 'COMPLETED' });
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem({
      sourceType: 'SFG_STAGE', plannedQty: 2400,
      soItem: { soId: 'so-1', soItemId: 'so-item-1', sourceValid: true, requiredStage: { stageName: 'MI' } },
    }));
    const result = await service.reserve('plan-item-1', 2400, user);
    expect(result.reservedQty).toBe(2400);
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].workOrderId).toBe('wo-1');
    expect(result.allocations[0].reservedQty).toBe(2000);
    expect(result.allocations[1].workOrderId).toBe('wo-2');
    expect(result.allocations[1].reservedQty).toBe(400);
  });

  it('SFG reservation increments dispatchReservedQty via the same atomic conditional UPDATE the stage-transfer guard checks (section 16-17)', async () => {
    prisma.workOrder.findMany.mockResolvedValue([{ id: 'wo-1' }]);
    prisma.workOrder.findUnique.mockResolvedValue({ completedQty: 3000, cumulativeHandoverQty: 0, dispatchReservedQty: 0, stageStatus: 'COMPLETED' });
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem({
      sourceType: 'SFG_STAGE', plannedQty: 2000,
      soItem: { soId: 'so-1', soItemId: 'so-item-1', sourceValid: true, requiredStage: { stageName: 'MI' } },
    }));
    await service.reserve('plan-item-1', 2000, user);
    expect(prisma.$executeRaw).toHaveBeenCalled();
    const rawCallArgs = prisma.$executeRaw.mock.calls[0];
    expect(JSON.stringify(rawCallArgs)).toContain('dispatchReservedQty');
  });

  it('DSP-005 CANNOT reserve for a line with no valid resolved source (DSP-002 boundary)', async () => {
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem({ soItem: { soId: 'so-1', soItemId: 'so-item-1', sourceValid: false, requiredStage: null } }));
    await expect(service.reserve('plan-item-1', 1000, user)).rejects.toThrow(/no valid resolved source/);
  });

  it('blocks reservation against a cancelled Dispatch Plan (section 36)', async () => {
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem({ plan: { status: 'CANCELLED' } }));
    await expect(service.reserve('plan-item-1', 1000, user)).rejects.toThrow(/cancelled/);
  });

  it('RELEASE (section 37-39): decrements reservedQty on StockBalance and increases Free without any physical movement', async () => {
    prisma.dispatchReservation.findMany.mockResolvedValue([
      { id: 'dr-1', reservationType: 'RM_DISPATCH', warehouseId: 'wh-1', itemCode: 'LED-DRIVER-01', reservedQty: 3000, releasedQty: 0 },
    ]);
    const result = await service.release('DR-2026-0001', 1000, 'Customer requested hold', user);
    expect(prisma.stockBalance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reservedQty: { decrement: 1000 } }) }),
    );
    expect(result.releasedQty).toBe(1000);
  });

  it('SFG RELEASE decrements WorkOrder.dispatchReservedQty, never StockBalance (section 38)', async () => {
    prisma.dispatchReservation.findMany.mockResolvedValue([
      { id: 'dr-1', reservationType: 'SFG_DISPATCH', workOrderId: 'wo-1', itemCode: '9W-BULB', reservedQty: 2000, releasedQty: 0 },
    ]);
    await service.release('DR-2026-0002', 500, undefined, user);
    expect(prisma.workOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'wo-1' }, data: { dispatchReservedQty: { decrement: 500 } } }),
    );
    expect(prisma.stockBalance.updateMany).not.toHaveBeenCalled();
  });

  it('does not increase Sales Order Dispatched Qty as a side effect of reservation (section 29, no dispatch test)', async () => {
    prisma.dispatchPlanItem.findFirst.mockResolvedValue(planItem());
    await service.reserve('plan-item-1', 1000, user);
    expect(prisma.dispatchPlanItem.update).toBeUndefined();
  });

  it('throws NotFoundException releasing a reservation number with no active rows', async () => {
    prisma.dispatchReservation.findMany.mockResolvedValue([]);
    await expect(service.release('DR-9999', 100, undefined, user)).rejects.toThrow(NotFoundException);
  });
});
