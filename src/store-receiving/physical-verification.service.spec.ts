import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PhysicalVerificationService } from './physical-verification.service';

describe('PhysicalVerificationService STORE-002', () => {
  let service: PhysicalVerificationService;
  let prisma: any;
  let audit: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  const driverLine = {
    id: 'line-driver', companyId: 'company-1', storeReceivingId: 'sr-1',
    itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS',
    expectedQty: 1000, actualVerifiedQty: null, actualUom: null, result: null,
    materialMismatch: false, verifiedAt: null,
    storeReceiving: { id: 'sr-1', gateInwardEntryId: 'gin-1', status: 'PHYSICAL_VERIFICATION_PENDING' },
  };

  let lastCreatedBatches: any[] = [];

  beforeEach(() => {
    lastCreatedBatches = [];
    prisma = {
      storeReceivingItem: {
        findFirst: jest.fn().mockResolvedValue(driverLine),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...driverLine, ...data, batches: [] })),
      },
      storeReceivingItemBatch: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockImplementation(({ data }: any) => { lastCreatedBatches = data; return Promise.resolve({ count: data.length }); }),
        findMany: jest.fn().mockImplementation(() => Promise.resolve(lastCreatedBatches)),
      },
      storeReceiving: {
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'sr-1', ...data, items: [] })),
      },
      item: {
        findFirst: jest.fn().mockResolvedValue({ itemCode: 'DRIVER-01', isBatchTracked: false, isSerialTracked: false }),
      },
      grnHeader: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn().mockImplementation((ops: any[]) => Promise.all(ops)),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    const shortageService = { upsertFromLine: jest.fn().mockResolvedValue(undefined) };
    service = new PhysicalVerificationService(prisma, audit, shortageService as any);
  });

  describe('MANUAL TEST 1 - exact match', () => {
    it('1000 expected, 1000 actual -> QUANTITY_VERIFIED, difference 0', async () => {
      const r = await service.verifyLine('line-driver', { actualQty: 1000, actualUom: 'PCS' } as any, user);
      expect(r.result).toBe('QUANTITY_VERIFIED');
      expect(r.differenceQty).toBe(0);
      expect(r.shortQty).toBe(0);
      expect(r.excessQty).toBe(0);
    });
  });

  describe('MANUAL TEST 2 - short quantity', () => {
    it('1000 expected, 980 actual -> SHORT_QUANTITY, short 20, difference -20', async () => {
      const r = await service.verifyLine('line-driver', { actualQty: 980, actualUom: 'PCS' } as any, user);
      expect(r.result).toBe('SHORT_QUANTITY');
      expect(r.differenceQty).toBe(-20);
      expect(r.shortQty).toBe(20);
      expect(r.excessQty).toBe(0);
    });
  });

  describe('MANUAL TEST 3 - excess quantity', () => {
    it('1000 expected, 1025 actual -> EXCESS_QUANTITY, excess 25, difference +25', async () => {
      const r = await service.verifyLine('line-driver', { actualQty: 1025, actualUom: 'PCS' } as any, user);
      expect(r.result).toBe('EXCESS_QUANTITY');
      expect(r.differenceQty).toBe(25);
      expect(r.excessQty).toBe(25);
      expect(r.shortQty).toBe(0);
    });
  });

  describe('MANUAL TEST 4 - wrong material', () => {
    it('materialMismatch flag forces MATERIAL_MISMATCH even when quantities match exactly (1000=1000)', async () => {
      const r = await service.verifyLine('line-driver', { actualQty: 1000, actualUom: 'PCS', materialMismatch: true } as any, user);
      expect(r.result).toBe('MATERIAL_MISMATCH');
      expect(r.differenceQty).toBeNull();
    });
  });

  describe('MANUAL TEST 5 - UOM mismatch', () => {
    it('expected PCS, entered KG -> UOM_MISMATCH, never numerically compared', async () => {
      const r = await service.verifyLine('line-driver', { actualQty: 1000, actualUom: 'KG' } as any, user);
      expect(r.result).toBe('UOM_MISMATCH');
      expect(r.differenceQty).toBeNull();
    });
  });

  describe('MANUAL TEST 6 - multiple batches reconcile', () => {
    it('batch A 600 + batch B 400 = actual 1000 -> passes, both batches preserved separately', async () => {
      prisma.item.findFirst.mockResolvedValue({ itemCode: 'DRIVER-01', isBatchTracked: true });
      const r = await service.verifyLine('line-driver', {
        actualQty: 1000, actualUom: 'PCS',
        batches: [{ batchNumber: 'A', quantity: 600 }, { batchNumber: 'B', quantity: 400 }],
      } as any, user);
      expect(r.result).toBe('QUANTITY_VERIFIED');
      expect(prisma.storeReceivingItemBatch.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.arrayContaining([
          expect.objectContaining({ batchNumber: 'A', quantity: 600 }),
          expect.objectContaining({ batchNumber: 'B', quantity: 400 }),
        ]) }),
      );
    });
  });

  describe('MANUAL TEST 7 - batch reconciliation failure', () => {
    it('batch total 950 vs actual 1000 -> blocked, unreconciled 50', async () => {
      prisma.item.findFirst.mockResolvedValue({ itemCode: 'DRIVER-01', isBatchTracked: true });
      await expect(service.verifyLine('line-driver', {
        actualQty: 1000, actualUom: 'PCS',
        batches: [{ batchNumber: 'A', quantity: 600 }, { batchNumber: 'B', quantity: 350 }],
      } as any, user)).rejects.toThrow(/unreconciled: 50/);
    });
  });

  describe('MANUAL TEST 8 - visible damage recorded separately', () => {
    it('damagedQty is stored alongside actualVerifiedQty without changing the quantity result', async () => {
      const r = await service.verifyLine('line-driver', { actualQty: 1000, actualUom: 'PCS', damagedQty: 20 } as any, user);
      expect(r.damagedQty).toBe(20);
      expect(r.actualVerifiedQty).toBe(1000);
      expect(r.result).toBe('QUANTITY_VERIFIED');
    });
  });

  describe('MANUAL TEST 9/10/11 - no inventory, no QC, no GRN', () => {
    it('never touches stockBalance/stockLedger/productionQc/grnHeader.create - only reads grnHeader for correction guard', async () => {
      await service.verifyLine('line-driver', { actualQty: 1000, actualUom: 'PCS' } as any, user);
      expect(prisma.stockBalance).toBeUndefined();
      expect(prisma.stockLedger).toBeUndefined();
      expect(prisma.productionQc).toBeUndefined();
      expect(prisma.grnHeader.create).toBeUndefined();
    });
  });

  describe('MANUAL TEST 12 - zero actual quantity', () => {
    it('actual 0 vs expected 1000 -> FULL_SHORT, not silently verified', async () => {
      const r = await service.verifyLine('line-driver', { actualQty: 0, actualUom: 'PCS' } as any, user);
      expect(r.result).toBe('FULL_SHORT');
    });
  });

  describe('MANUAL TEST 13 - negative quantity blocked', () => {
    it('-5 is rejected with BadRequestException', async () => {
      await expect(service.verifyLine('line-driver', { actualQty: -5, actualUom: 'PCS' } as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('MANUAL TEST 14 - decimal precision for weight-based material', () => {
    it('KG allows decimals: 100 expected, 98.75 actual -> SHORT_QUANTITY, actual preserved exactly (not rounded)', async () => {
      prisma.storeReceivingItem.findFirst.mockResolvedValue({ ...driverLine, uom: 'KG', expectedQty: 100 });
      const r = await service.verifyLine('line-driver', { actualQty: 98.75, actualUom: 'KG' } as any, user);
      expect(r.actualVerifiedQty).toBe(98.75);
      expect(r.result).toBe('SHORT_QUANTITY');
      expect(r.shortQty).toBeCloseTo(1.25);
    });
  });

  describe('MANUAL TEST 15 - fractional PCS blocked', () => {
    it('999.5 PCS is rejected - PCS does not permit fractional quantities', async () => {
      await expect(service.verifyLine('line-driver', { actualQty: 999.5, actualUom: 'PCS' } as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('length-based material (MTR)', () => {
    it('500 expected, 495 measured -> SHORT_QUANTITY, actual preserved as 495', async () => {
      prisma.storeReceivingItem.findFirst.mockResolvedValue({ ...driverLine, uom: 'MTR', expectedQty: 500 });
      const r = await service.verifyLine('line-driver', { actualQty: 495, actualUom: 'MTR' } as any, user);
      expect(r.actualVerifiedQty).toBe(495);
      expect(r.result).toBe('SHORT_QUANTITY');
      expect(r.shortQty).toBe(5);
    });
  });

  describe('actual quantity is never auto-populated from expected', () => {
    it('the service only ever writes what verifyLine was explicitly called with, never line.expectedQty', async () => {
      const r = await service.verifyLine('line-driver', { actualQty: 700, actualUom: 'PCS' } as any, user);
      expect(r.actualVerifiedQty).toBe(700);
      expect(r.actualVerifiedQty).not.toBe(driverLine.expectedQty);
    });
  });

  describe('multiple lines / mixed statuses at the header level', () => {
    it('completeVerification sets VERIFIED only when every line is QUANTITY_VERIFIED', async () => {
      prisma.storeReceiving.findFirst.mockResolvedValue({
        id: 'sr-1', companyId: 'company-1', status: 'PHYSICAL_VERIFICATION_PENDING',
        items: [{ result: 'QUANTITY_VERIFIED' }, { result: 'QUANTITY_VERIFIED' }],
      });
      const r = await service.completeVerification('sr-1', user);
      expect(r.status).toBe('VERIFIED');
    });

    it('completeVerification sets VERIFIED_WITH_DISCREPANCY when any line has a discrepancy (mixed short/excess/match)', async () => {
      prisma.storeReceiving.findFirst.mockResolvedValue({
        id: 'sr-1', companyId: 'company-1', status: 'PHYSICAL_VERIFICATION_PENDING',
        items: [{ result: 'QUANTITY_VERIFIED' }, { result: 'SHORT_QUANTITY' }, { result: 'EXCESS_QUANTITY' }],
      });
      const r = await service.completeVerification('sr-1', user);
      expect(r.status).toBe('VERIFIED_WITH_DISCREPANCY');
    });

    it('blocks completion when any line is still unverified', async () => {
      prisma.storeReceiving.findFirst.mockResolvedValue({
        id: 'sr-1', companyId: 'company-1', status: 'PHYSICAL_VERIFICATION_PENDING',
        items: [{ result: 'QUANTITY_VERIFIED' }, { result: null }],
      });
      await expect(service.completeVerification('sr-1', user)).rejects.toThrow(/still pending/);
    });
  });

  describe('MANUAL TEST 71 - idempotent completion (duplicate-click safe)', () => {
    it('calling completeVerification on an already-VERIFIED receipt returns the current state without reprocessing', async () => {
      const alreadyVerified = { id: 'sr-1', companyId: 'company-1', status: 'VERIFIED', items: [] };
      prisma.storeReceiving.findFirst.mockResolvedValue(alreadyVerified);
      const r = await service.completeVerification('sr-1', user);
      expect(r).toBe(alreadyVerified);
      expect(prisma.storeReceiving.update).not.toHaveBeenCalled();
    });
  });

  describe('MANUAL TEST 16 - controlled correction', () => {
    it('correcting a verified line from 980 to 990 requires a reason and produces old/new audit values', async () => {
      prisma.storeReceivingItem.findFirst.mockResolvedValue({
        ...driverLine, actualVerifiedQty: 980, actualUom: 'PCS', result: 'SHORT_QUANTITY', verifiedAt: new Date(),
      });
      const r = await service.correctLine('line-driver', { actualQty: 990, reason: 'recount found 10 more pcs' } as any, user);
      expect(r.actualVerifiedQty).toBe(990);
      expect(r.result).toBe('SHORT_QUANTITY');
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE',
        oldValues: expect.objectContaining({ actualVerifiedQty: 980 }),
        newValues: expect.objectContaining({ actualVerifiedQty: 990, reason: 'recount found 10 more pcs' }),
      }));
    });

    it('blocks correction once a GRN already exists for this receipt (protects downstream data)', async () => {
      prisma.storeReceivingItem.findFirst.mockResolvedValue({
        ...driverLine, actualVerifiedQty: 980, result: 'SHORT_QUANTITY', verifiedAt: new Date(),
      });
      prisma.grnHeader.findFirst.mockResolvedValue({ id: 'grn-1' });
      await expect(service.correctLine('line-driver', { actualQty: 990, reason: 'x' } as any, user)).rejects.toThrow(/discrepancy\/reversal/);
    });

    it('rejects correction on a line that was never verified in the first place', async () => {
      prisma.storeReceivingItem.findFirst.mockResolvedValue({ ...driverLine, verifiedAt: null });
      await expect(service.correctLine('line-driver', { actualQty: 990, reason: 'x' } as any, user)).rejects.toThrow(/use verify, not correct/);
    });
  });

  describe('STORE-001 regression', () => {
    it('throws NotFoundException for a line that does not exist', async () => {
      prisma.storeReceivingItem.findFirst.mockResolvedValue(null);
      await expect(service.verifyLine('missing', { actualQty: 1, actualUom: 'PCS' } as any, user)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for a receipt that does not exist on completeVerification', async () => {
      prisma.storeReceiving.findFirst.mockResolvedValue(null);
      await expect(service.completeVerification('missing', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('audit', () => {
    it('logs verifyLine with old and new values', async () => {
      await service.verifyLine('line-driver', { actualQty: 980, actualUom: 'PCS' } as any, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        tableName: 'store_receiving_items', recordId: 'line-driver', action: 'UPDATE',
        newValues: expect.objectContaining({ actualVerifiedQty: 980, result: 'SHORT_QUANTITY' }),
      }));
    });
  });
});
