import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MaterialIssueOverrideService } from './material-issue-override.service';

describe('MaterialIssueOverrideService - STORE-012 quantity-tracked partial approval', () => {
  let service: MaterialIssueOverrideService;
  let prisma: any;
  let audit: any;
  let workflows: any;
  let materialReturnService: any;

  const user = { id: 'user-1', companyId: 'company-1' };
  const wo = { id: 'wo-1', companyId: 'company-1' };
  const pendingStatus = {
    overallStatus: 'PENDING',
    items: [
      { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', outstandingQty: 50, status: 'PENDING' },
      { itemCode: 'PCB-01', itemName: 'PCB', uom: 'PCS', outstandingQty: 0, status: 'CLEAR' },
    ],
  };

  beforeEach(() => {
    let record: any = null;
    prisma = {
      workOrder: { findFirst: jest.fn().mockResolvedValue(wo) },
      materialIssueOverride: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(record ? { ...record } : null)),
        create: jest.fn().mockImplementation(({ data }: any) => { record = { id: 'override-1', ...data }; return Promise.resolve(record); }),
        update: jest.fn().mockImplementation(({ data }: any) => { record = { ...(record || { id: 'override-1' }), ...data }; return Promise.resolve(record); }),
        updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
          if (!record) return Promise.resolve({ count: 0 });
          if (where.usedQty !== undefined && where.usedQty !== record.usedQty) return Promise.resolve({ count: 0 });
          record = { ...record, ...data };
          return Promise.resolve({ count: 1 });
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    workflows = {
      submit: jest.fn().mockResolvedValue({ requiresApproval: true, request: { id: 'approval-1' } }),
      act: jest.fn().mockResolvedValue({}),
    };
    materialReturnService = { getPreviousMaterialStatus: jest.fn().mockResolvedValue(pendingStatus) };
    service = new MaterialIssueOverrideService(prisma, audit, workflows, materialReturnService);
  });

  describe('request', () => {
    const dto = { workOrderId: 'wo-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', requestedQty: 300, reason: 'Line stoppage, need buffer stock' };

    it('captures the requested qty and snapshots only that item', async () => {
      const r = await service.request(dto as any, user);
      expect(r.requestedQty).toBe(300);
      expect(r.itemCode).toBe('DRIVER-01');
      expect(r.itemsSnapshot).toHaveLength(1);
      expect(r.itemsSnapshot[0].itemCode).toBe('DRIVER-01');
      expect(workflows.submit).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'MATERIAL_ISSUE_OVERRIDE' }), user,
      );
      expect(r.approvalRequestId).toBe('approval-1');
    });

    it('sets a 5-hour deadline from the moment of request', async () => {
      const before = Date.now();
      const r = await service.request(dto as any, user);
      const deadlineMs = new Date(r.deadlineAt).getTime();
      expect(deadlineMs - before).toBeGreaterThan(4.9 * 60 * 60 * 1000);
      expect(deadlineMs - before).toBeLessThan(5.1 * 60 * 60 * 1000);
    });

    it('rejects a request when this specific item is already CLEAR, even if another item on the WO is PENDING', async () => {
      await expect(service.request({ ...dto, itemCode: 'PCB-01' } as any, user)).rejects.toThrow(BadRequestException);
      expect(workflows.submit).not.toHaveBeenCalled();
    });

    it('rejects a second request while one is already pending for the same work order and item', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValueOnce({ id: 'existing', status: 'PENDING' });
      await expect(service.request(dto as any, user)).rejects.toThrow(/already pending/);
    });

    it('throws NotFoundException for a work order that does not exist', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(null);
      await expect(service.request({ ...dto, workOrderId: 'missing' } as any, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('decide', () => {
    const pending = { id: 'override-1', companyId: 'company-1', status: 'PENDING', approvalRequestId: 'approval-1', requestedQty: 500, usedQty: 0, deadlineAt: new Date(Date.now() + 60 * 60 * 1000) };

    it('approves at the full requested qty when no approvedQty is given', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValue(pending);
      const r = await service.decide('override-1', { action: 'APPROVED', comments: 'ok' } as any, user);
      expect(r.approvedQty).toBe(500);
      expect(r.status).toBe('APPROVED');
    });

    it('supports partial approval - approvedQty less than requestedQty', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValue(pending);
      const r = await service.decide('override-1', { action: 'APPROVED', approvedQty: 300 } as any, user);
      expect(r.approvedQty).toBe(300);
    });

    it('blocks approving more than what was requested', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValue(pending);
      await expect(service.decide('override-1', { action: 'APPROVED', approvedQty: 600 } as any, user)).rejects.toThrow(/cannot exceed the requested quantity/);
    });

    it('rejects a decision on an already-decided request', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValue({ ...pending, status: 'APPROVED' });
      await expect(service.decide('override-1', { action: 'REJECTED' } as any, user)).rejects.toThrow(/already APPROVED/);
    });

    it('auto-expires and blocks a decision made past the 5-hour deadline', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValue({ ...pending, deadlineAt: new Date(Date.now() - 1000) });
      await expect(service.decide('override-1', { action: 'APPROVED' } as any, user)).rejects.toThrow(/expired/);
      expect(prisma.materialIssueOverride.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'EXPIRED' }) }));
      expect(workflows.act).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a request that does not exist', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValue(null);
      await expect(service.decide('missing', { action: 'APPROVED' } as any, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActiveApprovedOverride', () => {
    it('only returns an APPROVED, active, not-yet-expired override with remaining capacity, for the given WO and item', async () => {
      prisma.materialIssueOverride.findMany.mockResolvedValue([
        { id: 'o1', approvedQty: 300, usedQty: 300 }, // fully used - excluded
        { id: 'o2', approvedQty: 300, usedQty: 100 }, // has capacity
      ]);
      const r = await service.findActiveApprovedOverride('wo-1', 'DRIVER-01', user);
      expect(r.id).toBe('o2');
      expect(prisma.materialIssueOverride.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ workOrderId: 'wo-1', itemCode: 'DRIVER-01', status: 'APPROVED', isActive: true }),
      }));
    });

    it('returns null when no candidate has remaining capacity', async () => {
      prisma.materialIssueOverride.findMany.mockResolvedValue([{ id: 'o1', approvedQty: 300, usedQty: 300 }]);
      const r = await service.findActiveApprovedOverride('wo-1', 'DRIVER-01', user);
      expect(r).toBeNull();
    });
  });

  describe('consume - partial use and cumulative tracking', () => {
    beforeEach(() => {
      prisma.materialIssueOverride.findFirst.mockImplementation(() => Promise.resolve({ id: 'override-1', status: 'APPROVED', approvedQty: 300, usedQty: 0 }));
      prisma.materialIssueOverride.updateMany.mockResolvedValue({ count: 1 });
    });

    it('claims exactly the requested qty and stays APPROVED when capacity remains', async () => {
      const claimed = await service.consume('override-1', 'issue-1', 200, user);
      expect(claimed).toBe(200);
    });

    it('marks CONSUMED only once usedQty reaches approvedQty', async () => {
      await service.consume('override-1', 'issue-1', 300, user);
      expect(prisma.materialIssueOverride.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'CONSUMED', consumedByIssueId: 'issue-1' }),
      }));
    });

    it('does not mark CONSUMED when only partially used', async () => {
      await service.consume('override-1', 'issue-1', 200, user);
      expect(prisma.materialIssueOverride.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED' }),
      }));
    });

    it('a second partial use after a first correctly tracks cumulative usedQty', async () => {
      prisma.materialIssueOverride.findFirst
        .mockResolvedValueOnce({ id: 'override-1', status: 'APPROVED', approvedQty: 300, usedQty: 0 })
        .mockResolvedValueOnce({ id: 'override-1', status: 'APPROVED', approvedQty: 300, usedQty: 200 });
      const first = await service.consume('override-1', 'issue-1', 200, user);
      const second = await service.consume('override-1', 'issue-2', 100, user);
      expect(first).toBe(200);
      expect(second).toBe(100);
    });

    it('never claims more than the remaining capacity, even if wantQty exceeds it', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValue({ id: 'override-1', status: 'APPROVED', approvedQty: 300, usedQty: 250 });
      const claimed = await service.consume('override-1', 'issue-1', 100, user);
      expect(claimed).toBe(50);
    });

    it('returns 0 when the override is not (or no longer) APPROVED', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValue({ id: 'override-1', status: 'CONSUMED', approvedQty: 300, usedQty: 300 });
      const claimed = await service.consume('override-1', 'issue-1', 50, user);
      expect(claimed).toBe(0);
    });

    it('retries with a fresh read when usedQty changed concurrently between read and write', async () => {
      let callCount = 0;
      const original = prisma.materialIssueOverride.updateMany;
      prisma.materialIssueOverride.updateMany = jest.fn().mockImplementation((args: any) => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ count: 0 }); // simulate a concurrent conflict
        return original(args);
      });
      const claimed = await service.consume('override-1', 'issue-1', 100, user);
      expect(claimed).toBe(100);
      expect(callCount).toBeGreaterThan(1);
    });
  });
});
