import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// STORE-018 sections 35-38: Trace Item was listed in every STORE-0XX
// spec's manual UAT section but never actually built - this is the
// real implementation, not a stub. Assembles one chronological
// timeline from every module built this session (STORE-009 through
// STORE-017), reading each module's own tables directly rather than a
// separately-maintained trace log that could drift from them.
@Injectable()
export class TraceService {
  constructor(private prisma: PrismaService) {}

  async search(query: string, user: any): Promise<any> {
    const companyId = user.companyId;
    const q = query.trim();

    // Prefer the most specific identity first: an exact batch number
    // match gives the richest, most precise timeline. Falling back to
    // itemCode covers a search that isn't batch-controlled or where
    // the user doesn't know the exact batch.
    const batch = await this.prisma.stockBatch.findFirst({
      where: { companyId, batchNumber: q },
    });

    if (batch) return this.traceBatch(batch, user);

    const anyBatchForItem = await this.prisma.stockBatch.findFirst({
      where: { companyId, itemCode: q },
    });
    if (anyBatchForItem) {
      // Item is batch-controlled but the user searched by item code -
      // trace the item level (not one specific batch) instead.
      return this.traceItem(q, user);
    }

    const anyBalance = await this.prisma.stockBalance.findFirst({ where: { companyId, itemCode: q } });
    if (anyBalance) return this.traceItem(q, user);

    throw new NotFoundException(`No material found for "${query}" - not a known item code or batch number.`);
  }

  private async traceBatch(batch: any, user: any): Promise<any> {
    const companyId = user.companyId;
    const events: any[] = [];

    // PO -> GRN
    let po: any = null;
    let grn: any = null;
    if (batch.grnId) {
      grn = await this.prisma.grnHeader.findFirst({ where: { id: batch.grnId } });
      if (grn) {
        events.push({ stage: 'GRN', label: `GRN ${grn.grnNumber} posted`, qty: null, reference: grn.grnNumber, at: grn.receivedDate || grn.createdAt });
        if (grn.poId) {
          po = await this.prisma.purchaseOrder.findFirst({ where: { id: grn.poId }, include: { vendor: { select: { name: true } } } });
          if (po) events.unshift({ stage: 'PO', label: `PO ${po.poNumber} - ${po.vendor?.name || 'vendor'}`, qty: null, reference: po.poNumber, at: po.createdAt });
        }
      }
    }

    // IQC (matched via batchNumber - IqcItem has no direct batchId FK)
    const iqcItems = await this.prisma.iqcItem.findMany({
      where: { companyId, itemCode: batch.itemCode, batchNumber: batch.batchNumber },
      include: { iqc: { select: { iqcNumber: true, status: true, createdAt: true } } },
    });
    for (const it of iqcItems) {
      events.push({ stage: 'IQC', label: `IQC ${it.iqc?.iqcNumber} - accepted ${it.acceptedQty}, rejected ${it.rejectedQty}, hold ${it.holdQty}`, qty: it.acceptedQty, reference: it.iqc?.iqcNumber, at: it.iqc?.createdAt });
    }

    // Put-Away
    const putawayItems = await this.prisma.stockPutawayItem.findMany({
      where: { companyId, stockBatchId: batch.id },
      include: { putaway: { select: { putawayNumber: true, createdAt: true } }, bin: { select: { code: true } } },
    });
    for (const it of putawayItems) {
      events.push({ stage: 'PUT_AWAY', label: `Put away ${it.qty} to bin ${it.bin?.code}`, qty: it.qty, reference: it.putaway?.putawayNumber, at: it.putaway?.createdAt });
    }

    // Reservation (item-level in this system, not batch-scoped - noted as such)
    const reservations = await this.prisma.materialReservation.findMany({
      where: { companyId, itemCode: batch.itemCode },
      include: { workOrder: { select: { woNumber: true } } },
    });
    for (const r of reservations) {
      events.push({ stage: 'RESERVATION', label: `Reserved ${r.reservedQty} for WO ${r.workOrder?.woNumber} (item-level, not batch-scoped)`, qty: r.reservedQty, reference: r.workOrder?.woNumber, at: r.createdAt });
    }

    // Issue
    const issueItems = await this.prisma.productionIssueItem.findMany({
      where: { companyId, batchId: batch.id },
      include: { productionIssue: { select: { issueNumber: true, status: true, createdAt: true, workOrder: { select: { woNumber: true } } } } },
    });
    for (const it of issueItems) {
      events.push({ stage: 'ISSUE', label: `Issued ${it.issuedQty} to WO ${it.productionIssue?.workOrder?.woNumber} (${it.productionIssue?.issueNumber})`, qty: it.issuedQty, reference: it.productionIssue?.issueNumber, at: it.productionIssue?.createdAt });
    }

    // Production Return
    const returns = await this.prisma.productionMaterialReturn.findMany({
      where: { companyId, batchId: batch.id },
      include: { workOrder: { select: { woNumber: true } } },
    });
    for (const r of returns) {
      events.push({ stage: 'PRODUCTION_RETURN', label: `Returned ${r.qty} from WO ${r.workOrder?.woNumber} - condition ${r.condition}`, qty: r.qty, reference: r.returnNumber, at: r.returnedAt });
    }

    // Internal Location Transfer
    const transferItems = await this.prisma.stockTransferItem.findMany({
      where: { companyId, batchId: batch.id },
      include: { transfer: { select: { transferNumber: true, fromBinId: true, toBinId: true, createdAt: true } } },
    });
    for (const it of transferItems) {
      events.push({ stage: 'LOCATION_TRANSFER', label: `Transferred ${it.qty}`, qty: it.qty, reference: it.transfer?.transferNumber, at: it.transfer?.createdAt });
    }

    // Stock Count / Adjustment
    const adjItems = await this.prisma.stockAdjustmentItem.findMany({
      where: { companyId, batchId: batch.id },
      include: { adjustment: { select: { adjustmentNumber: true, status: true, createdAt: true } } },
    });
    for (const it of adjItems) {
      events.push({ stage: 'STOCK_COUNT', label: `Count variance ${it.adjustmentQty > 0 ? '+' : ''}${it.adjustmentQty} (${it.adjustment?.status})`, qty: it.adjustmentQty, reference: it.adjustment?.adjustmentNumber, at: it.adjustment?.createdAt });
    }

    // RTV / Gate-Out
    const rtvs = await this.prisma.rtvRequest.findMany({
      where: { companyId, batchId: batch.id },
      include: { vendor: { select: { name: true } }, gateOuts: true },
    });
    for (const r of rtvs) {
      events.push({ stage: 'RTV', label: `RTV ${r.rtvNumber} - requested ${r.requestedQty} to ${r.vendor?.name} (${r.status})`, qty: r.requestedQty, reference: r.rtvNumber, at: r.createdAt });
      for (const go of r.gateOuts) {
        events.push({ stage: 'GATE_OUT', label: `Gate-Out ${go.qty} against ${r.rtvNumber}`, qty: go.qty, reference: r.rtvNumber, at: go.gatedOutAt });
      }
    }

    events.sort((a, b) => new Date(a.at || 0).getTime() - new Date(b.at || 0).getTime());

    // Current location(s) - STORE-015's bin-level balance for this batch
    const locations = await this.prisma.stockLocationBalance.findMany({
      where: { companyId, batchId: batch.id, qty: { gt: 0 } },
      include: { bin: { select: { code: true } } },
    });

    return {
      identity: { itemCode: batch.itemCode, itemName: batch.itemName, batchNumber: batch.batchNumber, poNumber: po?.poNumber, grnNumber: grn?.grnNumber },
      currentState: {
        status: batch.status,
        availableQty: batch.availableQty,
        reservedQty: batch.reservedQty,
        freeQty: Math.max(0, batch.availableQty - batch.reservedQty),
        mfgDate: batch.mfgDate, expiryDate: batch.expiryDate, receivedDate: batch.receivedDate,
        locations: locations.map(l => ({ binCode: l.bin?.code, qty: l.qty, status: l.status })),
      },
      timeline: events,
    };
  }

