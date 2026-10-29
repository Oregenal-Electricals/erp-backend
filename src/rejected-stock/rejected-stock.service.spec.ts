import { BadRequestException } from '@nestjs/common';
import { RejectedStockService } from './rejected-stock.service';

describe('RejectedStockService.disposeItem - the vendor return window is not optional (174_vendor_return_window_days.sql)', () => {
  let service: RejectedStockService;
  let prisma: any;
  let audit: any;
  let notifications: any;

  const futureDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
  const pastDeadline = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

  function makeRecord(item: any) {
    return { id: 'rej-1', companyId: 'company-1', status: 'QUARANTINED', items: [item] };
  }

  beforeEach(() => {
    prisma = {
      rejectedStock: { findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      rejectedStockItem: { update: jest.fn().mockResolvedValue({}) },
      company: { findMany: jest.fn().mockResolvedValue([]) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    service = new RejectedStockService(prisma, audit, notifications);
  });

  it('blocks scrapping an RTV lot before its vendor pickup deadline has passed', async () => {
    const item = { id: 'item-1', disposition: 'RTV', disposalEligible: false, vendorPickupDeadline: futureDeadline };
    prisma.rejectedStock.findFirst.mockResolvedValue(makeRecord(item));
    const user = { id: 'u1', companyId: 'company-1', role: 'PURCHASE_MANAGER' };

    await expect(
      service.disposeItem('rej-1', 'item-1', { disposition: 'SCRAPPED' } as any, user),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.rejectedStockItem.update).not.toHaveBeenCalled();
  });

  it('allows scrapping once disposalEligible has been flagged true (window already passed and flagged by the daily job)', async () => {
    const item = { id: 'item-1', disposition: 'RTV', disposalEligible: true, vendorPickupDeadline: pastDeadline };
    prisma.rejectedStock.findFirst.mockResolvedValue(makeRecord(item));
    const user = { id: 'u1', companyId: 'company-1', role: 'PURCHASE_MANAGER' };

    await service.disposeItem('rej-1', 'item-1', { disposition: 'SCRAPPED' } as any, user);
    expect(prisma.rejectedStockItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'item-1' },
      data: expect.objectContaining({ disposition: 'SCRAPPED' }),
    }));
  });

  it('allows scrapping before the deadline anyway if the deadline has actually passed, even if nobody has flagged disposalEligible yet', async () => {
    const item = { id: 'item-1', disposition: 'RTV', disposalEligible: false, vendorPickupDeadline: pastDeadline };
    prisma.rejectedStock.findFirst.mockResolvedValue(makeRecord(item));
    const user = { id: 'u1', companyId: 'company-1', role: 'PURCHASE_MANAGER' };

    await service.disposeItem('rej-1', 'item-1', { disposition: 'SCRAPPED' } as any, user);
    expect(prisma.rejectedStockItem.update).toHaveBeenCalled();
  });

  it('a SUPER_ADMIN can override the guard and scrap before the window expires', async () => {
    const item = { id: 'item-1', disposition: 'RTV', disposalEligible: false, vendorPickupDeadline: futureDeadline };
    prisma.rejectedStock.findFirst.mockResolvedValue(makeRecord(item));
    const user = { id: 'u1', companyId: 'company-1', role: 'SUPER_ADMIN' };

    await service.disposeItem('rej-1', 'item-1', { disposition: 'SCRAPPED' } as any, user);
    expect(prisma.rejectedStockItem.update).toHaveBeenCalled();
  });

  it('never blocks a non-SCRAPPED disposition (e.g. REWORK, ACCEPTED) regardless of the deadline', async () => {
    const item = { id: 'item-1', disposition: 'RTV', disposalEligible: false, vendorPickupDeadline: futureDeadline };
    prisma.rejectedStock.findFirst.mockResolvedValue(makeRecord(item));
    const user = { id: 'u1', companyId: 'company-1', role: 'PURCHASE_MANAGER' };

    await service.disposeItem('rej-1', 'item-1', { disposition: 'REWORK' } as any, user);
    expect(prisma.rejectedStockItem.update).toHaveBeenCalled();
  });

  it('never blocks an item that was never on the RTV path (e.g. already ACCEPTED)', async () => {
    const item = { id: 'item-1', disposition: 'ACCEPTED', disposalEligible: false, vendorPickupDeadline: null };
    prisma.rejectedStock.findFirst.mockResolvedValue(makeRecord(item));
    const user = { id: 'u1', companyId: 'company-1', role: 'PURCHASE_MANAGER' };

    await service.disposeItem('rej-1', 'item-1', { disposition: 'SCRAPPED' } as any, user);
    expect(prisma.rejectedStockItem.update).toHaveBeenCalled();
  });
});

