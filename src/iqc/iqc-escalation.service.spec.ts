import { IqcEscalationService } from './iqc-escalation.service';
import { ForbiddenException } from '@nestjs/common';

describe('IqcEscalationService.submitStageResult - IQC-054 suggestion-only escalation', () => {
  let service: IqcEscalationService;
  let prisma: any;
  let audit: any;
  let notifications: any;
  let rejectedStockSvc: any;
  let stockLedger: any;
  let debitNotes: any;

  const baseItem = {
    id: 'iqc-item-1',
    iqcId: 'iqc-1',
    itemName: 'LED Driver',
    receivedQty: 100,
    template: null,
    stageResults: [],
    iqc: { iqcNumber: 'IQC-2026-0001', grn: { grnNumber: 'GRN-1', po: null } },
  };

  function userWith(role: string, additionalRoles: string[] = []) {
    return { id: 'u-1', companyId: 'company-1', role, additionalRoles };
  }

  beforeEach(() => {
    prisma = {
      iqcItem: {
        findFirst: jest.fn().mockResolvedValue({ ...baseItem }),
        update: jest.fn().mockResolvedValue({}),
      },
      iqcStageResult: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'sr-1', ...data })),
      },
      iqcInspection: {
        findFirst: jest.fn().mockResolvedValue({ id: 'iqc-1', items: [{ currentStage: 'CLOSED' }] }),
        update: jest.fn().mockResolvedValue({}),
      },
      grnItem: { update: jest.fn().mockResolvedValue({}) },
      grnHeader: { update: jest.fn().mockResolvedValue({}), findFirst: jest.fn().mockResolvedValue(null) },
      rejectedStock: { findFirst: jest.fn().mockResolvedValue(null) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      debitNote: { create: jest.fn().mockResolvedValue({ id: 'dn-1', debitNoteNumber: 'DN-1' }) },
    };
    // closeAsFail wraps the debit-note creation in a transaction (IQC-055);
    // run the callback against this same mocked client, like the real
    // PrismaService.$transaction does against its own tables.
    prisma.$transaction = jest.fn().mockImplementation((cb: any) => cb(prisma));
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    rejectedStockSvc = { createFromIqc: jest.fn().mockResolvedValue({ id: 'rs-1', rejectionNumber: 'RS-1' }) };
    stockLedger = { receiveFromIqc: jest.fn().mockResolvedValue(undefined) };
    debitNotes = { createFromIqcRejection: jest.fn().mockResolvedValue({ id: 'dn-1', debitNoteNumber: 'DN-1' }) };
    const ncrService: any = { createAuto: jest.fn().mockResolvedValue({ id: 'ncr-1' }) };
    service = new IqcEscalationService(prisma, audit, notifications, rejectedStockSvc, stockLedger, debitNotes, ncrService);
  });

  function setStage(stage: string) {
    prisma.iqcItem.findFirst.mockResolvedValue({ ...baseItem, currentStage: stage });
  }

  it('QUALITY_MANAGER recording PASS does NOT close the item - it is a suggestion that escalates to PLANT_HEAD', async () => {
    setStage('QUALITY_MANAGER');
    await service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'Looks fine, recommend deviation' } as any, userWith('QUALITY_MANAGER'));

    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'iqc-item-1' },
      data: expect.objectContaining({ currentStage: 'PLANT_HEAD' }),
    }));
    // Must never reach the stock-crediting / closing path for a suggestion.
    expect(stockLedger.receiveFromIqc).not.toHaveBeenCalled();
    expect(prisma.iqcItem.update).not.toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ finalOutcome: 'PASS' }),
    }));
  });

  it('QUALITY_MANAGER recording FAIL also only escalates to PLANT_HEAD (unchanged prior behavior)', async () => {
    setStage('QUALITY_MANAGER');
    await service.submitStageResult('iqc-item-1', { outcome: 'FAIL', remarks: 'Recommend reject' } as any, userWith('QC_MANAGER'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'PLANT_HEAD' }),
    }));
  });

  it('PLANT_HEAD recording PASS does NOT close the item - it escalates to FINAL_AUTHORITY instead of granting a deviation', async () => {
    setStage('PLANT_HEAD');
    await service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'Recommend deviation' } as any, userWith('PLANT_MANAGER'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'FINAL_AUTHORITY' }),
    }));
    expect(stockLedger.receiveFromIqc).not.toHaveBeenCalled();
  });

  it('QUALITY_MANAGER (legacy QC_MANAGER role user) cannot act once the item reaches FINAL_AUTHORITY', async () => {
    setStage('FINAL_AUTHORITY');
    await expect(
      service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'try to grant deviation' } as any, userWith('QC_MANAGER')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('PLANT_HEAD (current PLANT_MANAGER role user) cannot act once the item reaches FINAL_AUTHORITY', async () => {
    setStage('FINAL_AUTHORITY');
    await expect(
      service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'try to grant deviation' } as any, userWith('PLANT_MANAGER')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('ADMIN (management tier) at FINAL_AUTHORITY can grant the deviation - PASS actually closes the item and credits stock', async () => {
    setStage('FINAL_AUTHORITY');
    await service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'Deviation granted', acceptedQty: 100, rejectedQty: 0 } as any, userWith('ADMIN'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'CLOSED', finalOutcome: 'PASS' }),
    }));
  });

  it('ADMIN (management tier) at FINAL_AUTHORITY can confirm the fail - FAIL closes the item as rejected, not escalated further', async () => {
    setStage('FINAL_AUTHORITY');
    await service.submitStageResult('iqc-item-1', { outcome: 'FAIL', remarks: 'Fail confirmed, return to vendor', rejectionReason: 'Out of spec' } as any, userWith('ADMIN'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'CLOSED', finalOutcome: 'FAIL' }),
    }));
  });

  it('SUPER_ADMIN is still universally authorized but still only closes once the item is actually at FINAL_AUTHORITY', async () => {
    setStage('QUALITY_MANAGER');
    await service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'super admin acting as QC suggestion' } as any, userWith('SUPER_ADMIN'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'PLANT_HEAD' }),
    }));
  });

  it('the dedicated IQC role can perform the initial inspection stage (additive fix - was previously excluded)', async () => {
    setStage('IQC');
    await service.submitStageResult('iqc-item-1', { outcome: 'FAIL', remarks: 'Fails parameter check', rejectionReason: 'Dimension out of spec' } as any, userWith('IQC'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'QUALITY_MANAGER' }),
    }));
  });

  it('an unrelated role (e.g. STORE) is forbidden at every stage', async () => {
    setStage('QUALITY_MANAGER');
    await expect(
      service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'not my call' } as any, userWith('STORE')),
    ).rejects.toThrow(ForbiddenException);
  });
});