  // Item-level trace for material not tracked as one specific batch in
  // this search (or genuinely not batch-controlled) - aggregate
  // current state, same as STORE-010's Material Summary, plus whatever
  // batches exist for it.
  private async traceItem(itemCode: string, user: any): Promise<any> {
    const companyId = user.companyId;

    const balances = await this.prisma.stockBalance.findMany({ where: { companyId, itemCode } });
    const batches = await this.prisma.stockBatch.findMany({ where: { companyId, itemCode }, orderBy: { receivedDate: 'desc' } });
    const locations = await this.prisma.stockLocationBalance.findMany({
      where: { companyId, itemCode, qty: { gt: 0 } },
      include: { bin: { select: { code: true } } },
    });

    const totalAvailable = balances.reduce((s, b) => s + b.availableQty, 0);
    const totalReserved = balances.reduce((s, b) => s + b.reservedQty, 0);

    return {
      identity: { itemCode, itemName: balances[0]?.itemName || batches[0]?.itemName },
      currentState: {
        availableQty: totalAvailable,
        reservedQty: totalReserved,
        freeQty: Math.max(0, totalAvailable - totalReserved),
        batches: batches.map(b => ({ batchNumber: b.batchNumber, status: b.status, availableQty: b.availableQty, reservedQty: b.reservedQty, expiryDate: b.expiryDate })),
        locations: locations.map(l => ({ binCode: l.bin?.code, batchId: l.batchId, qty: l.qty, status: l.status })),
      },
      timeline: [],
      note: 'Multiple batches exist for this item - search a specific batch number for its full event timeline.',
    };
  }
}
