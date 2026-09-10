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
  let workflows: any;
  let stockLedger: any;

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
      grnHeader: { findFirst: jest.fn().mockResolvedValue({ id: 'grn-1', warehouseId: 'wh-1' }) },
      $transaction: jest.fn().mockImplementation((ops: any) => Promise.all(ops)),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    workflows = {
      submit: jest.fn().mockResolvedValue({ request: { id: 'approval-1' } }),
      act: jest.fn().mockResolvedValue(undefined),
    };
    stockLedger = { postTransaction: jest.fn().mockResolvedValue(undefined) };
    service = new GrnDiscrepancyService(prisma, audit, notifications, workflows, stockLedger);
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

describe('GrnDiscrepancyService Phase B - review and resolution', () => {
  let service: GrnDiscrepancyService;
  let prisma: any;
  let audit: any;
  let notifications: any;
  let workflows: any;
  let stockLedger: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  let lastRecord: any;
  let lastGrnItem: any;

  beforeEach(() => {
    lastRecord = {
      id: 'dis-1', companyId: 'company-1', grnItemId: 'gi-1', grnId: 'grn-1',
      itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', affectedQty: 20,
      purchaseStatus: 'NOTIFIED', qcStatus: 'PENDING', status: 'OPEN',
      resolution: null, resolutionApprovalRequestId: null,
    };
    lastGrnItem = { id: 'gi-1', heldQty: 20 };

    prisma = {
      grnItemDiscrepancy: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(lastRecord)),
        update: jest.fn().mockImplementation(({ data }: any) => {
          lastRecord = { ...lastRecord, ...data };
          return Promise.resolve(lastRecord);
        }),
      },
      grnItem: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(lastGrnItem)),
        update: jest.fn().mockImplementation(({ data }: any) => {
          if (data.heldQty?.decrement !== undefined) {
            lastGrnItem = { ...lastGrnItem, heldQty: lastGrnItem.heldQty - data.heldQty.decrement };
          }
          return Promise.resolve(lastGrnItem);
        }),
      },
      grnHeader: { findFirst: jest.fn().mockResolvedValue({ id: 'grn-1', warehouseId: 'wh-1' }) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    workflows = {
      submit: jest.fn().mockResolvedValue({ request: { id: 'approval-1' } }),
      act: jest.fn().mockResolvedValue(undefined),
    };
    stockLedger = { postTransaction: jest.fn().mockResolvedValue(undefined) };
    service = new GrnDiscrepancyService(prisma, audit, notifications, workflows, stockLedger);
  });

  describe('purchaseReview', () => {
    it('records purchaseStatus independently of qcStatus', async () => {
      const r = await service.purchaseReview('dis-1', { purchaseStatus: 'COMMERCIALLY_ACCEPTED' } as any, user);
      expect(r.purchaseStatus).toBe('COMMERCIALLY_ACCEPTED');
      expect(r.qcStatus).toBe('PENDING');
    });

    it('blocks review on an already-resolved discrepancy', async () => {
      lastRecord = { ...lastRecord, status: 'RESOLVED' };
      await expect(service.purchaseReview('dis-1', { purchaseStatus: 'COMMERCIALLY_ACCEPTED' } as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('qcReview', () => {
    it('records the QC decision when qcStatus is PENDING', async () => {
      const r = await service.qcReview('dis-1', { qcStatus: 'REJECTED' } as any, user);
      expect(r.qcStatus).toBe('REJECTED');
    });

    it('blocks QC review when the discrepancy never required QC (qcStatus NOT_REQUIRED)', async () => {
      lastRecord = { ...lastRecord, qcStatus: 'NOT_REQUIRED' };
      await expect(service.qcReview('dis-1', { qcStatus: 'ACCEPTED' } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('blocks QC review when already decided (idempotent, no re-decision)', async () => {
      lastRecord = { ...lastRecord, qcStatus: 'ACCEPTED' };
      await expect(service.qcReview('dis-1', { qcStatus: 'REJECTED' } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('QC decision and Purchase decision are independent - QC rejecting does not touch purchaseStatus', async () => {
      lastRecord = { ...lastRecord, purchaseStatus: 'COMMERCIALLY_ACCEPTED' };
      const r = await service.qcReview('dis-1', { qcStatus: 'REJECTED' } as any, user);
      expect(r.purchaseStatus).toBe('COMMERCIALLY_ACCEPTED');
      expect(r.qcStatus).toBe('REJECTED');
    });
  });

  describe('requestResolution', () => {
    it('submits an approval request and stores its id, status moves to PURCHASE_REVIEW', async () => {
      const r = await service.requestResolution('dis-1', { resolution: 'ACCEPT_AUTHORIZED', reason: 'Alternate approved packaging' }, user);
      expect(workflows.submit).toHaveBeenCalledWith(expect.objectContaining({ documentType: 'GRN_DISCREPANCY_RESOLUTION', documentId: 'dis-1' }), user);
      expect(r.resolutionApprovalRequestId).toBe('approval-1');
      expect(r.status).toBe('PURCHASE_REVIEW');
    });

    it('blocks a second resolution request while one is already pending', async () => {
      lastRecord = { ...lastRecord, resolutionApprovalRequestId: 'approval-existing' };
      await expect(service.requestResolution('dis-1', { resolution: 'ACCEPT_AUTHORIZED', reason: 'x' }, user)).rejects.toThrow(/already pending/);
    });

    it('blocks requesting resolution on an already-resolved discrepancy', async () => {
      lastRecord = { ...lastRecord, status: 'RESOLVED' };
      await expect(service.requestResolution('dis-1', { resolution: 'RECLASSIFY', reason: 'x' }, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('decideResolution', () => {
    beforeEach(() => {
      lastRecord = { ...lastRecord, resolution: 'ACCEPT_AUTHORIZED', resolutionApprovalRequestId: 'approval-1', status: 'PURCHASE_REVIEW' };
    });

    it('on APPROVED + ACCEPT_AUTHORIZED: decrements heldQty and posts a DISCREPANCY_RELEASE stock transaction', async () => {
      const r = await service.decideResolution('dis-1', { action: 'APPROVED' }, user);
      expect(lastGrnItem.heldQty).toBe(0);
      expect(stockLedger.postTransaction).toHaveBeenCalledWith(expect.objectContaining({
        transactionType: 'DISCREPANCY_RELEASE', inQty: 20, warehouseId: 'wh-1',
      }));
      expect(r.status).toBe('RESOLVED');
    });

    it('on APPROVED + RECLASSIFY: resolves without touching stock or heldQty', async () => {
      lastRecord = { ...lastRecord, resolution: 'RECLASSIFY' };
      const r = await service.decideResolution('dis-1', { action: 'APPROVED' }, user);
      expect(stockLedger.postTransaction).not.toHaveBeenCalled();
      expect(lastGrnItem.heldQty).toBe(20);
      expect(r.status).toBe('RESOLVED');
    });

    it('on REJECTED: reopens the discrepancy and clears the requested resolution, no stock impact', async () => {
      const r = await service.decideResolution('dis-1', { action: 'REJECTED', comments: 'Not approved' }, user);
      expect(r.status).toBe('OPEN');
      expect(r.resolution).toBeNull();
      expect(r.resolutionApprovalRequestId).toBeNull();
      expect(stockLedger.postTransaction).not.toHaveBeenCalled();
    });

    it('blocks deciding when no resolution request is pending', async () => {
      lastRecord = { ...lastRecord, resolutionApprovalRequestId: null };
      await expect(service.decideResolution('dis-1', { action: 'APPROVED' }, user)).rejects.toThrow(/No resolution request/);
    });
  });

  describe('resolveDirect', () => {
    it('resolves RETURN_TO_VENDOR without releasing heldQty - material stays physically controlled', async () => {
      const r = await service.resolveDirect('dis-1', { resolution: 'RETURN_TO_VENDOR', reason: 'Wrong material, vendor to collect' }, user);
      expect(r.resolution).toBe('RETURN_TO_VENDOR');
      expect(r.status).toBe('RESOLVED');
      expect(prisma.grnItem.update).not.toHaveBeenCalled();
      expect(stockLedger.postTransaction).not.toHaveBeenCalled();
    });

    it('resolves HOLD_INVESTIGATION the same way - no stock movement', async () => {
      const r = await service.resolveDirect('dis-1', { resolution: 'HOLD_INVESTIGATION', reason: 'Pending supplier response' }, user);
      expect(r.status).toBe('RESOLVED');
      expect(stockLedger.postTransaction).not.toHaveBeenCalled();
    });

    it('blocks resolving an already-resolved discrepancy again', async () => {
      lastRecord = { ...lastRecord, status: 'RESOLVED' };
      await expect(service.resolveDirect('dis-1', { resolution: 'REPLACE', reason: 'x' }, user)).rejects.toThrow(BadRequestException);
    });
  });
});

describe('GrnDiscrepancyService.segregate - physical hold bin assignment', () => {
  let service: GrnDiscrepancyService;
  let prisma: any;
  let audit: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  let lastRecord: any;
  let lastBin: any;

  beforeEach(() => {
    lastRecord = {
      id: 'dis-1', companyId: 'company-1', grnId: 'grn-1', itemCode: 'DRIVER-01',
      affectedQty: 20, holdBinId: null, status: 'OPEN',
    };
    lastBin = { id: 'bin-1', companyId: 'company-1', warehouseId: 'wh-1', code: 'HOLD-01', status: 'EMPTY', currentQty: 0, maxQty: 100, itemCode: null };

    prisma = {
      grnItemDiscrepancy: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(lastRecord)),
        update: jest.fn().mockImplementation(({ data }: any) => {
          lastRecord = { ...lastRecord, ...data };
          return Promise.resolve(lastRecord);
        }),
      },
      grnHeader: { findFirst: jest.fn().mockResolvedValue({ id: 'grn-1', warehouseId: 'wh-1' }) },
      warehouseBin: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(lastBin)),
        update: jest.fn().mockImplementation(({ data }: any) => {
          lastBin = { ...lastBin, ...data };
          return Promise.resolve(lastBin);
        }),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new GrnDiscrepancyService(prisma, audit, {} as any, {} as any, {} as any);
  });

  it('assigns the bin, sets it BLOCKED, and increments its currentQty by affectedQty', async () => {
    const r = await service.segregate('dis-1', { binId: 'bin-1' }, user);
    expect(r.holdBinId).toBe('bin-1');
    expect(r.status).toBe('SEGREGATED');
    expect(lastBin.status).toBe('BLOCKED');
    expect(lastBin.currentQty).toBe(20);
    expect(lastBin.itemCode).toBe('DRIVER-01');
  });

  it('records segregatedById and segregatedAt', async () => {
    const r = await service.segregate('dis-1', { binId: 'bin-1' }, user);
    expect(r.segregatedById).toBe(user.id);
    expect(r.segregatedAt).toBeInstanceOf(Date);
  });

  it('allows segregating into a bin already BLOCKED for the same item (mixed status batch)', async () => {
    lastBin = { ...lastBin, status: 'BLOCKED', itemCode: 'DRIVER-01', currentQty: 10 };
    const r = await service.segregate('dis-1', { binId: 'bin-1' }, user);
    expect(r.holdBinId).toBe('bin-1');
    expect(lastBin.currentQty).toBe(30);
  });

  it('rejects a bin that already holds normal unrestricted stock (status PARTIAL) - never mix held material into normal RM', async () => {
    lastBin = { ...lastBin, status: 'PARTIAL', itemCode: 'OTHER-ITEM', currentQty: 50 };
    await expect(service.segregate('dis-1', { binId: 'bin-1' }, user)).rejects.toThrow(/not available for hold/);
  });

  it('rejects a BLOCKED bin already holding a different held item', async () => {
    lastBin = { ...lastBin, status: 'BLOCKED', itemCode: 'DIFFERENT-ITEM', currentQty: 5 };
    await expect(service.segregate('dis-1', { binId: 'bin-1' }, user)).rejects.toThrow(/not available for hold/);
  });

  it('rejects a bin from a different warehouse than the GRN', async () => {
    lastBin = { ...lastBin, warehouseId: 'wh-other' };
    await expect(service.segregate('dis-1', { binId: 'bin-1' }, user)).rejects.toThrow(/same warehouse/);
  });

  it('rejects exceeding the bin capacity', async () => {
    lastBin = { ...lastBin, maxQty: 10 };
    await expect(service.segregate('dis-1', { binId: 'bin-1' }, user)).rejects.toThrow(/can only hold/);
  });

  it('blocks segregating the same discrepancy twice', async () => {
    lastRecord = { ...lastRecord, holdBinId: 'bin-already' };
    await expect(service.segregate('dis-1', { binId: 'bin-1' }, user)).rejects.toThrow(/already segregated/);
  });

  it('blocks segregating an already-resolved discrepancy', async () => {
    lastRecord = { ...lastRecord, status: 'RESOLVED' };
    await expect(service.segregate('dis-1', { binId: 'bin-1' }, user)).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException for a bin that does not exist', async () => {
    prisma.warehouseBin.findFirst.mockResolvedValue(null);
    await expect(service.segregate('dis-1', { binId: 'missing' }, user)).rejects.toThrow(NotFoundException);
  });
});
