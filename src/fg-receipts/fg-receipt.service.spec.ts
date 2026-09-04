import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FgReceiptService } from './fg-receipt.service';

describe('FgReceiptService PROD017', () => {
  let service: FgReceiptService;
  let prisma: any;
  let audit: any;
  let workOrderService: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const wo = { id: 'wo-packaging', companyId: 'company-1', status: 'IN_PROGRESS', productCode: '9W-LED', productName: '9W Emergency LED Bulb', uom: 'PCS', plannedQty: 1000 };
  const firstPassQc = { id: 'qc-1', companyId: 'company-1', workOrderId: 'wo-packaging', acceptedQty: 185, fgHandedOverQty: 0 };
  const reworkQc = { id: 'qc-2', companyId: 'company-1', workOrderId: 'wo-packaging', acceptedQty: 8, fgHandedOverQty: 0 };

  beforeEach(() => {
    prisma = {
      productionQc: { findFirst: jest.fn().mockResolvedValue(firstPassQc) },
      workOrder: { findFirst: jest.fn().mockResolvedValue(wo) },
      fgReceipt: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'fgr-1', ...data })),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    workOrderService = {};
    service = new FgReceiptService(prisma, audit, workOrderService);
  });

  describe('positive: partial FG handover from QC acceptance (manual test 1)', () => {
    it('creates a DRAFT FgReceipt for 100 of 185 accepted, not requiring WO COMPLETED', async () => {
      const result = await service.createFromQcAcceptance({ productionQcId: 'qc-1', warehouseId: 'wh-1', qty: 100 } as any, user);
      expect(result.receivedQty).toBe(100);
      expect(result.status).toBe('DRAFT');
      expect(result.sourceProductionQcId).toBe('qc-1');
    });

    it('does not require the WO to be COMPLETED - IN_PROGRESS is accepted', async () => {
      expect(wo.status).toBe('IN_PROGRESS');
      const result = await service.createFromQcAcceptance({ productionQcId: 'qc-1', warehouseId: 'wh-1', qty: 50 } as any, user);
      expect(result.receivedQty).toBe(50);
    });
  });

  describe('multiple handovers accumulate correctly (manual test 3)', () => {
    it('accounts for quantity already handed over when checking a second handover', async () => {
      prisma.productionQc.findFirst.mockResolvedValue({ ...firstPassQc, fgHandedOverQty: 100 });
      await expect(
        service.createFromQcAcceptance({ productionQcId: 'qc-1', warehouseId: 'wh-1', qty: 90 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows exactly the remaining available balance', async () => {
      prisma.productionQc.findFirst.mockResolvedValue({ ...firstPassQc, fgHandedOverQty: 100 });
      const result = await service.createFromQcAcceptance({ productionQcId: 'qc-1', warehouseId: 'wh-1', qty: 85 } as any, user);
      expect(result.receivedQty).toBe(85);
    });
  });

  describe('excess handover blocked (manual test 8)', () => {
    it('blocks a handover exceeding the available accepted quantity', async () => {
      await expect(
        service.createFromQcAcceptance({ productionQcId: 'qc-1', warehouseId: 'wh-1', qty: 186 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('QC Hold/Rework Pending/Reject excluded (manual tests 17-19)', () => {
    it('blocks a handover attempt from a QC inspection with zero accepted quantity', async () => {
      prisma.productionQc.findFirst.mockResolvedValue({ ...firstPassQc, acceptedQty: 0 });
      await expect(
        service.createFromQcAcceptance({ productionQcId: 'qc-1', warehouseId: 'wh-1', qty: 1 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('first-pass vs rework-accepted traceability (manual tests 4-5)', () => {
    it('handles a first-pass acceptance handover, preserving sourceProductionQcId', async () => {
      const result = await service.createFromQcAcceptance({ productionQcId: 'qc-1', warehouseId: 'wh-1', qty: 185 } as any, user);
      expect(result.sourceProductionQcId).toBe('qc-1');
    });

    it('handles a separate rework-accepted handover from a different QC inspection', async () => {
      prisma.productionQc.findFirst.mockResolvedValue(reworkQc);
      const result = await service.createFromQcAcceptance({ productionQcId: 'qc-2', warehouseId: 'wh-1', qty: 8 } as any, user);
      expect(result.sourceProductionQcId).toBe('qc-2');
      expect(result.receivedQty).toBe(8);
    });
  });

  describe('concurrency safety', () => {
    it('treats a zero-row atomic update result as a real concurrency conflict', async () => {
      prisma.$executeRaw = jest.fn().mockResolvedValue(0);
      await expect(
        service.createFromQcAcceptance({ productionQcId: 'qc-1', warehouseId: 'wh-1', qty: 100 } as any, user),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.fgReceipt.create).not.toHaveBeenCalled();
    });
  });

  describe('QC acceptance alone does not increase FG stock (spec section 3) - proven at source', () => {
    it('createFromQcAcceptance never references StockBalance or credits inventory directly', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./fg-receipt.service.ts'), 'utf8');
      const start = serviceSource.indexOf('async createFromQcAcceptance');
      const end = serviceSource.indexOf('async create(dto: CreateFgReceiptDto, user: any)');
      const section = serviceSource.slice(start, end);
      expect(section).not.toContain('stockBalance');
      expect(section.toLowerCase()).not.toContain('receivefromoqc');
    });

    it('creates the receipt with status DRAFT, not RECEIVED', async () => {
      const result = await service.createFromQcAcceptance({ productionQcId: 'qc-1', warehouseId: 'wh-1', qty: 100 } as any, user);
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('audit', () => {
    it('logs the FG handover creation', async () => {
      await service.createFromQcAcceptance({ productionQcId: 'qc-1', warehouseId: 'wh-1', qty: 100 } as any, user);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: 'fg_receipts', action: 'CREATE', changedBy: user.id }),
      );
    });
  });

  describe('not found handling', () => {
    it('throws NotFoundException for a nonexistent QC inspection', async () => {
      prisma.productionQc.findFirst.mockResolvedValue(null);
      await expect(
        service.createFromQcAcceptance({ productionQcId: 'qc-nonexistent', warehouseId: 'wh-1', qty: 1 } as any, user),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
