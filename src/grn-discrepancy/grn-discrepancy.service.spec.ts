import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GrnDiscrepancyService } from './grn-discrepancy.service';

describe('GrnDiscrepancyService (STORE-005)', () => {
  let service: GrnDiscrepancyService;
  let prisma: any;
  let audit: any;
  let notifications: any;

  const user = { id: 'purchase-1', companyId: 'company-1' };

  const grn = { id: 'grn-1', status: 'DRAFT', poId: 'po-1', gateInwardEntryId: 'gin-1', po: { vendor: { name: 'Vendor A' } } };
  const grnItem = { id: 'gi-1', companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', receivedQty: 1000, heldQty: 0, grn };

  let lastDiscrepancy: any = null;
  let lastGrnItem: any = { ...grnItem };

  beforeEach(() => {
    lastDiscrepancy = null;
    lastGrnItem = { ...grnItem };
    prisma = {
      grnItem: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(lastGrnItem)),
        update: jest.fn().mockImplementation(({ data }: any) => {
          if (data.heldQty?.increment !== undefined) {
            lastGrnItem = { ...lastGrnItem, heldQty: lastGrnItem.heldQty + data.heldQty.increment };
          } else if (data.heldQty !== undefined) {
            lastGrnItem = { ...lastGrnItem, heldQty: data.heldQty };
          }
          return Promise.resolve(lastGrnItem);
        }),
      },
      grnItemDiscrepancy: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => {
          lastDiscrepancy = { id: 'dis-1', ...data };
          return Promise.resolve(lastDiscrepancy);
        }),
        update: jest.fn().mockImplementation(({ data }: any) => {
          lastDiscrepancy = { ...lastDiscrepancy, ...data };
          return Promise.resolve(lastDiscrepancy);
        }),
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(lastDiscrepancy)),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'pm-1' }]) },
      $transaction: jest.fn().mockImplementation((ops: any) => Promise.all(ops)),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    service = new GrnDiscrepancyService(prisma, audit, notifications);
  });

  describe('raise', () => {
    it('creates a discrepancy record with the affected qty and problem type', async () => {
      const r = await service.raise('gi-1', { affectedQty: 20, problemType: 'WRONG_MATERIAL' } as any, user);
      expect(r.affectedQty).toBe(20);
      expect(r.problemType).toBe('WRONG_MATERIAL');
    });

    it('preserves expected and physical material identity separately - never overwrites one with the other', async () => {
      const r = await service.raise('gi-1', { affectedQty: 1000, problemType: 'WRONG_MATERIAL', physicalItemCode: '9W-DRIVER', physicalItemName: '9W LED Driver' } as any, user);
      expect(r.itemCode).toBe('DRIVER-01');
      expect(r.physicalItemCode).toBe('9W-DRIVER');
    });

    it('sets qcStatus PENDING for VISIBLE_DAMAGE', async () => {
      const r = await service.raise('gi-1', { affectedQty: 20, problemType: 'VISIBLE_DAMAGE' } as any, user);
      expect(r.qcStatus).toBe('PENDING');
    });

    it('sets qcStatus PENDING for SPECIFICATION_MISMATCH', async () => {
      const r = await service.raise('gi-1', { affectedQty: 500, problemType: 'SPECIFICATION_MISMATCH' } as any, user);
      expect(r.qcStatus).toBe('PENDING');
    });

    it('sets qcStatus NOT_REQUIRED for WRONG_MATERIAL', async () => {
      const r = await service.raise('gi-1', { affectedQty: 20, problemType: 'WRONG_MATERIAL' } as any, user);
      expect(r.qcStatus).toBe('NOT_REQUIRED');
    });

    it('quantity match does not override wrong material identity', async () => {
      const r = await service.raise('gi-1', { affectedQty: 1000, problemType: 'WRONG_MATERIAL' } as any, user);
      expect(r.affectedQty).toBe(1000);
      expect(r.problemType).toBe('WRONG_MATERIAL');
    });

    it('increments GrnItem.heldQty by the affected qty', async () => {
      await service.raise('gi-1', { affectedQty: 20, problemType: 'VISIBLE_DAMAGE' } as any, user);
      expect(prisma.grnItem.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'gi-1' }, data: expect.objectContaining({ heldQty: { increment: 20 } }),
      }));
    });

    it('blocks raising a discrepancy once the GRN has left DRAFT', async () => {
      lastGrnItem = { ...grnItem, grn: { ...grn, status: 'IQC_PENDING' } };
      await expect(service.raise('gi-1', { affectedQty: 20, problemType: 'VISIBLE_DAMAGE' } as any, user)).rejects.toThrow(/DRAFT/);
    });

    it('blocks affected qty exceeding the physically applicable quantity still on the line', async () => {
      await expect(service.raise('gi-1', { affectedQty: 1100, problemType: 'VISIBLE_DAMAGE' } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('blocks a second discrepancy from exceeding what remains after an earlier one already claimed part of the line', async () => {
      lastGrnItem = { ...grnItem, heldQty: 980 };
      await expect(service.raise('gi-1', { affectedQty: 30, problemType: 'VISIBLE_DAMAGE' } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('supports partial damage: 20 flagged leaves 980 still available on the line', async () => {
      await service.raise('gi-1', { affectedQty: 20, problemType: 'VISIBLE_DAMAGE' } as any, user);
      expect(lastGrnItem.heldQty).toBe(20);
    });

    it('notifies Purchase with supplier/material/problem/affected-qty details', async () => {
      await service.raise('gi-1', { affectedQty: 20, problemType: 'VISIBLE_DAMAGE' } as any, user);
      const call = notifications.createBulk.mock.calls[0][0][0];
      expect(call.type).toBe('STORE_DISCREPANCY_RAISED');
      expect(call.message).toContain('Vendor A');
      expect(call.message).toContain('VISIBLE_DAMAGE');
      expect(call.message).toContain('affected 20');
    });

    it('throws NotFoundException for a GRN item that does not exist', async () => {
      prisma.grnItem.findFirst.mockResolvedValue(null);
      await expect(service.raise('missing', { affectedQty: 20, problemType: 'VISIBLE_DAMAGE' } as any, user)).rejects.toThrow(NotFoundException);
    });

    it('logs the audit trail', async () => {
      await service.raise('gi-1', { affectedQty: 20, problemType: 'VISIBLE_DAMAGE' } as any, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'grn_item_discrepancies', action: 'CREATE' }));
    });
  });

  describe('correct', () => {
    const existingDiscrepancy = { id: 'dis-1', companyId: 'company-1', grnItemId: 'gi-1', affectedQty: 20, qcStatus: 'PENDING' };

    it('adjusts affectedQty and the linked GrnItem.heldQty by the delta', async () => {
      lastDiscrepancy = existingDiscrepancy;
      lastGrnItem = { ...grnItem, heldQty: 20 };
      const r = await service.correct('dis-1', { affectedQty: 18, reason: 'Recount' }, user);
      expect(r.affectedQty).toBe(18);
      expect(lastGrnItem.heldQty).toBe(18);
    });

    it('blocks correction once QC has already inspected (ACCEPTED)', async () => {
      lastDiscrepancy = { ...existingDiscrepancy, qcStatus: 'ACCEPTED' };
      await expect(service.correct('dis-1', { affectedQty: 18, reason: 'Recount' }, user)).rejects.toThrow(/already been inspected/);
    });

    it('blocks correction once QC has already inspected (REJECTED)', async () => {
      lastDiscrepancy = { ...existingDiscrepancy, qcStatus: 'REJECTED' };
      await expect(service.correct('dis-1', { affectedQty: 18, reason: 'Recount' }, user)).rejects.toThrow(/already been inspected/);
    });

    it('throws NotFoundException for a discrepancy that does not exist', async () => {
      lastDiscrepancy = null;
      await expect(service.correct('missing', { affectedQty: 18, reason: 'x' }, user)).rejects.toThrow(NotFoundException);
    });

    it('requires and records a reason for the correction, logged to audit', async () => {
      lastDiscrepancy = existingDiscrepancy;
      lastGrnItem = { ...grnItem, heldQty: 20 };
      await service.correct('dis-1', { affectedQty: 18, reason: 'Recount confirmed 18, not 20' }, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        newValues: expect.objectContaining({ affectedQty: 18, reason: 'Recount confirmed 18, not 20' }),
      }));
    });
  });

  describe('findAll / findOne', () => {
    it('findAll filters by status when provided', async () => {
      await service.findAll(user, { status: 'OPEN' });
      expect(prisma.grnItemDiscrepancy.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'OPEN' }) }),
      );
    });

    it('findOne throws NotFoundException for a missing record', async () => {
      lastDiscrepancy = null;
      await expect(service.findOne('missing', user)).rejects.toThrow(NotFoundException);
    });
  });
});
