import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DisposeItemDto, CreateFromFgReceiptDto } from './dto/rejected-stock.dto';

// Roles that can override the "vendor's pickup window hasn't expired
// yet" guard below. Matches the management tier this codebase already
// treats as the final/highest authority elsewhere (e.g.
// MANAGEMENT_TIER_ROLES in iqc-escalation.service.ts), but kept
// SUPER_ADMIN-only here since this is a different, later decision
// (dispose of material already past the IQC deviation stage) than the
// IQC FINAL_AUTHORITY deviation call.
const SCRAP_WINDOW_OVERRIDE_ROLES = ['SUPER_ADMIN'];

@Injectable()
export class RejectedStockService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.rejectedStock.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `REJ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      iqc: { select: { iqcNumber: true } },
      grn: { select: { grnNumber: true, grnType: true } },
      fgReceipt: { select: { receiptNumber: true, workOrder: { select: { woNumber: true, stageName: true } } } },
      warehouse: { select: { name: true, code: true } },
      items: { where: { isActive: true } },
    };
  }

  /**
   * A production reject, not a purchasing one - a Work Order's FG Receipt
   * came back with some quantity that didn't pass, and unlike an IQC
   * rejection there's no incoming inspection item to pull a reason from,
   * so the reason has to be supplied here directly. Reuses the exact same
   * RejectedStock/RejectedStockItem tables and disposition workflow as an
   * IQC rejection - store doesn't need a second, parallel system to track
   * "material that didn't pass" depending on which direction it came from.
   */
  async createFromFgReceipt(fgReceiptId: string, dto: CreateFromFgReceiptDto, user: any) {
    const fgReceipt = await this.prisma.fgReceipt.findFirst({
      where: { id: fgReceiptId, companyId: user.companyId },
      include: { workOrder: { select: { woNumber: true, stageName: true } } },
    });
    if (!fgReceipt) throw new NotFoundException('FG Receipt not found');
    if (fgReceipt.rejectedQty <= 0) throw new BadRequestException('This FG Receipt has no rejected quantity');
    if (!dto.reason || !dto.reason.trim()) throw new BadRequestException('A rejection reason is required');

    const existing = await this.prisma.rejectedStock.findFirst({ where: { fgReceiptId, companyId: user.companyId } });
    if (existing) throw new BadRequestException('Rejection record already exists for this FG Receipt');

    const rejectionNumber = await this.generateNumber(user.companyId);

    const rejected = await this.prisma.rejectedStock.create({
      data: {
        rejectionNumber,
        fgReceiptId,
        warehouseId: fgReceipt.warehouseId,
        totalRejectedQty: fgReceipt.rejectedQty,
        remarks: `From ${fgReceipt.workOrder.woNumber} (${fgReceipt.workOrder.stageName})`,
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
        items: {
          create: [{
            itemCode: fgReceipt.itemCode,
            itemName: fgReceipt.itemName,
            uom: fgReceipt.uom,
            rejectedQty: fgReceipt.rejectedQty,
            rejectionReason: dto.reason.trim(),
            companyId: user.companyId,
            createdBy: user.id, updatedBy: user.id,
          }],
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'rejected_stock', recordId: rejected.id, action: 'CREATE', newValues: rejected, changedBy: user.id });
    return rejected;
  }

  async createFromIqc(iqcId: string, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({
      where: { id: iqcId, companyId: user.companyId },
      include: {
        items: { where: { isActive: true, rejectedQty: { gt: 0 } } },
        grn: true,
      },
    });
    if (!iqc) throw new NotFoundException('IQC not found');
    if (iqc.status !== 'APPROVED') throw new BadRequestException('IQC must be APPROVED');

    const rejectedItems = iqc.items.filter(i => i.rejectedQty > 0);
    if (rejectedItems.length === 0) throw new BadRequestException('No rejected items in this IQC');

    // Check if rejection record already exists
    const existing = await this.prisma.rejectedStock.findFirst({ where: { iqcId, companyId: user.companyId } });
    if (existing) throw new BadRequestException('Rejection record already exists for this IQC');

    const grn = iqc.grn as any;
    const rejectionNumber = await this.generateNumber(user.companyId);
    const totalRejectedQty = rejectedItems.reduce((s, i) => s + i.rejectedQty, 0);

    const rejected = await this.prisma.rejectedStock.create({
      data: {
        rejectionNumber,
        iqcId,
        grnId: grn.id,
        warehouseId: grn.warehouseId,
        totalRejectedQty,
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
        items: {
          create: rejectedItems.map(item => ({
            iqcItemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            rejectedQty: item.rejectedQty,
            rejectionReason: item.rejectionReason,
            companyId: user.companyId,
            createdBy: user.id, updatedBy: user.id,
          })),
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'rejected_stock', recordId: rejected.id, action: 'CREATE', newValues: rejected, changedBy: user.id });
    return rejected;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ rejectionNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.rejectedStock.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          iqc: { select: { iqcNumber: true } },
          grn: { select: { grnNumber: true } },
          warehouse: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.rejectedStock.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const rec = await this.prisma.rejectedStock.findFirst({ where, include: this.includes() });
    if (!rec) throw new NotFoundException('Rejected stock record not found');
    return rec;
  }

  async disposeItem(id: string, itemId: string, dto: DisposeItemDto, user: any) {
    const rec = await this.findOne(id, user);
    if (rec.status === 'CLOSED') throw new BadRequestException('Cannot update closed rejection record');

    const item = (rec.items as any[]).find(i => i.id === itemId);
    if (!item) throw new NotFoundException('Item not found');

    // While a rejected lot is still sitting in the vendor's return
    // window (disposition RTV, deadline not yet passed, and nobody has
    // flagged it eligible already), the company hasn't earned the right
    // to scrap it yet - it's still the vendor's chance to pick it up or
    // replace it. SUPER_ADMIN can still override for a genuine exception.
    const allRoles: string[] = user.allRoles || [user.role, ...(user.additionalRoles || [])];
    const canOverride = allRoles.some(r => SCRAP_WINDOW_OVERRIDE_ROLES.includes(r));
    if (
      dto.disposition === 'SCRAPPED' &&
      item.disposition === 'RTV' &&
      !item.disposalEligible &&
      item.vendorPickupDeadline &&
      new Date(item.vendorPickupDeadline) > new Date() &&
      !canOverride
    ) {
      throw new BadRequestException(
        `This lot's vendor return window hasn't expired yet (deadline: ${new Date(item.vendorPickupDeadline).toISOString().slice(0, 10)}) - wait until then, or ask a Super Admin to override.`,
      );
    }

    await this.prisma.rejectedStockItem.update({
      where: { id: itemId },
      data: {
        disposition: dto.disposition,
        dispositionDate: new Date(),
        dispositionBy: dto.dispositionBy || user.id,
        dispositionNotes: dto.dispositionNotes,
        updatedBy: user.id,
      },
    });

    // Check if all items are dispositioned — update header status
    const updated = await this.findOne(id, user);
    const allDispositioned = (updated.items as any[]).every(i => i.disposition !== 'PENDING');
    const someDispositioned = (updated.items as any[]).some(i => i.disposition !== 'PENDING');

    let newStatus = rec.status;
    if (allDispositioned) newStatus = 'PARTIALLY_DISPOSITIONED';
    else if (someDispositioned) newStatus = 'PARTIALLY_DISPOSITIONED';

    await this.prisma.rejectedStock.update({
      where: { id }, data: { status: newStatus, updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'rejected_stock', recordId: id, action: 'UPDATE', newValues: { itemId, disposition: dto.disposition }, changedBy: user.id });
    return this.findOne(id, user);
  }

  async close(id: string, user: any) {
    const rec = await this.findOne(id, user);
    const pendingItems = (rec.items as any[]).filter(i => i.disposition === 'PENDING');
    if (pendingItems.length > 0) throw new BadRequestException(`${pendingItems.length} item(s) still pending disposition`);
    const updated = await this.prisma.rejectedStock.update({
      where: { id }, data: { status: 'CLOSED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'rejected_stock', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, quarantined, closed] = await Promise.all([
      this.prisma.rejectedStock.count({ where }),
      this.prisma.rejectedStock.count({ where: { ...where, status: 'QUARANTINED' } }),
      this.prisma.rejectedStock.count({ where: { ...where, status: 'CLOSED' } }),
    ]);
    const totalQty = await this.prisma.rejectedStock.aggregate({ where, _sum: { totalRejectedQty: true } });
    const byDisposition = await this.prisma.rejectedStockItem.groupBy({
      by: ['disposition'], where: { companyId: where.companyId }, _count: true, _sum: { rejectedQty: true },
    });
    return { total, quarantined, closed, totalRejectedQty: totalQty._sum.totalRejectedQty || 0, byDisposition };
  }

  // Runs once a day. A rejected lot's vendorPickupDeadline (set at
  // rejection time from the vendor's own returnWindowDays - see
  // maybeCloseInspection in iqc-escalation.service.ts) was previously
  // only ever acted on at creation time: nothing checked back once the
  // window actually passed, so "the company has the right to scrap it"
  // was true in principle but invisible in the system - disposalEligible
  // sat on the schema unused and disposeItem() had no way to know the
  // window had expired. This both flips disposalEligible (which
  // disposeItem()'s guard above now actually reads) and tells
  // Super Admin/Admin so a human decides what happens next - it never
  // scraps anything automatically, since destroying physical inventory
  // is not something to do unattended.
  //
  // The disposalEligible: false filter below is also what stops this
  // from re-notifying for the same lot every day once it's been flagged.
  @Cron('0 6 * * *')
  async flagOverdueVendorReturns() {
    const companies = await this.prisma.company.findMany({ where: { isActive: true }, select: { id: true } });
    const now = new Date();

    for (const company of companies) {
      const overdue = await this.prisma.rejectedStockItem.findMany({
        where: {
          companyId: company.id, isActive: true,
          disposition: 'RTV', disposalEligible: false,
          vendorPickupDeadline: { lt: now },
        },
        include: { rejectedStock: { select: { rejectionNumber: true } } },
      });
      if (overdue.length === 0) continue;

      await this.prisma.rejectedStockItem.updateMany({
        where: { id: { in: overdue.map((i: any) => i.id) } },
        data: { disposalEligible: true },
      });

      const targets = await this.prisma.user.findMany({
        where: { companyId: company.id, isActive: true, role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
        select: { id: true },
      });
      if (targets.length === 0) continue;
      const systemActor = targets[0].id;

      for (const item of overdue as any[]) {
        await this.notifications.createBulk(
          targets.map(t => ({
            userId: t.id,
            type: 'QUALITY_ALERT',
            title: 'Vendor pickup window expired — eligible to scrap',
            message: `${item.rejectedStock?.rejectionNumber || 'Rejected lot'} (${item.itemCode} x${item.rejectedQty}) was not picked up by the vendor within its return window. The company is now free to scrap it.`,
            referenceType: 'REJECTED_STOCK_ITEM', referenceId: item.id, referenceNumber: item.rejectedStock?.rejectionNumber,
            priority: 'HIGH',
          })) as any,
          company.id, systemActor,
        );
      }

      await this.audit.log({
        tableName: 'rejected_stock_items', recordId: overdue.map((i: any) => i.id).join(','), action: 'UPDATE',
        newValues: { disposalEligible: true, count: overdue.length }, changedBy: systemActor,
      });
    }
  }
}
