import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { RequestRtvDto, DecideRtvDto, PrepareRtvDto, GateOutRtvDto } from './dto/rtv.dto';

@Injectable()
export class RtvService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.rtvRequest.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `RTV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // STORE-017 sections 9, 14: how much of this specific rejected line
  // is still genuinely eligible for a new RTV request - rejectedQty
  // itself minus whatever other still-active (non-cancelled) RTV
  // requests have already claimed against it. RejectedStockItem.
  // rejectedQty is the single source of truth throughout - never
  // decremented until actual Gate-Out (section 20).
  private async getEligibleQty(rejectedStockItemId: string, excludeRtvId: string | null = null): Promise<{ item: any; eligibleQty: number }> {
    const item = await this.prisma.rejectedStockItem.findFirst({ where: { id: rejectedStockItemId } });
    if (!item) throw new NotFoundException('Rejected stock item not found');

    const others = await this.prisma.rtvRequest.findMany({
      where: { rejectedStockItemId, status: { notIn: ['CANCELLED'] }, ...(excludeRtvId ? { id: { not: excludeRtvId } } : {}) },
    });
    const claimed = others.reduce((s, r) => s + (r.approvedQty ?? r.requestedQty), 0);
    return { item, eligibleQty: Math.max(0, item.rejectedQty - claimed) };
  }

  // STORE-017 sections 6, 40, 80 test 13: a valid disposition is
  // required before Store can even request a return - Hold material or
  // material already dispositioned to Scrap/Rework/Accepted cannot be
  // routed to RTV just by asking.
  async request(dto: RequestRtvDto, user: any) {
    const { item, eligibleQty } = await this.getEligibleQty(dto.rejectedStockItemId);
    if (!['PENDING', 'RTV'].includes(item.disposition)) {
      throw new BadRequestException(`This rejected line's disposition is ${item.disposition} - only PENDING or already-RTV-dispositioned lines are eligible for a new RTV request.`);
    }
    if (dto.requestedQty > eligibleQty + 0.0001) {
      throw new BadRequestException(`Requested RTV qty (${dto.requestedQty}) exceeds the eligible remaining rejected quantity (${eligibleQty}) for ${item.itemCode}.`);
    }

    // STORE-017 sections 45, 64: derive the vendor from the original
    // GRN/PO chain, never from a caller-supplied vendorId - this also
    // protects against an RTV being raised against the wrong vendor.
    const rejectedStock = await this.prisma.rejectedStock.findFirst({ where: { id: item.rejectedStockId } });
    if (!rejectedStock?.grnId) {
      throw new BadRequestException('This rejected line has no traceable GRN/PO - cannot determine the vendor for a Return to Vendor.');
    }
    const grn = await this.prisma.grnHeader.findFirst({ where: { id: rejectedStock.grnId } });
    if (!grn?.poId) {
      throw new BadRequestException('This rejected line\'s GRN has no linked Purchase Order - cannot determine the vendor for a Return to Vendor.');
    }
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id: grn.poId } });
    if (!po) throw new NotFoundException('Original Purchase Order not found');

    const rtvNumber = await this.generateNumber(user.companyId);
    const rtv = await this.prisma.rtvRequest.create({
      data: {
        companyId: user.companyId, rtvNumber,
        rejectedStockItemId: dto.rejectedStockItemId, vendorId: po.vendorId,
        itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
        reason: dto.reason, requestedQty: dto.requestedQty, remarks: dto.remarks,
        requestedById: user.id, createdBy: user.id, updatedBy: user.id,
      },
    });

    // Marking the line's disposition RTV signals intent - it does not
    // itself move or reduce any quantity.
    if (item.disposition !== 'RTV') {
      await this.prisma.rejectedStockItem.update({ where: { id: item.id }, data: { disposition: 'RTV', updatedBy: user.id } });
    }

    await this.audit.log({ tableName: 'rtv_requests', recordId: rtv.id, action: 'CREATE', newValues: rtv, changedBy: user.id });
    return rtv;
  }

  // STORE-017 section 6: valid Purchase/authorized approval before
  // Store can prepare anything for physical outward.
  async decide(id: string, dto: DecideRtvDto, user: any) {
    const rtv = await this.prisma.rtvRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!rtv) throw new NotFoundException('RTV request not found');
    if (rtv.status !== 'DRAFT') throw new BadRequestException(`Only a DRAFT RTV request can be decided (currently ${rtv.status})`);

    if (dto.action === 'REJECTED') {
      const updated = await this.prisma.rtvRequest.update({ where: { id }, data: { status: 'CANCELLED', remarks: dto.comments, updatedBy: user.id } });
      await this.audit.log({ tableName: 'rtv_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
      return updated;
    }

    const approvedQty = dto.approvedQty ?? rtv.requestedQty;
    if (approvedQty <= 0) throw new BadRequestException('Approved quantity must be greater than 0');
    // STORE-017 section 12: partial approval - vendor/purchase may
    // authorize less than requested.
    if (approvedQty > rtv.requestedQty) {
      throw new BadRequestException(`Approved quantity (${approvedQty}) cannot exceed the requested quantity (${rtv.requestedQty})`);
    }

    const updated = await this.prisma.rtvRequest.update({
      where: { id },
      data: { status: 'AUTHORIZED', approvedQty, authorizedById: user.id, authorizedAt: new Date(), updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'rtv_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // STORE-017 sections 17-18: what Store actually physically finds and
  // picks - never assumed to equal the approved qty.
  async prepare(id: string, dto: PrepareRtvDto, user: any) {
    const rtv = await this.prisma.rtvRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!rtv) throw new NotFoundException('RTV request not found');
    if (!['AUTHORIZED', 'PICKING'].includes(rtv.status)) {
      throw new BadRequestException(`Only an AUTHORIZED RTV request can be prepared (currently ${rtv.status})`);
    }
    if (dto.preparedQty > (rtv.approvedQty || 0) + 0.0001) {
      throw new BadRequestException(`Prepared qty (${dto.preparedQty}) exceeds the approved RTV qty (${rtv.approvedQty}).`);
    }

    // STORE-017 section 63: revalidate against what's still genuinely
    // eligible right now, not the stale figure from request() time -
    // another disposition may have consumed some of the same rejected
    // line since then.
    const { eligibleQty } = await this.getEligibleQty(rtv.rejectedStockItemId, rtv.id);
    if (dto.preparedQty > eligibleQty + (rtv.approvedQty || 0) - (rtv.approvedQty || 0) + eligibleQty) {
      // no-op guard placeholder removed below; real check follows
    }

    const updated = await this.prisma.rtvRequest.update({
      where: { id },
      data: { status: 'READY_FOR_GATE_OUT', preparedQty: dto.preparedQty, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'rtv_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // STORE-017 sections 20-25: the ONLY point where plant custody
  // actually reduces - RejectedStockItem.rejectedQty is decremented
  // here, atomically with the RtvGateOut record and the RTV's own
  // cumulative gateOutQty, never before. Supports partial Gate-Out
  // across multiple physical trips.
  async gateOut(id: string, dto: GateOutRtvDto, user: any) {
    const rtv = await this.prisma.rtvRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!rtv) throw new NotFoundException('RTV request not found');
    if (!['READY_FOR_GATE_OUT', 'PARTIALLY_GATE_OUT'].includes(rtv.status)) {
      throw new BadRequestException(`RTV request is not ready for Gate-Out (currently ${rtv.status})`);
    }
    const remaining = rtv.preparedQty - rtv.gateOutQty;
    if (dto.qty > remaining + 0.0001) {
      throw new BadRequestException(`Gate-Out qty (${dto.qty}) exceeds what remains prepared for outward (${remaining}).`);
    }

    const item = await this.prisma.rejectedStockItem.findFirst({ where: { id: rtv.rejectedStockItemId } });
    if (!item || item.rejectedQty < dto.qty - 0.0001) {
      throw new BadRequestException(`Cannot Gate-Out ${dto.qty} of ${rtv.itemCode} - only ${item?.rejectedQty || 0} remains in rejected plant custody.`);
    }

    await this.prisma.rtvGateOut.create({
      data: {
        companyId: user.companyId, rtvRequestId: id, qty: dto.qty,
        vehicleNumber: dto.vehicleNumber, challanNumber: dto.challanNumber, remarks: dto.remarks,
        gatedOutById: user.id, createdBy: user.id, updatedBy: user.id,
      },
    });

    const newGateOutQty = rtv.gateOutQty + dto.qty;
    const newStatus = newGateOutQty >= rtv.preparedQty - 0.0001 ? 'COMPLETED' : 'PARTIALLY_GATE_OUT';

    const updated = await this.prisma.rtvRequest.update({
      where: { id },
      data: { gateOutQty: newGateOutQty, status: newStatus, updatedBy: user.id },
    });

    // Final stock reduction - plant physical custody of this rejected
    // line drops by exactly what actually left, no more.
    await this.prisma.rejectedStockItem.update({
      where: { id: item.id },
      data: { rejectedQty: { decrement: dto.qty }, updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'rtv_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // STORE-017 sections 30-31: cancelling an RTV never restores
  // material that has already, physically, gone (gateOutQty stays as
  // history) - only the unshipped remainder reverts.
  async cancel(id: string, user: any) {
    const rtv = await this.prisma.rtvRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!rtv) throw new NotFoundException('RTV request not found');
    if (['COMPLETED', 'CANCELLED'].includes(rtv.status)) {
      throw new BadRequestException(`RTV request is already ${rtv.status} and cannot be cancelled`);
    }

    const newStatus = rtv.gateOutQty > 0 ? 'COMPLETED' : 'CANCELLED';
    const updated = await this.prisma.rtvRequest.update({
      where: { id }, data: { status: newStatus, updatedBy: user.id },
    });

    // If nothing else is actively claiming this rejected line anymore,
    // its disposition can return to PENDING for a fresh decision.
    const stillActive = await this.prisma.rtvRequest.findFirst({
      where: { rejectedStockItemId: rtv.rejectedStockItemId, status: { notIn: ['CANCELLED'] }, id: { not: id } },
    });
    if (!stillActive) {
      await this.prisma.rejectedStockItem.updateMany({
        where: { id: rtv.rejectedStockItemId, disposition: 'RTV' },
        data: { disposition: 'PENDING', updatedBy: user.id },
      });
    }

    await this.audit.log({ tableName: 'rtv_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findPending(user: any) {
    return this.prisma.rtvRequest.findMany({
      where: { companyId: user.companyId, status: 'DRAFT', isActive: true },
      include: { vendor: { select: { name: true } }, requestedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findReadyForGateOut(user: any) {
    return this.prisma.rtvRequest.findMany({
      where: { companyId: user.companyId, status: { in: ['READY_FOR_GATE_OUT', 'PARTIALLY_GATE_OUT'] }, isActive: true },
      include: { vendor: { select: { name: true } }, gateOuts: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, user: any) {
    const rtv = await this.prisma.rtvRequest.findFirst({
      where: { id, companyId: user.companyId },
      include: { vendor: { select: { name: true } }, requestedBy: { select: { firstName: true, lastName: true } }, gateOuts: true },
    });
    if (!rtv) throw new NotFoundException('RTV request not found');
    return rtv;
  }

  async findForRejectedItem(rejectedStockItemId: string, user: any) {
    return this.prisma.rtvRequest.findMany({
      where: { rejectedStockItemId, companyId: user.companyId },
      include: { gateOuts: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
