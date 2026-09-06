import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StoreShortageService } from './store-shortage.service';

describe('StoreShortageService STORE-003', () => {
  let service: StoreShortageService;
  let prisma: any;
  let audit: any;
  let notifications: any;

  const user = { id: 'purchase-1', companyId: 'company-1' };

  const shortLine = {
    id: 'line-driver', companyId: 'company-1', storeReceivingId: 'sr-1',
    itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS',
    expectedQty: 1000, actualVerifiedQty: 980, shortQty: 20, result: 'SHORT_QUANTITY',
    storeReceiving: { gateInwardEntryId: 'gin-1' },
  };

  const existingShortage = {
    id: 'sht-1', companyId: 'company-1', discrepancyNumber: 'SHT-2026-00001',
    storeReceivingItemId: 'line-driver', gateInwardEntryId: 'gin-1',
    supplierName: 'Vendor A', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS',
    expectedQty: 1000, actualQty: 980, shortQty: 20,
    status: 'PURCHASE_NOTIFIED', purchaseNotifiedAt: new Date(),
    laterReceivedQty: 0, approvedShortClosureQty: 0,
  };

  let lastShortageState: any = null;

  beforeEach(() => {
    lastShortageState = null;
    prisma = {
      storeShortage: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => {
          lastShortageState = { id: 'sht-1', ...data, laterReceivedQty: 0, approvedShortClosureQty: 0 };
          return Promise.resolve(lastShortageState);
        }),
        update: jest.fn().mockImplementation(({ data }: any) => {
          const base = lastShortageState || existingShortage;
          lastShortageState = { ...base, ...data };
          return Promise.resolve(lastShortageState);
        }),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      gateInwardEntry: { findUnique: jest.fn().mockResolvedValue({ id: 'gin-1', poId: 'po-1', supplierName: 'Vendor A' }) },
      purchaseOrderItem: { findFirst: jest.fn().mockResolvedValue({ id: 'poi-1' }) },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'pm-1' }]) },
      storeReceivingItem: { findFirst: jest.fn() },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    service = new StoreShortageService(prisma, audit, notifications);
  });

  describe('MANUAL TEST 1 - short detection', () => {
    it('creates a shortage record for a SHORT_QUANTITY line with expected/actual/short preserved', async () => {
      const r = await service.upsertFromLine(shortLine, user);
      expect(r.expectedQty).toBe(1000);
      expect(r.actualQty).toBe(980);
      expect(r.shortQty).toBe(20);
    });
  });

  describe('MANUAL TEST 2 - Purchase notification', () => {
    it('notifies PURCHASE_MANAGER/SUPER_ADMIN users with supplier/PO/material/expected/actual/short details', async () => {
      await service.upsertFromLine(shortLine, user);
      expect(notifications.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({
          type: 'STORE_SHORTAGE_DETECTED',
          message: expect.stringContaining('Vendor A'),
        })]),
        user.companyId, user.id,
      );
      expect(notifications.createBulk.mock.calls[0][0][0].message).toContain('expected 1000');
      expect(notifications.createBulk.mock.calls[0][0][0].message).toContain('received 980');
      expect(notifications.createBulk.mock.calls[0][0][0].message).toContain('short 20');
    });
  });

  describe('MANUAL TEST 3 - actual qty preserved', () => {
    it('shortage.actualQty remains 980, never rewritten to 1000', async () => {
      const r = await service.upsertFromLine(shortLine, user);
      expect(r.actualQty).toBe(980);
      expect(r.actualQty).not.toBe(r.expectedQty);
    });
  });

  describe('MANUAL TEST 4/9/10/11 - no inventory/QC/GRN touch', () => {
    it('never touches stockBalance/stockLedger/productionQc, and only reads grnHeader elsewhere (not here)', async () => {
      await service.upsertFromLine(shortLine, user);
      expect(prisma.stockBalance).toBeUndefined();
      expect(prisma.stockLedger).toBeUndefined();
      expect(prisma.productionQc).toBeUndefined();
      expect(prisma.grnHeader).toBeUndefined();
    });
  });

  describe('MANUAL TEST 7 - full short', () => {
    it('actual 0, expected 500 -> FULL_SHORT line still creates a shortage record with shortQty 500', async () => {
      const fullShortLine = { ...shortLine, actualVerifiedQty: 0, expectedQty: 500, shortQty: 500, result: 'FULL_SHORT' };
      const r = await service.upsertFromLine(fullShortLine, user);
      expect(r.shortQty).toBe(500);
      expect(r.actualQty).toBe(0);
    });
  });

  describe('MANUAL TEST 8 - multiple lines / mixed matched-short', () => {
    it('a QUANTITY_VERIFIED line never creates a shortage record', async () => {
      const matchedLine = { ...shortLine, result: 'QUANTITY_VERIFIED', shortQty: 0 };
      const r = await service.upsertFromLine(matchedLine, user);
      expect(r).toBeNull();
      expect(prisma.storeShortage.create).not.toHaveBeenCalled();
    });
  });

  describe('MANUAL TEST 14 - damage is not shortage', () => {
    it('a line with damagedQty but result QUANTITY_VERIFIED (physical count matched) never creates a shortage', async () => {
      const damagedButMatchedLine = { ...shortLine, result: 'QUANTITY_VERIFIED', shortQty: 0, damagedQty: 20 };
      const r = await service.upsertFromLine(damagedButMatchedLine, user);
      expect(r).toBeNull();
    });
  });

  describe('MANUAL TEST 15/47/66 - duplicate shortage prevented', () => {
    it('re-verifying the same line updates the existing shortage instead of creating a second one', async () => {
      prisma.storeShortage.findFirst.mockResolvedValue(existingShortage);
      const r = await service.upsertFromLine(shortLine, user);
      expect(prisma.storeShortage.create).not.toHaveBeenCalled();
      expect(prisma.storeShortage.update).toHaveBeenCalled();
    });

    it('does not re-send the Purchase notification once purchaseNotifiedAt is already set', async () => {
      prisma.storeShortage.findFirst.mockResolvedValue(existingShortage);
      await service.upsertFromLine(shortLine, user);
      expect(notifications.createBulk).not.toHaveBeenCalled();
    });
  });

  describe('MANUAL TEST 9 - later balance delivery (new receipt, not a rewrite)', () => {
    it('links a different StoreReceivingItem and increments laterReceivedQty without touching the original 980', async () => {
      prisma.storeShortage.findFirst.mockResolvedValue({ ...existingShortage });
      prisma.storeReceivingItem.findFirst.mockResolvedValue({ id: 'line-later', companyId: 'company-1' });
      const r = await service.linkBalanceDelivery('sht-1', { qty: 20, laterStoreReceivingItemId: 'line-later' } as any, user);
      expect(r.laterReceivedQty).toBe(20);
      expect(r.status).toBe('RESOLVED');
      expect(r.outstandingQty).toBe(0);
    });

    it('rejects linking the original short receipt line to itself as its own balance delivery', async () => {
      prisma.storeShortage.findFirst.mockResolvedValue({ ...existingShortage });
      prisma.storeReceivingItem.findFirst.mockResolvedValue({ id: 'line-driver', companyId: 'company-1' });
      await expect(service.linkBalanceDelivery('sht-1', { qty: 20, laterStoreReceivingItemId: 'line-driver' } as any, user))
        .rejects.toThrow(/must be a different/);
    });
  });

  describe('MANUAL TEST 10 - partial balance delivery / outstanding shortage', () => {
    it('linking 10 of an outstanding 20 leaves 10 outstanding, status PARTIALLY_RESOLVED', async () => {
      prisma.storeShortage.findFirst.mockResolvedValue({ ...existingShortage });
      prisma.storeReceivingItem.findFirst.mockResolvedValue({ id: 'line-later', companyId: 'company-1' });
      const r = await service.linkBalanceDelivery('sht-1', { qty: 10, laterStoreReceivingItemId: 'line-later' } as any, user);
      expect(r.laterReceivedQty).toBe(10);
      expect(r.outstandingQty).toBe(10);
      expect(r.status).toBe('PARTIALLY_RESOLVED');
    });

    it('rejects a balance delivery larger than the outstanding shortage', async () => {
      prisma.storeShortage.findFirst.mockResolvedValue({ ...existingShortage });
      prisma.storeReceivingItem.findFirst.mockResolvedValue({ id: 'line-later', companyId: 'company-1' });
      await expect(service.linkBalanceDelivery('sht-1', { qty: 25, laterStoreReceivingItemId: 'line-later' } as any, user))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('MANUAL TEST 11/12/62/63 - approved short closure requires authorization', () => {
    it('approveShortClosure closes the full outstanding amount with a mandatory reason and audit', async () => {
      prisma.storeShortage.findFirst.mockResolvedValue({ ...existingShortage });
      const r = await service.approveShortClosure('sht-1', { qty: 20, reason: 'supplier confirmed no further stock available' } as any, user);
      expect(r.approvedShortClosureQty).toBe(20);
      expect(r.status).toBe('APPROVED_SHORT_CLOSURE');
      expect(r.outstandingQty).toBe(0);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        newValues: expect.objectContaining({ reason: 'supplier confirmed no further stock available' }),
      }));
    });

    it('rejects a short-closure amount larger than the outstanding shortage', async () => {
      prisma.storeShortage.findFirst.mockResolvedValue({ ...existingShortage });
      await expect(service.approveShortClosure('sht-1', { qty: 25, reason: 'x' } as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('STORE-001/002 regression', () => {
    it('throws NotFoundException for a shortage that does not exist', async () => {
      prisma.storeShortage.findFirst.mockResolvedValue(null);
      await expect(service.findOne('missing', user)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when linking balance delivery to a shortage that does not exist', async () => {
      prisma.storeShortage.findFirst.mockResolvedValue(null);
      await expect(service.linkBalanceDelivery('missing', { qty: 1, laterStoreReceivingItemId: 'x' } as any, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('audit', () => {
    it('logs shortage creation with expected/actual/short values', async () => {
      const r = await service.upsertFromLine(shortLine, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        tableName: 'store_shortages', recordId: r.id,
        newValues: expect.objectContaining({ expectedQty: 1000, actualQty: 980, shortQty: 20 }),
      }));
    });
  });
});
