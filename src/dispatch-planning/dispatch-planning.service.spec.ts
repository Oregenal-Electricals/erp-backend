import { DispatchPlanningService } from './dispatch-planning.service';
import { BadRequestException } from '@nestjs/common';

describe('DispatchPlanningService - DSP-004', () => {
  let service: DispatchPlanningService;
  let prisma: any;
  let audit: any;
  let soService: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function soItem(overrides: any = {}) {
    return {
      id: 'so-item-1', itemCode: 'LED-DRIVER-01', itemName: 'LED Driver',
      pendingQty: 5000, uom: 'PCS', saleType: 'RM', requiredStageId: null,
      releasedForDispatch: true, sourceValid: true, sourceType: 'RM_INVENTORY', sourcePlantId: 'plant-1',
      ...overrides,
    };
  }

  function makeSo(items: any[]) {
    return { id: 'so-1', companyId: 'company-1', customerName: 'ABC Corp', status: 'CONFIRMED', items };
  }

  function dto(items: any[], overrides: any = {}) {
    return {
      soId: 'so-1', plannedDate: '2026-12-01',
      items: items.map(i => ({ soItemId: i.id, itemCode: i.itemCode, itemName: i.itemName, plannedQty: i._planQty, uom: i.uom })),
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      salesOrder: { findFirst: jest.fn() },
      dispatchPlan: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'plan-1', ...data, items: data.items.create })) },
      dispatchPlanItem: { aggregate: jest.fn().mockResolvedValue({ _sum: { plannedQty: 0 } }) },
      $transaction: jest.fn().mockImplementation((cb: any) => cb(prisma)),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    soService = { checkAvailability: jest.fn().mockResolvedValue({ freeQty: 10000, checkedAt: new Date() }) };
    service = new DispatchPlanningService(prisma, audit, soService);
  });

  it('creates an RM plan line auto-filled from the released SO line, marked READY_FOR_RESERVATION when free stock covers it', async () => {
    const item = soItem({ _planQty: 2000 });
    prisma.salesOrder.findFirst.mockResolvedValue(makeSo([item]));
    const plan = await service.create(dto([item]), user);
    expect(plan.items[0].saleType).toBe('RM');
    expect(plan.items[0].sourceType).toBe('RM_INVENTORY');
    expect(plan.items[0].lineStatus).toBe('READY_FOR_RESERVATION');
  });

  it('marks a plan line STOCK_PENDING when planned qty exceeds current free stock, without blocking creation', async () => {
    soService.checkAvailability.mockResolvedValue({ freeQty: 500, checkedAt: new Date() });
    const item = soItem({ _planQty: 2000 });
    prisma.salesOrder.findFirst.mockResolvedValue(makeSo([item]));
    const plan = await service.create(dto([item]), user);
    expect(plan.items[0].lineStatus).toBe('STOCK_PENDING');
    expect(plan.items[0].availableSnapshot).toBe(500);
  });

  it('preserves the exact SFG stage on the plan line, never lets it be re-typed', async () => {
    const item = soItem({ _planQty: 2400, saleType: 'SFG', requiredStageId: 'stage-mi', sourceType: 'SFG_STAGE' });
    prisma.salesOrder.findFirst.mockResolvedValue(makeSo([item]));
    const plan = await service.create(dto([item]), user);
    expect(plan.items[0].requiredStageId).toBe('stage-mi');
    expect(plan.items[0].sourceType).toBe('SFG_STAGE');
  });

  it('blocks a plan line whose SO item was never released for Dispatch with a valid source (DSP-002 boundary)', async () => {
    const item = soItem({ _planQty: 1000, releasedForDispatch: false });
    prisma.salesOrder.findFirst.mockResolvedValue(makeSo([item]));
    await expect(service.create(dto([item]), user)).rejects.toThrow(/has not been released for Dispatch/);
  });

  it('blocks a plan exceeding the SO line\'s remaining demand (test scenario 69)', async () => {
    const item = soItem({ _planQty: 6000, pendingQty: 5000 });
    prisma.salesOrder.findFirst.mockResolvedValue(makeSo([item]));
    await expect(service.create(dto([item]), user)).rejects.toThrow(BadRequestException);
  });

  it('CRITICAL: blocks a second plan once active plans already cover the remaining SO demand, even though raw pendingQty alone would have allowed it (sections 46-51, 80)', async () => {
    // pendingQty is still the full 8,000 (Plan A hasn't been dispatched,
    // just planned) - the real ceiling is pendingQty minus what OTHER
    // active plans already claim, which the old code never checked.
    const item = soItem({ _planQty: 3000, pendingQty: 8000 });
    prisma.salesOrder.findFirst.mockResolvedValue(makeSo([item]));
    // Simulate Plan A (6,000) and Plan B (2,000) already active against
    // this same line - active planned = 8,000, unplanned remaining = 0.
    prisma.dispatchPlanItem.aggregate.mockResolvedValue({ _sum: { plannedQty: 8000 } });
    await expect(service.create(dto([item]), user)).rejects.toThrow(/exceeds unplanned remaining demand 0/);
  });

  it('allows a plan up to exactly the unplanned remaining after other active plans (test scenario 49)', async () => {
    const item = soItem({ _planQty: 3000, pendingQty: 8000 });
    prisma.salesOrder.findFirst.mockResolvedValue(makeSo([item]));
    prisma.dispatchPlanItem.aggregate.mockResolvedValue({ _sum: { plannedQty: 5000 } });
    const plan = await service.create(dto([item]), user);
    expect(plan.items[0].plannedQty).toBe(3000);
  });

  it('supports one plan mixing RM, SFG, and FG lines, each retaining its own sale type and source (section 24, 76)', async () => {
    const rm = soItem({ id: 'i-rm', _planQty: 1000, saleType: 'RM', sourceType: 'RM_INVENTORY' });
    const sfg = soItem({ id: 'i-sfg', _planQty: 2000, saleType: 'SFG', requiredStageId: 'stage-mi', sourceType: 'SFG_STAGE' });
    const fg = soItem({ id: 'i-fg', _planQty: 3000, saleType: 'FG', sourceType: 'FG_INVENTORY' });
    prisma.salesOrder.findFirst.mockResolvedValue(makeSo([rm, sfg, fg]));
    const plan = await service.create(dto([rm, sfg, fg]), user);
    expect(plan.items.map((i: any) => i.saleType)).toEqual(['RM', 'SFG', 'FG']);
  });

  it('creates no inventory reservation or stock movement as a side effect of planning (sections 13-14, 74)', async () => {
    const item = soItem({ _planQty: 1000 });
    prisma.salesOrder.findFirst.mockResolvedValue(makeSo([item]));
    await service.create(dto([item]), user);
    expect(prisma.stockBalance).toBeUndefined();
    expect(prisma.workOrder).toBeUndefined();
  });

  it('does not increase Sales Order dispatched qty when creating a plan (section 73)', async () => {
    const item = soItem({ _planQty: 1000 });
    prisma.salesOrder.findFirst.mockResolvedValue(makeSo([item]));
    await service.create(dto([item]), user);
    expect(prisma.salesOrder.update).toBeUndefined();
  });

  it('cancelling a plan does not touch the Sales Order (section 45, 72)', async () => {
    prisma.dispatchPlan.findFirst = jest.fn().mockResolvedValue({ id: 'plan-1', status: 'DRAFT', companyId: 'company-1' });
    prisma.dispatchPlan.update = jest.fn().mockResolvedValue({ id: 'plan-1', status: 'CANCELLED' });
    await service.cancel('plan-1', { cancelReason: 'Customer requested hold' }, user);
    expect(prisma.salesOrder.update).toBeUndefined();
  });
});
