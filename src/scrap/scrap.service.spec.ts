import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ScrapService } from './scrap.service';

describe('ScrapService PROD016', () => {
  let service: ScrapService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const sourceQc = { id: 'qc-1', companyId: 'company-1', workOrderId: 'wo-packaging', failQty: 7 };
  const pendingRejection = {
    id: 'fr-1', companyId: 'company-1', rejectionNumber: 'FR-2026-0001', workOrderId: 'wo-packaging',
    sourceQcInspectionId: 'qc-1', quantity: 7, scrapQty: 0, recoveryQty: 0, otherDispositionQty: 0,
    status: 'PENDING_DISPOSITION', estimatedScrapValue: 0, recognizedScrapRecovery: 0,
  };

  beforeEach(() => {
    prisma = {
      productionQc: { findFirst: jest.fn().mockResolvedValue(sourceQc) },
      scrap: {
        findFirst: jest.fn().mockResolvedValue(pendingRejection),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'fr-1', ...data })),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...pendingRejection, ...data })),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new ScrapService(prisma, audit);
  });

  describe('positive: final rejection creation', () => {
    it('creates a final rejection record for 7 pcs, preserving source QC link', async () => {
      const result = await service.create({ workOrderId: 'wo-packaging', sourceQcInspectionId: 'qc-1', quantity: 7 } as any, user);
      expect(result.quantity).toBe(7);
      expect(result.sourceQcInspectionId).toBe('qc-1');
      expect(result.status).toBe('PENDING_DISPOSITION');
    });

    it('preserves sourceReworkId for traceability when the rejection came from a rework re-inspection', async () => {
      const result = await service.create({ workOrderId: 'wo-packaging', sourceQcInspectionId: 'qc-1', sourceReworkId: 'rw-1', quantity: 7 } as any, user);
      expect(result.sourceReworkId).toBe('rw-1');
    });
  });

  describe('excess rejection blocked', () => {
    it('blocks requesting more than the available rejected quantity', async () => {
      await expect(
        service.create({ workOrderId: 'wo-packaging', sourceQcInspectionId: 'qc-1', quantity: 8 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('partial disposition', () => {
    it('allows a partial disposition, leaving the rest pending', async () => {
      const result = await service.disposition('fr-1', { scrapQty: 5, recoveryQty: 0 } as any, user);
      expect(result.scrapQty).toBe(5);
      expect(result.status).toBe('PENDING_DISPOSITION');
    });
  });

  describe('multiple dispositions', () => {
    it('accumulates across separate disposition calls without losing the running total', async () => {
      const afterFirst = { ...pendingRejection, quantity: 10, scrapQty: 6 };
      prisma.scrap.findFirst.mockResolvedValueOnce({ ...pendingRejection, quantity: 10 });
      const first = await service.disposition('fr-1', { scrapQty: 6, recoveryQty: 0 } as any, user);
      expect(first.scrapQty).toBe(6);

      prisma.scrap.findFirst.mockResolvedValueOnce(afterFirst);
      const second = await service.disposition('fr-1', { scrapQty: 0, recoveryQty: 3, otherDispositionQty: 1 } as any, user);
      expect(second.recoveryQty).toBe(3);
      expect(second.otherDispositionQty).toBe(1);
      expect(second.status).toBe('DISPOSITION_COMPLETED');
    });
  });

  describe('quantity reconciliation - no disappearance, no creation', () => {
    it('blocks a disposition total exceeding the rejection quantity', async () => {
      await expect(
        service.disposition('fr-1', { scrapQty: 5, recoveryQty: 3 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows a disposition that exactly reconciles and marks DISPOSITION_COMPLETED', async () => {
      const result = await service.disposition('fr-1', { scrapQty: 5, recoveryQty: 2 } as any, user);
      expect(result.status).toBe('DISPOSITION_COMPLETED');
    });
  });

  describe('scrap recovery value', () => {
    it('records recognized scrap recovery as an accumulating offset value', async () => {
      const result = await service.disposition('fr-1', { scrapQty: 7, recoveryQty: 0, recognizedScrapRecovery: 400 } as any, user);
      expect(result.recognizedScrapRecovery).toBe(400);
    });

    it('separates estimated value from recognized recovery', async () => {
      const result = await service.disposition('fr-1', { scrapQty: 7, recoveryQty: 0, estimatedScrapValue: 500, recognizedScrapRecovery: 0 } as any, user);
      expect(result.estimatedScrapValue).toBe(500);
      expect(result.recognizedScrapRecovery).toBe(0);
    });
  });

  describe('cost preservation - never erased, proven at source', () => {
    it('disposition never touches WorkOrder cost fields or ProductionCostSheet', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./scrap.service.ts'), 'utf8');
      const start = serviceSource.indexOf('async disposition');
      const end = serviceSource.indexOf('async findAll(user: any, query: any)');
      const section = serviceSource.slice(start, end);
      expect(section).not.toContain('productionCostSheet');
      expect(section).not.toContain('workOrder.update');
    });
  });

  describe('no FG creation - proven at source', () => {
    it('create and disposition never reference FgReceipt or StockBalance', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./scrap.service.ts'), 'utf8');
      expect(serviceSource).not.toContain('fgReceipt');
      expect(serviceSource).not.toContain('stockBalance');
    });
  });

  describe('Gate-Out separation - proven at source', () => {
    it('never touches Gate models - Production does not perform Gate-Out for scrap', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./scrap.service.ts'), 'utf8');
      expect(serviceSource.toLowerCase()).not.toContain('gateout');
      expect(serviceSource.toLowerCase()).not.toContain('gate-out');
    });
  });

  describe('duplicate disposition protection', () => {
    it('blocks a disposition attempt on an already-DISPOSITION_COMPLETED record', async () => {
      prisma.scrap.findFirst.mockResolvedValue({ ...pendingRejection, status: 'DISPOSITION_COMPLETED' });
      await expect(
        service.disposition('fr-1', { scrapQty: 1, recoveryQty: 0 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for a nonexistent rejection', async () => {
      prisma.scrap.findFirst.mockResolvedValue(null);
      await expect(service.disposition('fr-nonexistent', { scrapQty: 1, recoveryQty: 0 } as any, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('audit', () => {
    it('logs final rejection creation', async () => {
      await service.create({ workOrderId: 'wo-packaging', sourceQcInspectionId: 'qc-1', quantity: 7 } as any, user);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: 'scraps', action: 'CREATE', changedBy: user.id }),
      );
    });
  });
});
