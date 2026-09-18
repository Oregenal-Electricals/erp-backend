import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class DispatchDocumentReadinessService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // DSP-009 sections 9, 17-19, 26, 47, 52: Sales/Accounts remain the
  // sole owner of Invoice/tax/GST/IRN truth. This service never
  // creates, edits, or calculates any of that - it only reads the
  // CURRENT authoritative status fresh on every call (section 28: no
  // cached documents_ready=true is ever stored) and reports what a
  // Dispatch operator needs to know, in plain language.
  async checkReadiness(dispatchPlanId: string, user: any) {
    const plan = await this.prisma.dispatchPlan.findFirst({
      where: { id: dispatchPlanId, companyId: user.companyId },
      include: { salesOrder: { select: { soNumber: true, customerName: true } } },
    });
    if (!plan) throw new NotFoundException('Dispatch Plan not found');

    // The pre-existing Dispatch/DispatchItem/ArInvoice architecture
    // (src/dispatch, src/accounts-receivable) is the real owner of
    // commercial documents - reused exactly as-is, never duplicated.
    const dispatchRecord = await this.prisma.dispatch.findFirst({
      where: { planId: dispatchPlanId, companyId: user.companyId },
      include: { arInvoices: { where: { isActive: true }, orderBy: { createdAt: 'desc' } } },
    });

    // DSP-009 section 41, 98: an invoice's CURRENT status is read
    // fresh every time - a cancellation in Accounts is reflected
    // immediately on the next check, never a stale READY.
    const invoices = dispatchRecord?.arInvoices?.length
      ? dispatchRecord.arInvoices
      : await this.prisma.arInvoice.findMany({ where: { soId: plan.soId, isActive: true }, orderBy: { createdAt: 'desc' } });
    const latestInvoice = invoices[0] || null;

    let invoiceStatus: string, invoiceReason: string | null = null;
    if (!latestInvoice) { invoiceStatus = 'PENDING'; invoiceReason = 'No invoice created yet for this Sales Order'; }
    else if (latestInvoice.status === 'CANCELLED') { invoiceStatus = 'BLOCKED'; invoiceReason = 'Linked invoice was cancelled'; }
    else if (latestInvoice.status === 'DRAFT') { invoiceStatus = 'PENDING'; invoiceReason = 'Invoice exists but is still in Draft'; }
    else { invoiceStatus = 'READY'; }

    // DSP-009 sections 21, 24: no Delivery Challan concept exists
    // anywhere in this ERP - reported honestly as NOT_REQUIRED rather
    // than inventing a Challan model or a statutory rule to check it
    // against.
    const challanStatus = 'NOT_REQUIRED';
    const challanReason = 'No Delivery Challan architecture exists in this ERP yet';

    // DSP-009 sections 23-25: the existing Dispatch record's plain
    // ewayBillNumber field is the only E-Way Bill concept that
    // exists - no dedicated E-Way Bill entity/status/validity model
    // exists to check expiry/cancellation against, so this can only
    // report presence, not full validity.
    let ewayBillStatus: string, ewayBillReason: string | null = null;
    if (!dispatchRecord) { ewayBillStatus = 'PENDING'; ewayBillReason = 'No Dispatch record exists yet to carry an E-Way Bill number'; }
    else if (dispatchRecord.status === 'CANCELLED') { ewayBillStatus = 'BLOCKED'; ewayBillReason = 'Linked Dispatch record was cancelled'; }
    else if (dispatchRecord.ewayBillNumber) { ewayBillStatus = 'READY'; }
    else { ewayBillStatus = 'PENDING'; ewayBillReason = 'Dispatch record exists but has no E-Way Bill number recorded'; }

    // DSP-009 section 26: no E-Invoice/IRN integration exists
    // anywhere in this ERP - reported honestly, never a fabricated
    // government API call.
    const irnStatus = 'NOT_REQUIRED';
    const irnReason = 'No E-Invoice/IRN architecture exists in this ERP yet';

    const blocked = [invoiceStatus, ewayBillStatus].includes('BLOCKED');
    const allClear = [invoiceStatus, challanStatus, ewayBillStatus, irnStatus].every(s => s === 'READY' || s === 'NOT_REQUIRED');
    const overall = blocked ? 'BLOCKED' : allClear ? 'DOCUMENTS_READY' : 'DOCUMENT_PENDING';

    const result = {
      dispatchPlanId, planNumber: plan.planNumber, soNumber: plan.salesOrder?.soNumber, customerName: plan.customerName,
      invoice: { status: invoiceStatus, reason: invoiceReason, invoiceNumber: latestInvoice?.invoiceNumber || null, invoiceStatusRaw: latestInvoice?.status || null },
      challan: { status: challanStatus, reason: challanReason },
      ewayBill: { status: ewayBillStatus, reason: ewayBillReason, ewayBillNumber: dispatchRecord?.ewayBillNumber || null },
      eInvoiceIrn: { status: irnStatus, reason: irnReason },
      overall,
      checkedBy: user.id, checkedAt: new Date().toISOString(),
    };

    // DSP-009 section 77: every readiness check is audited, but this
    // never creates a stored readiness "record" the way DSP-005/006
    // etc create commitments - the whole point is that nothing here
    // is cached truth, only a log of when someone checked and what
    // they saw.
    await this.audit.log({
      tableName: 'dispatch_document_readiness_checks', recordId: dispatchPlanId, action: 'VIEW',
      newValues: result, changedBy: user.id,
    });

    return result;
  }
}
