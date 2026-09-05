import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductionQcService } from './production-qc.service';

describe('ProductionQcService PROD014', () => {
  let service: ProductionQcService;
  let prisma: any;
  let audit: any;
  let workOrderService: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const pendingQc = {
    id: 'qc-1', companyId: 'company-1', qcNumber: 'QC-2026-0001', workOrderId: 'wo-packaging',
    sampleSize: 200, status: 'PENDING', result: 'PENDING',
  };

  beforeEach(() => {
    prisma = {
      productionQc: {
        findFirst: jest.fn().mockResolvedValue(pendingQc),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...pendingQc, ...data })),
        count: jest.fn().mockResolvedValue(0),
      },
      ncrRecord: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({ id: 'ncr-1' }) },
      workOrder: { findFirst: jest.fn() },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    workOrderService = { stop: jest.fn() };
    service = new ProductionQcService(prisma, audit, workOrderService);
  });

  describe('positive: mixed QC disposition', () => {
    it('accepts 200 received into 185 accepted, 10 rework, 5 rejected', async () => {
      const result = await service.decideQuantities('qc-1', { acceptedQty: 185, reworkQty: 10, rejectedQty: 5 } as any, user);
      expect(result.acceptedQty).toBe(185);
      expect(result.reworkQty).toBe(10);
      expect(result.failQty).toBe(5);
      expect(result.status).toBe('COMPLETED');
    });

    it('derives result CONDITIONAL for a mixed disposition', async () => {
      const result = await service.decideQuantities('qc-1', { acceptedQty: 185, reworkQty: 10, rejectedQty: 5 } as any, user);
      expect(result.result).toBe('CONDITIONAL');
    });
  });

  describe('full acceptance and full rejection', () => {
    it('derives result PASS when fully accepted', async () => {
      const result = await service.decideQuantities('qc-1', { acceptedQty: 200, reworkQty: 0, rejectedQty: 0 } as any, user);
      expect(result.result).toBe('PASS');
    });

    it('derives result FAIL when fully rejected', async () => {
      const result = await service.decideQuantities('qc-1', { acceptedQty: 0, reworkQty: 0, rejectedQty: 200 } as any, user);
      expect(result.result).toBe('FAIL');
    });
  });

  describe('hold quantity supported', () => {
    it('accepts a disposition that includes hold quantity', async () => {
      const result = await service.decideQuantities('qc-1', { acceptedQty: 180, reworkQty: 10, rejectedQty: 5, holdQty: 5 } as any, user);
      expect(result.holdQty).toBe(5);
    });
  });

  describe('unreconciled and excess quantity blocked', () => {
    it('blocks a disposition totaling less than the inspected quantity', async () => {
      await expect(
        service.decideQuantities('qc-1', { acceptedQty: 180, reworkQty: 10, rejectedQty: 5 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks a disposition totaling more than the inspected quantity', async () => {
      await expect(
        service.decideQuantities('qc-1', { acceptedQty: 185, reworkQty: 15, rejectedQty: 5 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('duplicate decision protection', () => {
    it('blocks a second decision on an already-COMPLETED QC record', async () => {
      prisma.productionQc.findFirst.mockResolvedValue({ ...pendingQc, status: 'COMPLETED' });
      await expect(
        service.decideQuantities('qc-1', { acceptedQty: 200, reworkQty: 0, rejectedQty: 0 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for a nonexistent QC record', async () => {
      prisma.productionQc.findFirst.mockResolvedValue(null);
      await expect(
        service.decideQuantities('qc-nonexistent', { acceptedQty: 200, reworkQty: 0, rejectedQty: 0 } as any, user),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('rework and reject traceability via NCR', () => {
    it('creates an NCR record when rework or reject quantity is nonzero', async () => {
      await service.decideQuantities('qc-1', { acceptedQty: 185, reworkQty: 10, rejectedQty: 5 } as any, user);
      const ncrCall = prisma.ncrRecord.create.mock.calls[0][0];
      expect(ncrCall.data.source).toBe('OQC');
      expect(ncrCall.data.qtyAffected).toBe(15);
      expect(ncrCall.data.workOrderId).toBe('wo-packaging');
    });

    it('does not create an NCR when fully accepted', async () => {
      await service.decideQuantities('qc-1', { acceptedQty: 200, reworkQty: 0, rejectedQty: 0 } as any, user);
      expect(prisma.ncrRecord.create).not.toHaveBeenCalled();
    });
  });

  describe('no FG or scrap creation proven at source', () => {
    it('decideQuantities never references FgReceipt or StockBalance', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./production-qc.service.ts'), 'utf8');
      const start = serviceSource.indexOf('async decideQuantities');
      const end = serviceSource.indexOf('async findAll(user: any, query: any)');
      const section = serviceSource.slice(start, end);
      expect(section).not.toContain('fgReceipt');
      expect(section).not.toContain('stockBalance');
    });
  });

  describe('cost preservation proven at source', () => {
    it('decideQuantities never touches WorkOrder cost fields or ProductionCostSheet', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./production-qc.service.ts'), 'utf8');
      const start = serviceSource.indexOf('async decideQuantities');
      const end = serviceSource.indexOf('async findAll(user: any, query: any)');
      const section = serviceSource.slice(start, end);
      expect(section).not.toContain('productionCostSheet');
      expect(section).not.toContain('completedQty:');
    });
  });

  describe('production continuation', () => {
    it('does not call workOrderService.stop even on a fully rejected disposition', async () => {
      await service.decideQuantities('qc-1', { acceptedQty: 0, reworkQty: 0, rejectedQty: 200 } as any, user);
      expect(workOrderService.stop).not.toHaveBeenCalled();
    });
  });

  describe('closes the originating Rework once its re-inspection completes (bug found via UAT)', () => {
    it('sets Rework.status to CLOSED when the QC record has a sourceReworkId', async () => {
      prisma.productionQc.findFirst.mockResolvedValue({ ...pendingQc, sourceReworkId: 'rw-1' });
      prisma.rework = { update: jest.fn().mockResolvedValue({ id: 'rw-1', status: 'CLOSED' }) };
      await service.decideQuantities('qc-1', { acceptedQty: 200, reworkQty: 0, rejectedQty: 0 } as any, user);
      expect(prisma.rework.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rw-1' }, data: expect.objectContaining({ status: 'CLOSED' }) }),
      );
    });

    it('does not touch Rework when the QC record has no sourceReworkId (first-pass inspection)', async () => {
      prisma.rework = { update: jest.fn() };
      await service.decideQuantities('qc-1', { acceptedQty: 200, reworkQty: 0, rejectedQty: 0 } as any, user);
      expect(prisma.rework.update).not.toHaveBeenCalled();
    });
  });

  describe('audit', () => {
    it('logs the QC decision', async () => {
      await service.decideQuantities('qc-1', { acceptedQty: 185, reworkQty: 10, rejectedQty: 5 } as any, user);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: 'production_qc', action: 'UPDATE', changedBy: user.id }),
      );
    });
  });
});