// Task #62: IQC rejects (via the template-escalation path's terminal
// close, maybeCloseInspection) now also raise an NCR through the same
// shared NcrService.createAuto() the direct/non-templated approve() path
// (iqc.service.ts) and the OQC trigger (production-qc.service.ts) call.
// maybeCloseInspection is private, so it's invoked directly here
// (matching the (service as any).<privateMethod>() convention already
// used in src/bom-import/bom-import.service.spec.ts) rather than driving
// the whole multi-stage submitStageResult state machine just to reach it.
describe('IqcEscalationService.maybeCloseInspection - IQC reject raises an NCR', () => {
  let service: IqcEscalationService;
  let prisma: any;
  let audit: any;
  let notifications: any;
  let rejectedStockSvc: any;
  let stockLedger: any;
  let ncrService: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  function makeInspection(items: any[]) {
    return { id: 'iqc-1', companyId: 'company-1', grnId: 'grn-1', iqcNumber: 'IQC-2026-0001', items };
  }

  beforeEach(() => {
    prisma = {
      iqcInspection: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      grnItem: { update: jest.fn().mockResolvedValue({}) },
      grnHeader: { update: jest.fn().mockResolvedValue({}), findFirst: jest.fn().mockResolvedValue(null) },
      rejectedStock: { findFirst: jest.fn().mockResolvedValue(null) },
      rejectedStockItem: { updateMany: jest.fn().mockResolvedValue({}) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    rejectedStockSvc = { createFromIqc: jest.fn().mockResolvedValue({ id: 'rej-1', rejectionNumber: 'REJ-2026-0001' }) };
    stockLedger = { receiveFromIqc: jest.fn().mockResolvedValue(undefined) };
    // debitNotes (6th ctor param) is irrelevant to maybeCloseInspection's
    // NCR trigger (closeAsFail is what calls it) - a bare mock keeps this
    // suite isolated to the NCR behavior it actually exercises.
    const debitNotes: any = { createFromIqcRejection: jest.fn() };
    ncrService = { createAuto: jest.fn().mockResolvedValue({ id: 'ncr-1' }) };
    service = new IqcEscalationService(prisma, audit, notifications, rejectedStockSvc, stockLedger, debitNotes, ncrService);
  });

  it('creates an NCR alongside RejectedStock when every item is CLOSED with a rejection (neither suppresses the other)', async () => {
    const items = [
      { id: 'item-1', grnItemId: 'gi-1', itemCode: 'RM-01', itemName: 'Capacitor', currentStage: 'CLOSED', acceptedQty: 180, rejectedQty: 20, receivedQty: 200, rejectionReason: 'Out of spec tolerance' },
    ];
    prisma.iqcInspection.findFirst.mockResolvedValue(makeInspection(items));

    await (service as any).maybeCloseInspection('iqc-1', user);

    expect(rejectedStockSvc.createFromIqc).toHaveBeenCalledWith('iqc-1', user);
    expect(ncrService.createAuto).toHaveBeenCalledTimes(1);
    const ncrCall = ncrService.createAuto.mock.calls[0][0];
    expect(ncrCall.source).toBe('IQC');
    expect(ncrCall.sourceReferenceId).toBe('iqc-1');
    expect(ncrCall.sourceReferenceNumber).toBe('IQC-2026-0001');
    expect(ncrCall.itemCode).toBe('RM-01');
    expect(ncrCall.itemName).toBe('Capacitor');
    expect(ncrCall.qtyAffected).toBe(20);
    expect(ncrCall.disposition).toBe('RETURN_TO_VENDOR');
    expect(ncrCall.workOrderId).toBeUndefined();
    expect(ncrCall.description).toContain('Out of spec tolerance');
    expect(ncrService.createAuto).toHaveBeenCalledWith(expect.any(Object), user);
  });

  it('does not create a second NCR when a RejectedStock record already exists for this IQC (re-entrant call guarded, same as RejectedStock)', async () => {
    prisma.rejectedStock.findFirst.mockResolvedValue({ id: 'rej-existing' });
    const items = [
      { id: 'item-1', grnItemId: 'gi-1', itemCode: 'RM-01', currentStage: 'CLOSED', acceptedQty: 180, rejectedQty: 20, receivedQty: 200, rejectionReason: 'Out of spec' },
    ];
    prisma.iqcInspection.findFirst.mockResolvedValue(makeInspection(items));

    await (service as any).maybeCloseInspection('iqc-1', user);

    expect(rejectedStockSvc.createFromIqc).not.toHaveBeenCalled();
    expect(ncrService.createAuto).not.toHaveBeenCalled();
  });

  it('does not create an NCR when all items pass (no rejection at all)', async () => {
    const items = [
      { id: 'item-1', grnItemId: 'gi-1', itemCode: 'RM-01', currentStage: 'CLOSED', acceptedQty: 200, rejectedQty: 0, receivedQty: 200 },
    ];
    prisma.iqcInspection.findFirst.mockResolvedValue(makeInspection(items));

    await (service as any).maybeCloseInspection('iqc-1', user);

    expect(rejectedStockSvc.createFromIqc).not.toHaveBeenCalled();
    expect(ncrService.createAuto).not.toHaveBeenCalled();
  });

  it('does not close or raise an NCR while any item is still open (not all CLOSED yet)', async () => {
    const items = [
      { id: 'item-1', grnItemId: 'gi-1', itemCode: 'RM-01', currentStage: 'CLOSED', acceptedQty: 0, rejectedQty: 10, receivedQty: 10 },
      { id: 'item-2', grnItemId: 'gi-2', itemCode: 'RM-02', currentStage: 'QUALITY_MANAGER', acceptedQty: 0, rejectedQty: 0, receivedQty: 10 },
    ];
    prisma.iqcInspection.findFirst.mockResolvedValue(makeInspection(items));

    await (service as any).maybeCloseInspection('iqc-1', user);

    expect(prisma.iqcInspection.update).not.toHaveBeenCalled();
    expect(ncrService.createAuto).not.toHaveBeenCalled();
  });

  it('summarizes multiple rejected items rather than force-fitting a single itemCode onto the NCR', async () => {
    const items = [
      { id: 'item-1', grnItemId: 'gi-1', itemCode: 'RM-01', currentStage: 'CLOSED', acceptedQty: 90, rejectedQty: 10, receivedQty: 100, rejectionReason: 'bad' },
      { id: 'item-2', grnItemId: 'gi-2', itemCode: 'RM-02', currentStage: 'CLOSED', acceptedQty: 95, rejectedQty: 5, receivedQty: 100, rejectionReason: 'bad' },
    ];
    prisma.iqcInspection.findFirst.mockResolvedValue(makeInspection(items));

    await (service as any).maybeCloseInspection('iqc-1', user);

    const ncrCall = ncrService.createAuto.mock.calls[0][0];
    expect(ncrCall.itemCode).toBeUndefined();
    expect(ncrCall.qtyAffected).toBe(15);
    expect(ncrCall.description).toContain('2 item(s) rejected');
  });

  describe('per-vendor return window (174_vendor_return_window_days.sql)', () => {
    function daysBetween(a: Date, b: Date) {
      return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
    }

    it("uses the vendor's own returnWindowDays when the GRN's PO has one set, not the 21-day default", async () => {
      prisma.grnHeader.findFirst.mockResolvedValue({ po: { vendor: { returnWindowDays: 14 } } });
      prisma.user.findMany.mockResolvedValue([{ id: 'finance-1' }]);
      const items = [
        { id: 'item-1', grnItemId: 'gi-1', itemCode: 'RM-01', currentStage: 'CLOSED', acceptedQty: 180, rejectedQty: 20, receivedQty: 200, rejectionReason: 'bad' },
      ];
      prisma.iqcInspection.findFirst.mockResolvedValue(makeInspection(items));

      const before = new Date();
      await (service as any).maybeCloseInspection('iqc-1', user);

      const call = prisma.rejectedStockItem.updateMany.mock.calls[0][0];
      expect(daysBetween(call.data.vendorPickupDeadline, before)).toBe(14);

      const notifyCall = notifications.createBulk.mock.calls[0][0][0];
      expect(notifyCall.message).toContain('within 14 days');
    });

    it("falls back to the 21-day company default when the vendor has no returnWindowDays override", async () => {
      prisma.grnHeader.findFirst.mockResolvedValue({ po: { vendor: { returnWindowDays: null } } });
      const items = [
        { id: 'item-1', grnItemId: 'gi-1', itemCode: 'RM-01', currentStage: 'CLOSED', acceptedQty: 180, rejectedQty: 20, receivedQty: 200, rejectionReason: 'bad' },
      ];
      prisma.iqcInspection.findFirst.mockResolvedValue(makeInspection(items));

      const before = new Date();
      await (service as any).maybeCloseInspection('iqc-1', user);

      const call = prisma.rejectedStockItem.updateMany.mock.calls[0][0];
      expect(daysBetween(call.data.vendorPickupDeadline, before)).toBe(21);
    });

    it('also falls back to the 21-day default when the GRN has no PO at all (e.g. a non-PO receipt)', async () => {
      prisma.grnHeader.findFirst.mockResolvedValue(null);
      const items = [
        { id: 'item-1', grnItemId: 'gi-1', itemCode: 'RM-01', currentStage: 'CLOSED', acceptedQty: 180, rejectedQty: 20, receivedQty: 200, rejectionReason: 'bad' },
      ];
      prisma.iqcInspection.findFirst.mockResolvedValue(makeInspection(items));

      const before = new Date();
      await (service as any).maybeCloseInspection('iqc-1', user);

      const call = prisma.rejectedStockItem.updateMany.mock.calls[0][0];
      expect(daysBetween(call.data.vendorPickupDeadline, before)).toBe(21);
    });
  });
});
