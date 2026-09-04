import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReworkService } from './rework.service';

describe('ReworkService PROD015', () => {
  let service: ReworkService;
  let prisma: any;
  let audit: any;
  let settings: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const originalQc = { id: 'qc-1', companyId: 'company-1', workOrderId: 'wo-assembly', reworkQty: 10 };
  const pendingRework = {
    id: 'rw-1', companyId: 'company-1', reworkNumber: 'RW-2026-0001', workOrderId: 'wo-assembly',
    originalQcInspectionId: 'qc-1', quantity: 10, remainingQuantity: 10, cycleNumber: 1, status: 'REWORK_PENDING',
  };

  beforeEach(() => {
    prisma = {
      productionQc: {
        findFirst: jest.fn().mockResolvedValue(originalQc),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'qc-2' }),
      },
      rework: {
        findFirst: jest.fn().mockResolvedValue(pendingRework),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'rw-1', ...data })),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...pendingRework, ...data })),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    settings = {
      getSettingValue: jest.fn((key: string, def: string) => {
        if (key === 'STANDARD_LABOUR_RATE_PER_SHIFT') return Promise.resolve('120');
        if (key === 'STANDARD_SHIFT_HOURS') return Promise.resolve('8');
        return Promise.resolve(def);
      }),
    };
    service = new ReworkService(prisma, audit, settings);
  });

  describe('positive: valid rework creation', () => {
    it('creates a rework record for 10 pcs, cycle 1, preserving original WO/QC links', async () => {
      const result = await service.create({ workOrderId: 'wo-assembly', originalQcInspectionId: 'qc-1', quantity: 10, defectDescription: 'Soldering Issue', reworkStage: 'MI' } as any, user);
      expect(result.quantity).toBe(10);
      expect(result.cycleNumber).toBe(1);
      expect(result.originalQcInspectionId).toBe('qc-1');
      expect(result.status).toBe('REWORK_PENDING');
    });
  });

  describe('excess rework blocked', () => {
    it('blocks requesting more than the available rework-pending quantity', async () => {
      await expect(
        service.create({ workOrderId: 'wo-assembly', originalQcInspectionId: 'qc-1', quantity: 12 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('partial rework and multiple executions', () => {
    it('allows a partial claim, leaving the rest available', async () => {
      const result = await service.create({ workOrderId: 'wo-assembly', originalQcInspectionId: 'qc-1', quantity: 6 } as any, user);
      expect(result.quantity).toBe(6);
    });

    it('accounts for already-claimed quantity from prior rework records', async () => {
      prisma.rework.findMany.mockResolvedValue([{ quantity: 6 }]);
      await expect(
        service.create({ workOrderId: 'wo-assembly', originalQcInspectionId: 'qc-1', quantity: 5 } as any, user),
      ).rejects.toThrow(BadRequestException);

      const result = await service.create({ workOrderId: 'wo-assembly', originalQcInspectionId: 'qc-1', quantity: 4 } as any, user);
      expect(result.quantity).toBe(4);
    });
  });

  describe('quantity-based manpower on start', () => {
    it('starts with a manpower quantity, no Employee IDs', async () => {
      const result = await service.start('rw-1', { manpowerQty: 2 } as any, user);
      expect(result.status).toBe('IN_REWORK');
      const updateCall = prisma.rework.update.mock.calls[0][0];
      expect(updateCall.data.manpowerQty).toBe(2);
    });
  });

  describe('rework labour cost', () => {
    it('computes additional labour cost from manpower x actual duration x rate', async () => {
      const startedRework = { ...pendingRework, quantity: 6, status: 'IN_REWORK', manpowerQty: 2, actualStartAt: new Date(Date.now() - 60 * 60 * 1000) };
      prisma.rework.findFirst.mockResolvedValue(startedRework);

      const result = await service.complete('rw-1', { successfullyReworkedQty: 6, stillDefectiveQty: 0 } as any, user);
      expect(result.additionalLabourCost).toBe(30);
    });
  });

  describe('cost accumulation - additive, never a reset', () => {
    it('sums labour + material + other into totalAdditionalCost', async () => {
      const startedRework = { ...pendingRework, quantity: 6, status: 'IN_REWORK', manpowerQty: 2, actualStartAt: new Date(Date.now() - 60 * 60 * 1000) };
      prisma.rework.findFirst.mockResolvedValue(startedRework);

      const result = await service.complete('rw-1', { successfullyReworkedQty: 5, stillDefectiveQty: 1, additionalMaterialCost: 24, additionalOtherCost: 10 } as any, user);
      expect(result.additionalMaterialCost).toBe(24);
      expect(result.totalAdditionalCost).toBe(30 + 24 + 10);
    });
  });

  describe('rework quantity reconciliation', () => {
    it('accepts a fully reconciled disposition (successfully reworked + still defective = input)', async () => {
      const startedRework = { ...pendingRework, quantity: 6, status: 'IN_REWORK' };
      prisma.rework.findFirst.mockResolvedValue(startedRework);
      const result = await service.complete('rw-1', { successfullyReworkedQty: 5, stillDefectiveQty: 1 } as any, user);
      expect(result.status).toBe('PENDING_QC_REINSPECTION');
    });

    it('blocks an unreconciled disposition (total less than input)', async () => {
      const startedRework = { ...pendingRework, quantity: 6, status: 'IN_REWORK' };
      prisma.rework.findFirst.mockResolvedValue(startedRework);
      await expect(
        service.complete('rw-1', { successfullyReworkedQty: 4, stillDefectiveQty: 1 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks an excess disposition (total more than input - quantity creation)', async () => {
      const startedRework = { ...pendingRework, quantity: 6, status: 'IN_REWORK' };
      prisma.rework.findFirst.mockResolvedValue(startedRework);
      await expect(
        service.complete('rw-1', { successfullyReworkedQty: 5, stillDefectiveQty: 2 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('QC re-inspection handover - never direct FG', () => {
    it('creates a new PENDING ProductionQc row for successfully reworked quantity', async () => {
      const startedRework = { ...pendingRework, quantity: 6, status: 'IN_REWORK' };
      prisma.rework.findFirst.mockResolvedValue(startedRework);
      await service.complete('rw-1', { successfullyReworkedQty: 5, stillDefectiveQty: 1 } as any, user);

      const qcCreateCall = prisma.productionQc.create.mock.calls[0][0];
      expect(qcCreateCall.data.sampleSize).toBe(5);
      expect(qcCreateCall.data.status).toBe('PENDING');
      expect(qcCreateCall.data.result).toBe('PENDING');
    });

    it('successfully reworked quantity does not automatically become accepted (spec section 32)', async () => {
      const startedRework = { ...pendingRework, quantity: 6, status: 'IN_REWORK' };
      prisma.rework.findFirst.mockResolvedValue(startedRework);
      const result = await service.complete('rw-1', { successfullyReworkedQty: 5, stillDefectiveQty: 1 } as any, user);
      expect(result.status).toBe('PENDING_QC_REINSPECTION');
      expect(result.status).not.toBe('QC_ACCEPTED');
    });
  });

  describe('no direct FG movement - proven at source', () => {
    it('complete never references FgReceipt or StockBalance', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./rework.service.ts'), 'utf8');
      const start = serviceSource.indexOf('async complete');
      const end = serviceSource.indexOf('async findAll(user: any, query: any)');
      const section = serviceSource.slice(start, end);
      expect(section).not.toContain('fgReceipt');
      expect(section).not.toContain('stockBalance');
    });
  });

  describe('normal production continues - never touches WorkOrder status', () => {
    it('create never updates WorkOrder', async () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./rework.service.ts'), 'utf8');
      const start = serviceSource.indexOf('async create');
      const end = serviceSource.indexOf('async start(id: string');
      const section = serviceSource.slice(start, end);
      expect(section).not.toContain('workOrder.update');
    });
  });

  describe('duplicate completion protection', () => {
    it('blocks completing a rework that is not IN_REWORK', async () => {
      prisma.rework.findFirst.mockResolvedValue({ ...pendingRework, status: 'PENDING_QC_REINSPECTION' });
      await expect(
        service.complete('rw-1', { successfullyReworkedQty: 5, stillDefectiveQty: 1 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for a nonexistent rework', async () => {
      prisma.rework.findFirst.mockResolvedValue(null);
      await expect(service.start('rw-nonexistent', { manpowerQty: 2 } as any, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('audit', () => {
    it('logs rework creation', async () => {
      await service.create({ workOrderId: 'wo-assembly', originalQcInspectionId: 'qc-1', quantity: 10 } as any, user);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: 'reworks', action: 'CREATE', changedBy: user.id }),
      );
    });
  });
});