describe('RejectedStockService.flagOverdueVendorReturns - the daily eligibility check (174_vendor_return_window_days.sql)', () => {
  let service: RejectedStockService;
  let prisma: any;
  let audit: any;
  let notifications: any;

  beforeEach(() => {
    prisma = {
      company: { findMany: jest.fn().mockResolvedValue([{ id: 'company-1' }]) },
      rejectedStockItem: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({}),
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    service = new RejectedStockService(prisma, audit, notifications);
  });

  it('does nothing when no lot is overdue', async () => {
    await service.flagOverdueVendorReturns();
    expect(prisma.rejectedStockItem.updateMany).not.toHaveBeenCalled();
    expect(notifications.createBulk).not.toHaveBeenCalled();
  });

  it('flips disposalEligible and notifies SUPER_ADMIN/ADMIN for an overdue RTV lot, only once (filters on disposalEligible: false)', async () => {
    prisma.rejectedStockItem.findMany.mockResolvedValue([
      { id: 'item-1', itemCode: 'RM-01', rejectedQty: 20, rejectedStock: { rejectionNumber: 'REJ-2026-0001' } },
    ]);
    prisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);

    await service.flagOverdueVendorReturns();

    expect(prisma.rejectedStockItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['item-1'] } },
      data: { disposalEligible: true },
    });

    // confirms the query itself only ever selects disposalEligible: false
    // rows, which is what makes re-running this job daily never
    // re-notify for the same lot once it's been flagged
    expect(prisma.rejectedStockItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ disposition: 'RTV', disposalEligible: false }),
    }));

    expect(notifications.createBulk).toHaveBeenCalledTimes(1);
    const [notifs] = notifications.createBulk.mock.calls[0];
    expect(notifs[0].message).toContain('REJ-2026-0001');
    expect(notifs[0].priority).toBe('HIGH');
  });

  it('skips notifying (but still flips the flag) when no SUPER_ADMIN/ADMIN user exists for that company', async () => {
    prisma.rejectedStockItem.findMany.mockResolvedValue([{ id: 'item-1', itemCode: 'RM-01', rejectedQty: 5, rejectedStock: { rejectionNumber: 'REJ-2026-0002' } }]);
    prisma.user.findMany.mockResolvedValue([]);

    await service.flagOverdueVendorReturns();

    expect(prisma.rejectedStockItem.updateMany).toHaveBeenCalled();
    expect(notifications.createBulk).not.toHaveBeenCalled();
  });

  it('never auto-creates a Scrap/disposition record - only flags eligibility, leaving the actual scrap action to a human', async () => {
    prisma.rejectedStockItem.findMany.mockResolvedValue([{ id: 'item-1', itemCode: 'RM-01', rejectedQty: 5, rejectedStock: { rejectionNumber: 'REJ-2026-0003' } }]);
    prisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);

    await service.flagOverdueVendorReturns();

    const updateCall = prisma.rejectedStockItem.updateMany.mock.calls[0][0];
    expect(updateCall.data).toEqual({ disposalEligible: true });
    expect(updateCall.data.disposition).toBeUndefined();
  });
});
