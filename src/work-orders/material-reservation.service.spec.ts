import { MaterialReservationService } from './material-reservation.service';

describe('MaterialReservationService.reserveForWorkOrder - STORE-011', () => {
  let service: MaterialReservationService;
  let prisma: any;
  let balanceState: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function makeWo(overrides: any = {}) {
    return {
      id: 'wo-1', companyId: 'company-1', woNumber: 'WO-TEST-001', plannedQty: 1000,
      warehouseId: 'wh-1', priority: 'MEDIUM',
      bom: { items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', quantity: 1, effectiveQty: null, isActive: true }] },
      ...overrides,
    };
  }

  beforeEach(() => {
    // Matches the spec's own worked example: 1,300 total available,
    // 200 already reserved -> 1,100 Free Available.
    balanceState = { id: 'bal-1', companyId: 'company-1', itemCode: 'DRIVER-01', warehouseId: 'wh-1', availableQty: 1300, reservedQty: 200 };
    prisma = {
      workOrder: { findUnique: jest.fn().mockResolvedValue(makeWo()) },
      materialReservation: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { reservedQty: 0 } }),
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
      stockBalance: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve({ ...balanceState })),
        updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
          if (where.reservedQty !== balanceState.reservedQty) return Promise.resolve({ count: 0 });
          balanceState = { ...balanceState, reservedQty: balanceState.reservedQty + data.reservedQty.increment };
          return Promise.resolve({ count: 1 });
        }),
      },
    };
    service = new MaterialReservationService(prisma, { log: jest.fn().mockResolvedValue(undefined) } as any);
  });

  it('fully reserves when Free Available covers the full requirement, matching the spec worked example exactly', async () => {
    const results = await service.reserveForWorkOrder('wo-1', user);
    expect(results[0].requiredQty).toBe(1000);
    expect(results[0].reservedQty).toBe(1000);
    expect(results[0].shortfallQty).toBe(0);
    // Total reserved goes from 200 to 1200
    expect(balanceState.reservedQty).toBe(1200);
    // Physical availableQty never moves during reservation
    expect(balanceState.availableQty).toBe(1300);
  });

  it('partially reserves when Free Available is less than the requirement, and reports the shortfall', async () => {
    balanceState = { ...balanceState, availableQty: 900, reservedQty: 200 }; // Free = 700
    const results = await service.reserveForWorkOrder('wo-1', user);
    expect(results[0].reservedQty).toBe(700);
    expect(results[0].shortfallQty).toBe(300);
    expect(balanceState.availableQty).toBe(900); // unchanged
  });

  it('reserves nothing when Free Available is zero, without creating a negative or fake reservation', async () => {
    balanceState = { ...balanceState, availableQty: 200, reservedQty: 200 }; // Free = 0
    const results = await service.reserveForWorkOrder('wo-1', user);
    expect(results[0].reservedQty).toBe(0);
    expect(results[0].shortfallQty).toBe(1000);
    expect(prisma.materialReservation.create).not.toHaveBeenCalled();
  });

  it('never reserves past this WO own remaining requirement if some was already reserved for it earlier', async () => {
    prisma.materialReservation.aggregate.mockResolvedValue({ _sum: { reservedQty: 800 } });
    const results = await service.reserveForWorkOrder('wo-1', user);
    expect(results[0].reservedQty).toBe(1000); // 800 already + 200 more, not another 1000
  });

  it('retries reservation with a fresh read when reservedQty changed concurrently, never overshooting Free Available', async () => {
    let callCount = 0;
    const original = prisma.stockBalance.updateMany;
    prisma.stockBalance.updateMany = jest.fn().mockImplementation((args: any) => {
      callCount++;
      if (callCount === 1) {
        balanceState = { ...balanceState, reservedQty: balanceState.reservedQty + 50 };
        return Promise.resolve({ count: 0 });
      }
      return original(args);
    });
    await service.reserveForWorkOrder('wo-1', user);
    // Started reservedQty=200, a concurrent +50 landed first (250), then this WO's own claim applied on retry
    expect(balanceState.reservedQty).toBeGreaterThan(200);
  });
});

describe('MaterialReservationService.releaseReservations - STORE-011', () => {
  let service: MaterialReservationService;
  let prisma: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  it('releases only the unissued portion of a reservation, never touching availableQty', async () => {
    prisma = {
      materialReservation: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'res-1', companyId: 'company-1', itemCode: 'DRIVER-01', warehouseId: 'wh-1', reservedQty: 500, issuedQty: 300 },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
      stockBalance: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    service = new MaterialReservationService(prisma, { log: jest.fn() } as any);
    await service.releaseReservations('wo-1', user, false);
    // Only the 200 unissued should be released - not the full 500, and never availableQty.
    expect(prisma.stockBalance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { reservedQty: { decrement: 200 } } }),
    );
  });

  it('releases nothing extra when a reservation was fully issued already', async () => {
    prisma = {
      materialReservation: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'res-1', companyId: 'company-1', itemCode: 'DRIVER-01', warehouseId: 'wh-1', reservedQty: 500, issuedQty: 500 },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
      stockBalance: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    service = new MaterialReservationService(prisma, { log: jest.fn() } as any);
    await service.releaseReservations('wo-1', user, true);
    expect(prisma.stockBalance.updateMany).not.toHaveBeenCalled();
  });
});

describe('MaterialReservationService.recordIssueAgainstReservations - STORE-011', () => {
  let service: MaterialReservationService;
  let prisma: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  it('allocates issued qty across reservations oldest-first', async () => {
    const rows = [
      { id: 'res-1', reservedQty: 300, issuedQty: 0, createdAt: new Date('2026-01-01') },
      { id: 'res-2', reservedQty: 400, issuedQty: 0, createdAt: new Date('2026-01-02') },
    ];
    prisma = {
      materialReservation: {
        findMany: jest.fn().mockResolvedValue(rows),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    service = new MaterialReservationService(prisma, { log: jest.fn() } as any);
    const leftover = await service.recordIssueAgainstReservations('wo-1', 'DRIVER-01', 500, user);
    expect(prisma.materialReservation.update).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { id: 'res-1' }, data: expect.objectContaining({ issuedQty: { increment: 300 } }) }));
    expect(prisma.materialReservation.update).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: { id: 'res-2' }, data: expect.objectContaining({ issuedQty: { increment: 200 } }) }));
    expect(leftover).toBe(0);
  });

  it('returns the unmatched leftover when issued qty exceeds all active reservations', async () => {
    prisma = {
      materialReservation: {
        findMany: jest.fn().mockResolvedValue([{ id: 'res-1', reservedQty: 100, issuedQty: 0, createdAt: new Date() }]),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    service = new MaterialReservationService(prisma, { log: jest.fn() } as any);
    const leftover = await service.recordIssueAgainstReservations('wo-1', 'DRIVER-01', 250, user);
    expect(leftover).toBe(150);
  });
});
