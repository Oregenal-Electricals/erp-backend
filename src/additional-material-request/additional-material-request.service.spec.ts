import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdditionalMaterialRequestService } from './additional-material-request.service';

describe('AdditionalMaterialRequestService - STORE-013', () => {
  let service: AdditionalMaterialRequestService;
  let prisma: any;
  let audit: any;
  let workflows: any;
  const user = { id: 'user-1', companyId: 'company-1' };
  const wo = {
    id: 'wo-1', companyId: 'company-1', plannedQty: 1000,
    bom: { items: [{ itemCode: 'DRIVER-01', quantity: 1, effectiveQty: null }] },
  };

  beforeEach(() => {
    let record: any = null;
    prisma = {
      workOrder: { findFirst: jest.fn().mockResolvedValue(wo) },
      productionIssueItem: { aggregate: jest.fn().mockResolvedValue({ _sum: { issuedQty: 900 } }) },
      additionalMaterialRequest: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(record ? { ...record } : null)),
        create: jest.fn().mockImplementation(({ data }: any) => { record = { id: 'amr-1', ...data }; return Promise.resolve(record); }),
        update: jest.fn().mockImplementation(({ data }: any) => { record = { ...(record || { id: 'amr-1' }), ...data }; return Promise.resolve(record); }),
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
    service = new AdditionalMaterialRequestService(prisma, audit, workflows);
  });

  describe('getOriginalRemaining', () => {
    it('computes original requirement from BOM ratio x planned qty, minus what has already been issued', async () => {
      const r = await service.getOriginalRemaining('wo-1', 'DRIVER-01', user);
      expect(r.originalRequirement).toBe(1000);
      expect(r.totalIssued).toBe(900);
      expect(r.originalRemaining).toBe(100);
    });

    it('never returns a negative remaining even if issued somehow exceeds requirement', async () => {
      prisma.productionIssueItem.aggregate.mockResolvedValue({ _sum: { issuedQty: 1500 } });
      const r = await service.getOriginalRemaining('wo-1', 'DRIVER-01', user);
      expect(r.originalRemaining).toBe(0);
    });

    it('throws NotFoundException for a work order that does not exist', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(null);
      await expect(service.getOriginalRemaining('missing', 'DRIVER-01', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('request', () => {
    const dto = { workOrderId: 'wo-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', requestedQty: 150, reasonCategory: 'PRODUCTION_LOSS', reason: 'Line loss above standard' };

    it('rejects a request that is still within the original remaining requirement - not genuinely additional', async () => {
      prisma.productionIssueItem.aggregate.mockResolvedValue({ _sum: { issuedQty: 500 } }); // remaining = 500
      await expect(service.request({ ...dto, requestedQty: 300 } as any, user)).rejects.toThrow(/still within the original approved requirement/);
    });

    it('accepts a request that genuinely exceeds the original remaining requirement', async () => {
      const r = await service.request(dto as any, user); // remaining is 100 (from default mock), requesting 150
      expect(r.requestedQty).toBe(150);
      expect(r.itemCode).toBe('DRIVER-01');
      expect(workflows.submit).toHaveBeenCalledWith(expect.objectContaining({ documentType: 'ADDITIONAL_MATERIAL_REQUEST' }), user);
    });

    it('rejects a duplicate pending request for the same WO and item', async () => {
      prisma.additionalMaterialRequest.findFirst.mockResolvedValueOnce({ id: 'existing', status: 'PENDING' });
      await expect(service.request(dto as any, user)).rejects.toThrow(/already pending/);
    });
  });

  describe('decide', () => {
    const pending = { id: 'amr-1', companyId: 'company-1', status: 'PENDING', approvalRequestId: 'approval-1', requestedQty: 200 };

    it('approves at the full requested qty by default', async () => {
      prisma.additionalMaterialRequest.findFirst.mockResolvedValue(pending);
      const r = await service.decide('amr-1', { action: 'APPROVED' } as any, user);
      expect(r.approvedQty).toBe(200);
    });

    it('supports partial approval', async () => {
      prisma.additionalMaterialRequest.findFirst.mockResolvedValue(pending);
      const r = await service.decide('amr-1', { action: 'APPROVED', approvedQty: 120 } as any, user);
      expect(r.approvedQty).toBe(120);
    });

    it('blocks approving more than requested', async () => {
      prisma.additionalMaterialRequest.findFirst.mockResolvedValue(pending);
      await expect(service.decide('amr-1', { action: 'APPROVED', approvedQty: 250 } as any, user)).rejects.toThrow(/cannot exceed the requested quantity/);
    });

    it('rejects a decision on an already-decided request', async () => {
      prisma.additionalMaterialRequest.findFirst.mockResolvedValue({ ...pending, status: 'REJECTED' });
      await expect(service.decide('amr-1', { action: 'APPROVED' } as any, user)).rejects.toThrow(/already REJECTED/);
    });
  });

  describe('revoke', () => {
    it('revokes an APPROVED request', async () => {
      prisma.additionalMaterialRequest.findFirst.mockResolvedValue({ id: 'amr-1', companyId: 'company-1', status: 'APPROVED' });
      const r = await service.revoke('amr-1', user);
      expect(r.status).toBe('REVOKED');
    });

    it('blocks revoking a request that is not APPROVED', async () => {
      prisma.additionalMaterialRequest.findFirst.mockResolvedValue({ id: 'amr-1', companyId: 'company-1', status: 'PENDING' });
      await expect(service.revoke('amr-1', user)).rejects.toThrow(/Only an APPROVED request/);
    });
  });

  describe('findActiveApprovedRequest', () => {
    it('only returns an APPROVED request with remaining capacity', async () => {
      prisma.additionalMaterialRequest.findMany.mockResolvedValue([
        { id: 'r1', approvedQty: 100, usedQty: 100 },
        { id: 'r2', approvedQty: 100, usedQty: 40 },
      ]);
      const r = await service.findActiveApprovedRequest('wo-1', 'DRIVER-01', user);
      expect(r.id).toBe('r2');
    });
  });

  describe('consume', () => {
    beforeEach(() => {
      prisma.additionalMaterialRequest.findFirst.mockImplementation(() => Promise.resolve({ id: 'amr-1', status: 'APPROVED', approvedQty: 120, usedQty: 0 }));
      prisma.additionalMaterialRequest.updateMany.mockResolvedValue({ count: 1 });
    });

    it('claims exactly the requested qty when capacity allows (STORE-013 test 7)', async () => {
      const claimed = await service.consume('amr-1', 'issue-1', 70, user);
      expect(claimed).toBe(70);
    });

    it('never claims more than remaining capacity', async () => {
      prisma.additionalMaterialRequest.findFirst.mockResolvedValue({ id: 'amr-1', status: 'APPROVED', approvedQty: 120, usedQty: 70 });
      // Remaining is 50; a second attempt at 60 should only get 50 (caller treats this as a block).
      const claimed = await service.consume('amr-1', 'issue-2', 60, user);
      expect(claimed).toBe(50);
    });

    it('returns 0 for a REVOKED request - no longer issueable', async () => {
      prisma.additionalMaterialRequest.findFirst.mockResolvedValue({ id: 'amr-1', status: 'REVOKED', approvedQty: 120, usedQty: 0 });
      const claimed = await service.consume('amr-1', 'issue-1', 50, user);
      expect(claimed).toBe(0);
    });

    it('retries with a fresh read on a concurrent usedQty conflict', async () => {
      let callCount = 0;
      const original = prisma.additionalMaterialRequest.updateMany;
      prisma.additionalMaterialRequest.updateMany = jest.fn().mockImplementation((args: any) => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ count: 0 });
        return original(args);
      });
      const claimed = await service.consume('amr-1', 'issue-1', 70, user);
      expect(claimed).toBe(70);
      expect(callCount).toBeGreaterThan(1);
    });
  });
});
