import { IqcEscalationService } from './iqc-escalation.service';

/**
 * IQC-055: focused coverage for the one new behaviour wired into
 * IqcEscalationService - a final FAIL at the terminal (FINAL_AUTHORITY,
 * i.e. Admin-tier) stage must atomically mark the item returnedToVendor
 * and auto-create a Debit Note via DebitNotesService, in the same
 * transaction as the IqcItem update. This deliberately does not
 * re-test the rest of the escalation/authorization chain (template
 * CRUD, stage ordering, RBAC) - only the new trigger point added here.
 */
describe('IqcEscalationService - Debit Note auto-trigger on final FAIL', () => {
  let service: IqcEscalationService;
  let prisma: any;
  let audit: any;
  let notifications: any;
  let rejectedStockSvc: any;
  let stockLedger: any;
  let debitNotes: any;

  const user = { id: 'user-1', companyId: 'company-1', role: 'FINAL_AUTHORITY', allRoles: ['FINAL_AUTHORITY'] };

  const finalAuthorityItem = {
    id: 'item-1', companyId: 'company-1', iqcId: 'iqc-1',
    currentStage: 'FINAL_AUTHORITY', receivedQty: 10,
    template: { parameters: [] }, stageResults: [], iqc: {},
  };
  const iqcStageItem = {
    id: 'item-2', companyId: 'company-1', iqcId: 'iqc-2',
    currentStage: 'IQC', receivedQty: 10,
    template: { parameters: [] }, stageResults: [], iqc: {},
  };

  function makePrisma(item: any) {
    const tx = { iqcItem: { update: jest.fn().mockResolvedValue({}) } };
    return {
      __tx: tx,
      iqcItem: {
        findFirst: jest.fn().mockResolvedValue(item),
        update: jest.fn().mockResolvedValue({}),
      },
      iqcStageResult: {
        create: jest.fn().mockResolvedValue({ id: 'sr-1', parameterResults: [] }),
      },
      iqcInspection: {
        // Short-circuits maybeCloseInspection - not what this test covers.
        findFirst: jest.fn().mockResolvedValue(null),
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn().mockImplementation((cb: any) => cb(tx)),
    };
  }

  beforeEach(() => {
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    rejectedStockSvc = { createFromIqc: jest.fn() };
    stockLedger = { receiveFromIqc: jest.fn() };
    debitNotes = { createFromIqcRejection: jest.fn().mockResolvedValue({ id: 'dn-1', debitNoteNumber: 'DN-2026-0001' }) };
  });

  it('wraps the final-fail IqcItem update and the Debit Note creation in a single transaction, and flips returnedToVendor', async () => {
    prisma = makePrisma(finalAuthorityItem);
    service = new IqcEscalationService(prisma, audit, notifications, rejectedStockSvc, stockLedger, debitNotes);

    await service.submitStageResult('item-1', { outcome: 'FAIL', remarks: 'Confirmed defective, deviation declined', rejectedQty: 10, acceptedQty: 0, rejectionReason: 'Out of spec' } as any, user);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const tx = prisma.__tx;
    expect(tx.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'item-1' },
      data: expect.objectContaining({ finalOutcome: 'FAIL', returnedToVendor: true, rejectedQty: 10 }),
    }));

    // DebitNotesService must be called with the SAME tx client the
    // IqcItem update ran on, inside the transaction callback.
    expect(debitNotes.createFromIqcRejection).toHaveBeenCalledWith(
      { iqcItemId: 'item-1', rejectedQty: 10, rejectionReason: 'Out of spec' },
      user,
      tx,
    );

    // Audit-logged only after the transaction has resolved.
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'debit_notes', recordId: 'dn-1', action: 'CREATE' }));
  });

  it('does not create a Debit Note when the fail is escalated to the next stage (not yet terminal)', async () => {
    prisma = makePrisma(iqcStageItem);
    service = new IqcEscalationService(prisma, audit, notifications, rejectedStockSvc, stockLedger, debitNotes);

    const nonTerminalUser = { ...user, role: 'QC_MANAGER', allRoles: ['QC_MANAGER'] };
    await service.submitStageResult('item-2', { outcome: 'FAIL', remarks: 'Needs escalation', rejectedQty: 10, acceptedQty: 0, rejectionReason: 'Out of spec' } as any, nonTerminalUser);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(debitNotes.createFromIqcRejection).not.toHaveBeenCalled();
  });

  it('does not create a Debit Note on a terminal FAIL with zero rejected quantity', async () => {
    prisma = makePrisma(finalAuthorityItem);
    service = new IqcEscalationService(prisma, audit, notifications, rejectedStockSvc, stockLedger, debitNotes);

    await service.submitStageResult('item-1', { outcome: 'FAIL', remarks: 'Administrative close-out', rejectedQty: 0, acceptedQty: 10 } as any, user);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const tx = prisma.__tx;
    expect(tx.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ returnedToVendor: false, rejectedQty: 0 }),
    }));
    expect(debitNotes.createFromIqcRejection).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalledWith(expect.objectContaining({ tableName: 'debit_notes' }));
  });
});
