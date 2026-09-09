import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MaterialIssueOverrideService } from './material-issue-override.service';

describe('MaterialIssueOverrideService', () => {
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
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => { record = { id: 'override-1', ...data }; return Promise.resolve(record); }),
        update: jest.fn().mockImplementation(({ data }: any) => { record = { ...(record || { id: 'override-1' }), ...data }; return Promise.resolve(record); }),
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
    it('snapshots only the PENDING items and submits to the generic approval engine', async () => {
      const r = await service.request({ workOrderId: 'wo-1', reason: 'Line stoppage, need buffer stock' } as any, user);
      expect(r.itemsSnapshot).toHaveLength(1);
      expect(r.itemsSnapshot[0].itemCode).toBe('DRIVER-01');
      expect(workflows.submit).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'MATERIAL_ISSUE_OVERRIDE' }), user,
      );
      expect(r.approvalRequestId).toBe('approval-1');
    });

    it('sets a 5-hour deadline from the moment of request', async () => {
      const before = Date.now();
      const r = await service.request({ workOrderId: 'wo-1', reason: 'test' } as any, user);
      const deadlineMs = new Date(r.deadlineAt).getTime();
      expect(deadlineMs - before).toBeGreaterThan(4.9 * 60 * 60 * 1000);
      expect(deadlineMs - before).toBeLessThan(5.1 * 60 * 60 * 1000);
    });

    it('rejects a request when the work order is already CLEAR', async () => {
      materialReturnService.getPreviousMaterialStatus.mockResolvedValue({ overallStatus: 'CLEAR', items: [] });
      await expect(service.request({ workOrderId: 'wo-1', reason: 'test' } as any, user)).rejects.toThrow(BadRequestException);
      expect(workflows.submit).not.toHaveBeenCalled();
    });

    it('rejects a second request while one is already pending for the same work order', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValue({ id: 'existing', status: 'PENDING' });
      await expect(service.request({ workOrderId: 'wo-1', reason: 'test' } as any, user)).rejects.toThrow(/already pending/);
    });

    it('throws NotFoundException for a work order that does not exist', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(null);
      await expect(service.request({ workOrderId: 'missing', reason: 'test' } as any, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('decide', () => {
    const pending = { id: 'override-1', companyId: 'company-1', status: 'PENDING', approvalRequestId: 'approval-1', deadlineAt: new Date(Date.now() + 60 * 60 * 1000) };

    it('approves via the generic engine and records the decision', async () => {
      prisma.materialIssueOverride.findFirst.mockResolvedValue(pending);
      const r = await service.decide('override-1', { action: 'APPROVED', comments: 'ok for one batch' } as any, user);
      expect(workflows.act).toHaveBeenCalledWith('approval-1', { action: 'APPROVED', comments: 'ok for one batch' }, user);
      expect(r.status).toBe('APPROVED');
      expect(r.approvedById).toBe('user-1');
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
    it('only looks for APPROVED, active, not-yet-expired overrides for the given work order', async () => {
      await service.findActiveApprovedOverride('wo-1', user);
      expect(prisma.materialIssueOverride.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ workOrderId: 'wo-1', status: 'APPROVED', isActive: true }),
      }));
    });
  });

  describe('consume', () => {
    it('marks the override CONSUMED and links the issue that used it', async () => {
      const r = await service.consume('override-1', 'issue-1', user);
      expect(r.status).toBe('CONSUMED');
      expect(r.consumedByIssueId).toBe('issue-1');
    });
  });
});
