import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OvertimeRequestService } from './overtime-request.service';

describe('OvertimeRequestService — Production Recording point 1: Overtime pre-authorization', () => {
  let service: OvertimeRequestService;
  let prisma: any;
  let audit: any;
  let settings: any;
  let workflows: any;
  const user = { id: 'user-1', companyId: 'company-1', role: 'STAGE_SUPERVISOR' };

  const wo = { id: 'wo-smt', companyId: 'company-1', woNumber: 'WO-2026-0001-SMT' };

  beforeEach(() => {
    prisma = {
      workOrder: { findFirst: jest.fn().mockResolvedValue(wo) },
      overtimeRequest: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    settings = {
      getSettingValue: jest.fn((key: string, def: string) => {
        if (key === 'STANDARD_LABOUR_RATE_PER_SHIFT') return Promise.resolve('120');
        if (key === 'STANDARD_SHIFT_HOURS') return Promise.resolve('8');
        if (key === 'STANDARD_OT_MULTIPLIER') return Promise.resolve('1.5');
        return Promise.resolve(def);
      }),
    };
    workflows = { submit: jest.fn().mockResolvedValue(undefined) };
    service = new OvertimeRequestService(prisma, audit, settings, workflows);
  });

  describe('create()', () => {
    it('snapshots the labour rate and OT multiplier, estimates the cost, numbers the request, and submits it to the workflow engine', async () => {
      prisma.overtimeRequest.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'ot-1', ...data }));

      const request = await service.create({
        workOrderId: 'wo-smt', shiftDate: '2026-05-10', requestedMenCount: 5, requestedHours: 2, reason: 'Rush order from Havells',
      } as any, user);

      expect(request.requestNumber).toBe(`OT-${new Date().getFullYear()}-0001`);
      expect(request.labourRateSnapshot).toBe(15); // 120/8
      expect(request.otMultiplierSnapshot).toBe(1.5);
      // 5 men x 2 hrs x ₹15 x 1.5 = ₹225
      expect(request.estimatedOtCost).toBe(225);
      expect(request.status).toBe('PENDING_APPROVAL');

      expect(prisma.workOrder.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'wo-smt', companyId: 'company-1' } }),
      );
      expect(workflows.submit).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'OVERTIME_REQUEST', documentId: 'ot-1', documentNumber: request.requestNumber, amount: 225 }),
        user,
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'overtime_requests', action: 'CREATE' }));
    });

    it('rejects a request against a work order that does not exist (or belongs to another company)', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ workOrderId: 'wo-other', shiftDate: '2026-05-10', requestedMenCount: 5, requestedHours: 2, reason: 'x' } as any, user),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.overtimeRequest.create).not.toHaveBeenCalled();
    });

    it('estimatedOtCost/labourRateSnapshot stay null when no labour rate is configured, rather than a misleading ₹0 estimate', async () => {
      settings.getSettingValue = jest.fn((key: string, def: string) => Promise.resolve(key === 'STANDARD_LABOUR_RATE_PER_SHIFT' ? '0' : def));
      prisma.overtimeRequest.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'ot-1', ...data }));

      const request = await service.create({
        workOrderId: 'wo-smt', shiftDate: '2026-05-10', requestedMenCount: 5, requestedHours: 2, reason: 'x',
      } as any, user);

      expect(request.labourRateSnapshot).toBeNull();
      expect(request.estimatedOtCost).toBeNull();
    });
  });

  describe('adjust()', () => {
    const pending = { id: 'ot-1', companyId: 'company-1', status: 'PENDING_APPROVAL', requestedMenCount: 5, requestedHours: 2, approvedMenCount: null, approvedHours: null };

    it('Management narrows the approved men/hours before approving, and stamps who/when', async () => {
      prisma.overtimeRequest.findFirst.mockResolvedValue(pending);
      prisma.overtimeRequest.update.mockImplementation(({ data }: any) => Promise.resolve({ ...pending, ...data }));
      const admin = { id: 'admin-1', companyId: 'company-1' };

      const updated = await service.adjust('ot-1', { approvedMenCount: 3, approvedHours: 1.5 } as any, admin);

      expect(updated.approvedMenCount).toBe(3);
      expect(updated.approvedHours).toBe(1.5);
      expect(updated.adjustedById).toBe('admin-1');
      expect(updated.adjustedAt).toBeInstanceOf(Date);
    });

    it('refuses to adjust a request that is no longer PENDING_APPROVAL', async () => {
      prisma.overtimeRequest.findFirst.mockResolvedValue({ ...pending, status: 'APPROVED' });

      await expect(service.adjust('ot-1', { approvedMenCount: 3 } as any, user)).rejects.toThrow(BadRequestException);
      expect(prisma.overtimeRequest.update).not.toHaveBeenCalled();
    });

    it('404s on an unknown request id', async () => {
      prisma.overtimeRequest.findFirst.mockResolvedValue(null);
      await expect(service.adjust('missing', { approvedMenCount: 3 } as any, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('onWorkflowApproved() / onWorkflowRejected() — dispatched by WorkflowsService.act()', () => {
    it('on final approval, defaults approvedMenCount/approvedHours to what was requested when Management never explicitly adjusted them', async () => {
      const request = { id: 'ot-1', requestedMenCount: 5, requestedHours: 2, approvedMenCount: null, approvedHours: null };
      prisma.overtimeRequest.findFirst.mockResolvedValue(request);
      prisma.overtimeRequest.update.mockImplementation(({ data }: any) => Promise.resolve({ ...request, ...data }));

      const updated = await service.onWorkflowApproved('ot-1', user);

      expect(updated.status).toBe('APPROVED');
      expect(updated.approvedMenCount).toBe(5);
      expect(updated.approvedHours).toBe(2);
    });

    it('on final approval, keeps an already-adjusted approvedMenCount/Hours rather than overwriting it with the requested figures', async () => {
      const request = { id: 'ot-1', requestedMenCount: 5, requestedHours: 2, approvedMenCount: 3, approvedHours: 1.5 };
      prisma.overtimeRequest.findFirst.mockResolvedValue(request);
      prisma.overtimeRequest.update.mockImplementation(({ data }: any) => Promise.resolve({ ...request, ...data }));

      const updated = await service.onWorkflowApproved('ot-1', user);

      expect(updated.approvedMenCount).toBe(3);
      expect(updated.approvedHours).toBe(1.5);
    });

    it('is a no-op when the request no longer exists (never throws - WorkflowsService dispatch must not fail the workflow transition)', async () => {
      prisma.overtimeRequest.findFirst.mockResolvedValue(null);
      await expect(service.onWorkflowApproved('missing', user)).resolves.toBeUndefined();
      expect(prisma.overtimeRequest.update).not.toHaveBeenCalled();
    });

    it('onWorkflowRejected marks the request REJECTED', async () => {
      const request = { id: 'ot-1', status: 'PENDING_APPROVAL' };
      prisma.overtimeRequest.findFirst.mockResolvedValue(request);
      prisma.overtimeRequest.update.mockImplementation(({ data }: any) => Promise.resolve({ ...request, ...data }));

      const updated = await service.onWorkflowRejected('ot-1', user);
      expect(updated.status).toBe('REJECTED');
    });
  });

  describe('findApprovedForWorkOrderOnDate() — the ceiling production-entry.service.ts checks against', () => {
    it('scopes to APPROVED, active, same company/work order, and the given calendar day only', async () => {
      prisma.overtimeRequest.findFirst.mockResolvedValue({ id: 'ot-1', approvedMenCount: 5 });

      const result = await service.findApprovedForWorkOrderOnDate('wo-smt', new Date('2026-05-10T08:00:00'), 'company-1');

      expect(result).toEqual({ id: 'ot-1', approvedMenCount: 5 });
      const call = prisma.overtimeRequest.findFirst.mock.calls[0][0];
      expect(call.where.companyId).toBe('company-1');
      expect(call.where.workOrderId).toBe('wo-smt');
      expect(call.where.status).toBe('APPROVED');
      expect(call.where.isActive).toBe(true);
      // the day window spans the full local calendar day the entry's periodStart falls in
      const inputDate = new Date('2026-05-10T08:00:00');
      expect(call.where.shiftDate.gte.toDateString()).toBe(inputDate.toDateString());
      expect(call.where.shiftDate.lte.toDateString()).toBe(inputDate.toDateString());
      expect(call.where.shiftDate.gte.getHours()).toBe(0);
      expect(call.where.shiftDate.lte.getHours()).toBe(23);
    });

    it('returns null/undefined when no approved request covers that date', async () => {
      prisma.overtimeRequest.findFirst.mockResolvedValue(null);
      const result = await service.findApprovedForWorkOrderOnDate('wo-smt', new Date('2026-05-10'), 'company-1');
      expect(result).toBeNull();
    });
  });
});
