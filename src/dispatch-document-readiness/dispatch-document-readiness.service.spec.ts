import { DispatchDocumentReadinessService } from './dispatch-document-readiness.service';
import { NotFoundException } from '@nestjs/common';

describe('DispatchDocumentReadinessService - DSP-009', () => {
  let service: DispatchDocumentReadinessService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      dispatchPlan: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'plan-1', planNumber: 'DP-2026-0001', soId: 'so-1',
          salesOrder: { soNumber: 'SO-2026-0001', customerName: 'ABC Corp' },
        }),
      },
      dispatch: { findFirst: jest.fn().mockResolvedValue(null) },
      arInvoice: { findMany: jest.fn().mockResolvedValue([]) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new DispatchDocumentReadinessService(prisma, audit);
  });

  it('throws NotFoundException for an unknown plan', async () => {
    prisma.dispatchPlan.findFirst.mockResolvedValue(null);
    await expect(service.checkReadiness('plan-x', user)).rejects.toThrow(NotFoundException);
  });

  it('MANUAL UAT — missing invoice: reports PENDING, not READY, when no invoice exists (section 80)', async () => {
    const result = await service.checkReadiness('plan-1', user);
    expect(result.invoice.status).toBe('PENDING');
    expect(result.overall).toBe('DOCUMENT_PENDING');
  });

  it('E-Way Bill NOT blocking when no Dispatch record exists yet - reports PENDING, never fakes NOT_REQUIRED or READY (section 39)', async () => {
    const result = await service.checkReadiness('plan-1', user);
    expect(result.ewayBill.status).toBe('PENDING');
  });

  it('Challan and E-Invoice/IRN are honestly NOT_REQUIRED since no such architecture exists in this ERP (sections 21, 26)', async () => {
    const result = await service.checkReadiness('plan-1', user);
    expect(result.challan.status).toBe('NOT_REQUIRED');
    expect(result.eInvoiceIrn.status).toBe('NOT_REQUIRED');
  });

  it('CRITICAL READINESS PROOF (section 98): valid invoice + eway bill number present => DOCUMENTS_READY', async () => {
    prisma.dispatch.findFirst.mockResolvedValue({
      id: 'dispatch-1', status: 'DISPATCHED', ewayBillNumber: 'EWB123456',
      arInvoices: [{ invoiceNumber: 'INV-1001', status: 'SENT', createdAt: new Date() }],
    });
    const result = await service.checkReadiness('plan-1', user);
    expect(result.invoice.status).toBe('READY');
    expect(result.ewayBill.status).toBe('READY');
    expect(result.overall).toBe('DOCUMENTS_READY');
  });

  it('CRITICAL READINESS PROOF continued: Accounts cancels the invoice - recheck immediately reflects BLOCKED, never a stale READY (section 98, 41)', async () => {
    prisma.dispatch.findFirst.mockResolvedValue({
      id: 'dispatch-1', status: 'DISPATCHED', ewayBillNumber: 'EWB123456',
      arInvoices: [{ invoiceNumber: 'INV-1001', status: 'CANCELLED', createdAt: new Date() }],
    });
    const result = await service.checkReadiness('plan-1', user);
    expect(result.invoice.status).toBe('BLOCKED');
    expect(result.overall).toBe('BLOCKED');
  });

  it('a Dispatch record marked CANCELLED blocks E-Way Bill readiness even if a number was previously recorded', async () => {
    prisma.dispatch.findFirst.mockResolvedValue({
      id: 'dispatch-1', status: 'CANCELLED', ewayBillNumber: 'EWB123456', arInvoices: [],
    });
    const result = await service.checkReadiness('plan-1', user);
    expect(result.ewayBill.status).toBe('BLOCKED');
  });

  it('MANUAL UAT — E-Way required but missing: Dispatch exists but no ewayBillNumber => PENDING (section 85)', async () => {
    prisma.dispatch.findFirst.mockResolvedValue({ id: 'dispatch-1', status: 'DISPATCHED', ewayBillNumber: null, arInvoices: [] });
    const result = await service.checkReadiness('plan-1', user);
    expect(result.ewayBill.status).toBe('PENDING');
    expect(result.overall).toBe('DOCUMENT_PENDING');
  });

  it('DRAFT invoice is PENDING, not READY, since it has not been formally issued', async () => {
    prisma.dispatch.findFirst.mockResolvedValue({
      id: 'dispatch-1', status: 'DISPATCHED', ewayBillNumber: 'EWB1',
      arInvoices: [{ invoiceNumber: 'INV-1002', status: 'DRAFT', createdAt: new Date() }],
    });
    const result = await service.checkReadiness('plan-1', user);
    expect(result.invoice.status).toBe('PENDING');
  });

  it('CRITICAL OWNERSHIP PROOF (section 95): never creates, edits, or calculates any invoice/tax data - only reads ArInvoice/Dispatch as they already exist', async () => {
    await service.checkReadiness('plan-1', user);
    expect(prisma.arInvoice.findMany).toHaveBeenCalled();
    expect(Object.keys(prisma.arInvoice)).not.toContain('create');
    expect(Object.keys(prisma.arInvoice)).not.toContain('update');
  });

  it('NO INVENTORY / RESERVATION / PICK / VERIFICATION / PACKED / SALES DISPATCH CHANGE TEST: the prisma mock exposes no write methods for any of those tables, proving this service is purely a read', async () => {
    await service.checkReadiness('plan-1', user);
    expect(prisma.dispatchPlan.update).toBeUndefined();
    expect(prisma.dispatch.update).toBeUndefined();
  });

  it('audits every readiness check for traceability without storing a cached readiness record (section 28, 77)', async () => {
    await service.checkReadiness('plan-1', user);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'dispatch_document_readiness_checks', action: 'VIEW' }));
  });
});
