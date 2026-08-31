import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MaterialReservationService } from './material-reservation.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';
import { SettingsService } from '../settings/settings.service';

const PRIORITY_SETTER_ROLES = ['PLANNING_MANAGER', 'PLANT_HEAD', 'UNIT_HEAD', 'CORPORATE_ADMIN', 'SUPER_ADMIN', 'ADMIN'];
const STAGE_BYPASS_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER'];

@Injectable()
export class WorkOrderService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private materialReservation: MaterialReservationService,
    private workflows: WorkflowsService,
    private notifications: NotificationsService,
    private settings: SettingsService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.workOrder.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `WO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      warehouse: { select: { name: true, code: true } },
      bom: { select: { bomNumber: true, version: true, status: true } },
    };
  }

  async create(dto: CreateWorkOrderDto, user: any) {
    if (dto.priority && dto.priority !== 'MEDIUM' && !PRIORITY_SETTER_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only Planning Manager and above can set Work Order priority above default');
    }
    const woNumber = await this.generateNumber(user.companyId);
    const wo = await this.prisma.workOrder.create({
      data: {
        woNumber, productCode: dto.productCode, productName: dto.productName,
        uom: dto.uom || 'PCS', bomId: dto.bomId,
        warehouseId: dto.warehouseId, plannedQty: dto.plannedQty,
        plannedStartDate: new Date(dto.plannedStartDate),
        plannedEndDate: new Date(dto.plannedEndDate),
        requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : undefined,
        salesOrderId: dto.salesOrderId,
        plannedManpower: dto.plannedManpower,
        priority: dto.priority || 'MEDIUM', remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'work_orders', recordId: wo.id, action: 'CREATE', newValues: wo, changedBy: user.id });
    return wo;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, priority } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    // Operators assigned to a specific stage (SMT, MI, Assembly, Packaging)
    // only see Work Orders for that stage - supervisors and above still see
    // everything so they can monitor the whole chain.
    if (user.assignedStage && !STAGE_BYPASS_ROLES.includes(user.role)) {
      where.stageName = user.assignedStage;
    }
    if (search) where.OR = [
      { woNumber: { contains: search, mode: 'insensitive' } },
      { productCode: { contains: search, mode: 'insensitive' } },
      { productName: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [data, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: this.includes(),
      }),
      this.prisma.workOrder.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const wo = await this.prisma.workOrder.findFirst({
      where,
      include: {
        ...this.includes(),
        bom: { include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } } },
      },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    return wo;
  }

  async update(id: string, dto: UpdateWorkOrderDto, user: any) {
    const wo = await this.findOne(id, user);
    if (['COMPLETED', 'CANCELLED'].includes(wo.status) && dto.status !== 'CANCELLED') {
      throw new BadRequestException(`Cannot update ${wo.status} work order`);
    }
    if (dto.priority && dto.priority !== wo.priority && !PRIORITY_SETTER_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only Planning Manager and above can change Work Order priority');
    }

    const updateData: any = { ...dto, updatedBy: user.id };
    if (dto.actualStartDate) updateData.actualStartDate = new Date(dto.actualStartDate);
    if ((dto as any).releasedAt) updateData.releasedAt = new Date((dto as any).releasedAt);
    if ((dto as any).requiredDate) updateData.requiredDate = new Date((dto as any).requiredDate);
    if (dto.actualEndDate) updateData.actualEndDate = new Date(dto.actualEndDate);

    if (dto.status === 'IN_PROGRESS' && !wo.actualStartDate) {
      updateData.actualStartDate = new Date();
    }
    if (dto.status === 'COMPLETED') {
      updateData.actualEndDate = new Date();
      if (dto.completedQty && dto.completedQty < wo.plannedQty) {
        // partial completion allowed
      }
    }

    const updated = await this.prisma.workOrder.update({
      where: { id }, data: updateData, include: this.includes(),
    });
    await this.audit.log({ tableName: 'work_orders', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // PROD-001: an approved and valid Work Order can be formally released
  // into the Production Queue. Every check below is a real gate, not a
  // formality - a rejection here means the WO stays DRAFT.
  async release(id: string, user: any) {
    const wo = await this.findOne(id, user);
    if (wo.status !== 'DRAFT') throw new BadRequestException('Only DRAFT work orders can be released');

    // Product must exist and be active
    const product = await this.prisma.product.findFirst({ where: { code: wo.productCode, companyId: wo.companyId } });
    if (!product) throw new NotFoundException(`Product ${wo.productCode} not found`);
    if (!product.isActive) throw new BadRequestException(`Product ${wo.productCode} is inactive and cannot be released for production`);

    // Planned quantity must be greater than zero
    if (!wo.plannedQty || wo.plannedQty <= 0) {
      throw new BadRequestException('Planned quantity must be greater than zero to release this Work Order');
    }

    // A valid, approved BOM must exist
    if (!wo.bomId) throw new BadRequestException('A BOM must be attached before this Work Order can be released');
    const bom = await this.prisma.bom.findFirst({ where: { id: wo.bomId, companyId: wo.companyId } });
    if (!bom) throw new NotFoundException('Linked BOM not found');
    if (!['VERIFIED', 'APPROVED'].includes(bom.status)) {
      throw new BadRequestException(`Linked BOM ${bom.bomNumber} is ${bom.status} - only a VERIFIED or APPROVED BOM can be released for production`);
    }

    // Material availability - read-only check, never mutates inventory.
    // Actual reservation happens later, at start() - see that method.
    const materialCheck = await this.checkMaterialAvailability(wo, bom);
    const blockOnShortage = (await this.settings.getSettingValue('WO_BLOCK_RELEASE_ON_SHORTAGE', 'false')) === 'true';
    if (materialCheck.status === 'SHORTAGE' && blockOnShortage) {
      const shortList = materialCheck.shortItems.map((i: any) => i.itemCode).join(', ');
      throw new BadRequestException(`Material shortage - release is blocked by the configured business rule (WO_BLOCK_RELEASE_ON_SHORTAGE). Short items: ${shortList}`);
    }

    // Planned labour cost reference - never posted as actual cost.
    const plannedLabour = await this.computePlannedLabourReference(wo, product);

    const updated = await this.update(id, {
      status: 'RELEASED',
      releasedById: user.id,
      releasedAt: new Date().toISOString(),
      materialAvailability: materialCheck.status,
      plannedManpower: plannedLabour?.plannedManpower,
      plannedLabourHours: plannedLabour?.plannedLabourHours,
      plannedLabourCost: plannedLabour?.plannedLabourCost,
      plannedLabourCostPerPc: plannedLabour?.plannedLabourCostPerPc,
    } as any, user);

    await this.audit.log({
      tableName: 'work_orders', recordId: id, action: 'UPDATE',
      oldValues: { status: 'DRAFT' },
      newValues: { status: 'RELEASED', materialAvailability: materialCheck.status, releasedBy: user.id },
      changedBy: user.id,
    });

    return { ...updated, materialCheck };
  }

  // BOM-item-by-item comparison against current stock. Read-only:
  // never touches StockBalance. Returns AVAILABLE or SHORTAGE plus the
  // list of short items so the releasing user sees exactly what's missing.
  private async checkMaterialAvailability(wo: any, bom: any) {
    const bomItems = await this.prisma.bomItem.findMany({ where: { bomId: bom.id, isActive: true } });
    const shortItems: Array<{ itemCode: string; itemName: string; requiredQty: number; availableQty: number; shortQty: number }> = [];
    for (const item of bomItems) {
      const requiredQty = (item.effectiveQty ?? item.quantity) * wo.plannedQty;
      const stock = await this.prisma.stockBalance.findUnique({
        where: { companyId_itemCode_warehouseId: { companyId: wo.companyId, itemCode: item.itemCode, warehouseId: wo.warehouseId } },
      });
      const availableQty = stock?.availableQty ?? 0;
      if (availableQty < requiredQty) {
        shortItems.push({ itemCode: item.itemCode, itemName: item.itemName, requiredQty, availableQty, shortQty: requiredQty - availableQty });
      }
    }
    return { status: shortItems.length > 0 ? 'SHORTAGE' : 'AVAILABLE', shortItems };
  }

  // Planned labour hours/cost, computed once at release and stored as a
  // snapshot - never posted as actual cost, and never recomputed later
  // even if the productivity/rate master changes afterward. Returns
  // null (skipping the planned figures, not blocking release) if no
  // productivity standard is configured for this product yet.
  private async computePlannedLabourReference(wo: any, product: any) {
    const now = new Date();
    const productivity = await this.prisma.productStandardProductivity.findFirst({
      where: {
        companyId: wo.companyId, productId: product.id, isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!productivity || productivity.piecesPerManHour <= 0) return null;

    const plannedManpower = wo.plannedManpower && wo.plannedManpower > 0 ? wo.plannedManpower : 1;
    const hourlyTarget = plannedManpower * productivity.piecesPerManHour;
    const plannedProductionHours = wo.plannedQty / hourlyTarget;
    const plannedLabourHours = plannedManpower * plannedProductionHours;

    const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
    const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
    if (!rate || rate <= 0) return { plannedManpower, plannedLabourHours, plannedLabourCost: null, plannedLabourCostPerPc: null };

    const hourlyLabourCost = rate / shiftHours;
    const plannedLabourCost = plannedLabourHours * hourlyLabourCost;
    const plannedLabourCostPerPc = wo.plannedQty > 0 ? plannedLabourCost / wo.plannedQty : null;

    return { plannedManpower, plannedLabourHours, plannedLabourCost, plannedLabourCostPerPc };
  }

  async start(id: string, user: any) {
    const wo = await this.findOne(id, user);
    if (wo.status !== 'RELEASED') throw new BadRequestException('Only RELEASED work orders can be started');
    // Plant Head (and above) starting a Work Order is the approval itself -
    // no need to wait on themselves. Anyone else's start request goes
    // through the same generic multi-level approval engine already used
    // for PO/SO/Voucher approvals, and doesn't take effect until a Plant
    // Head approves it.
    if (STAGE_BYPASS_ROLES.includes(user.role)) {
      const updated = await this.update(id, { status: 'IN_PROGRESS', actualStartDate: new Date().toISOString() }, user);
      // Material reservation moves here from release() (PROD-001) - this
      // is the point production is actually about to begin consuming
      // material, not the earlier administrative "approved to exist" step.
      const reservations = await this.materialReservation.reserveForWorkOrder(id, user);
      return { ...updated, materialReservations: reservations };
    }
    const { request } = await this.workflows.submit({
      documentType: 'WO_START', documentId: wo.id, documentNumber: wo.woNumber,
      remarks: `Start requested by ${user.firstName || ''} ${user.lastName || ''}`.trim(),
    }, user);
    return { ...wo, pendingApproval: true, approvalRequestId: request?.id, message: 'Submitted for Plant Head approval - this Work Order has not started yet' };
  }

  // Anyone can pause an in-progress Work Order without approval - it's
  // resuming it that needs Plant Head sign-off, matching real floor
  // practice (stopping for a genuine issue shouldn't need a form, but
  // deciding it's safe to resume is a real production call).
  async stop(id: string, user: any) {
    const wo = await this.findOne(id, user);
    if (wo.status !== 'IN_PROGRESS') throw new BadRequestException('Only IN_PROGRESS work orders can be stopped');
    return this.update(id, { status: 'STOPPED' }, user);
  }

  async restart(id: string, user: any) {
    const wo = await this.findOne(id, user);
    if (wo.status !== 'STOPPED') throw new BadRequestException('Only STOPPED work orders can be restarted');
    if (STAGE_BYPASS_ROLES.includes(user.role)) {
      return this.update(id, { status: 'IN_PROGRESS' }, user);
    }
    const { request } = await this.workflows.submit({
      documentType: 'WO_RESTART', documentId: wo.id, documentNumber: wo.woNumber,
      remarks: `Restart requested by ${user.firstName || ''} ${user.lastName || ''}`.trim(),
    }, user);
    return { ...wo, pendingApproval: true, approvalRequestId: request?.id, message: 'Submitted for Plant Head approval - this Work Order is still stopped' };
  }

  // One shared approve/reject path for every gated production action -
  // dispatches to the right underlying execution based on what kind of
  // request it is, so adding a new gated action later is just one more
  // case here rather than a whole new approve/reject pair.
  async approveRequest(requestId: string, user: any) {
    const actionResult = await this.workflows.act(requestId, { action: 'APPROVED' }, user);
    if (actionResult.status === 'APPROVED') {
      if (actionResult.documentType === 'WO_START') await this.start(actionResult.documentId, user);
      else if (actionResult.documentType === 'WO_RESTART') await this.update(actionResult.documentId, { status: 'IN_PROGRESS' }, user);
      else if (actionResult.documentType === 'WO_REASSIGN_QTY') await this.applyPendingReassign(actionResult.documentId, user);
      await this.notifyAdmins(user, actionResult, `${actionResult.documentType.replace(/_/g, ' ')} approved`);
    }
    return actionResult;
  }

  async rejectRequest(requestId: string, user: any, comments?: string) {
    const result = await this.workflows.act(requestId, { action: 'REJECTED', comments }, user);
    if (result.documentType === 'WO_REASSIGN_QTY') {
      // Clear the parked target quantity - the WO stays at its current
      // plannedQty, nothing was ever actually applied.
      await this.prisma.workOrder.update({ where: { id: result.documentId }, data: { pendingReassignQty: null, updatedBy: user.id } });
    }
    return result;
  }

  private async applyPendingReassign(id: string, user: any) {
    const wo = await this.prisma.workOrder.findUnique({ where: { id } });
    if (wo?.pendingReassignQty == null) return;
    const oldQty = wo.plannedQty;
    await this.prisma.workOrder.update({
      where: { id }, data: { plannedQty: wo.pendingReassignQty, pendingReassignQty: null, updatedBy: user.id },
    });
    await this.audit.log({
      tableName: 'work_orders', recordId: id, action: 'UPDATE',
      oldValues: { plannedQty: oldQty }, newValues: { plannedQty: wo.pendingReassignQty },
      changedBy: user.id, reason: 'Quantity reassignment approved',
    });
  }

  /**
   * Read-only. Shows exactly what a quantity reassignment would mean before
   * anything changes: the hard floor (can never go below completedQty -
   * you can't un-produce what's already been made), and for every raw
   * material already issued to this WO, how much was issued for the
   * CURRENT quantity vs. how much the NEW quantity actually needs. That
   * gap is informational only - this never touches the stock ledger. If
   * the gap is real (material genuinely still sitting untouched) it's the
   * caller's job to return it via Stock Adjustment or Rejected Stock,
   * exactly like any other physical correction in this system.
   */
  async previewReassignQty(id: string, newPlannedQty: number, user: any) {
    const wo = await this.findOne(id, user);
    if (newPlannedQty < wo.completedQty) {
      throw new BadRequestException(`Cannot reassign below ${wo.completedQty} - that many units are already completed`);
    }

    const items: Array<{ itemCode: string; itemName: string; uom: string; issuedForCurrentQty: number; neededForNewQty: number; excess: number }> = [];
    if (wo.bom?.items?.length) {
      const issuedRows = await this.prisma.productionIssueItem.groupBy({
        by: ['itemCode'],
        where: { productionIssue: { workOrderId: id, status: 'ISSUED' }, isActive: true },
        _sum: { issuedQty: true },
      });
      const issuedMap = new Map<string, number>(issuedRows.map((r) => [r.itemCode, Number(r._sum.issuedQty) || 0]));

      for (const bi of wo.bom.items) {
        const issuedForCurrentQty = issuedMap.get(bi.itemCode) || 0;
        if (issuedForCurrentQty === 0) continue; // nothing issued yet for this item - no gap to show
        const neededForNewQty = Math.round(bi.effectiveQty * newPlannedQty * 100) / 100;
        const excess = Math.max(0, Math.round((issuedForCurrentQty - neededForNewQty) * 100) / 100);
        items.push({ itemCode: bi.itemCode, itemName: bi.itemName, uom: bi.uom, issuedForCurrentQty, neededForNewQty, excess });
      }
    }

    return {
      currentPlannedQty: wo.plannedQty, newPlannedQty, completedQty: wo.completedQty,
      floor: wo.completedQty, items,
    };
  }

  async reassignQty(id: string, newPlannedQty: number, remarks: string | undefined, user: any) {
    const wo = await this.findOne(id, user);
    if (['COMPLETED', 'CANCELLED'].includes(wo.status)) {
      throw new BadRequestException(`Cannot reassign quantity on a ${wo.status} work order`);
    }
    if (newPlannedQty < wo.completedQty) {
      throw new BadRequestException(`Cannot reassign below ${wo.completedQty} - that many units are already completed`);
    }
    if (newPlannedQty === wo.plannedQty) {
      throw new BadRequestException('New quantity is the same as the current planned quantity');
    }

    const preview = await this.previewReassignQty(id, newPlannedQty, user);
    const excessNote = preview.items.some((i) => i.excess > 0)
      ? ' Issued-material excess: ' + preview.items.filter((i) => i.excess > 0).map((i) => `${i.itemCode} +${i.excess} ${i.uom}`).join(', ') + '.'
      : '';
    const fullRemarks = `${remarks || `Reassign ${wo.plannedQty} \u2192 ${newPlannedQty}`} (requested by ${user.firstName || ''} ${user.lastName || ''})`.trim() + excessNote;

    if (STAGE_BYPASS_ROLES.includes(user.role)) {
      const oldQty = wo.plannedQty;
      const updated = await this.prisma.workOrder.update({
        where: { id }, data: { plannedQty: newPlannedQty, updatedBy: user.id }, include: this.includes(),
      });
      await this.audit.log({
        tableName: 'work_orders', recordId: id, action: 'UPDATE',
        oldValues: { plannedQty: oldQty }, newValues: { plannedQty: newPlannedQty },
        changedBy: user.id, reason: fullRemarks,
      });
      return { ...updated, pendingApproval: false, materialExcess: preview.items.filter((i) => i.excess > 0) };
    }

    await this.prisma.workOrder.update({ where: { id }, data: { pendingReassignQty: newPlannedQty, updatedBy: user.id } });
    const { request } = await this.workflows.submit({
      documentType: 'WO_REASSIGN_QTY', documentId: wo.id, documentNumber: wo.woNumber,
      remarks: fullRemarks,
    }, user);
    return {
      ...wo, pendingApproval: true, approvalRequestId: request?.id,
      message: `Submitted for Plant Head approval - still planned at ${wo.plannedQty} until approved`,
      materialExcess: preview.items.filter((i) => i.excess > 0),
    };
  }

  private async notifyAdmins(actorUser: any, request: any, message: string) {
    const admins = await this.prisma.user.findMany({
      where: { companyId: actorUser.companyId, role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });
    for (const admin of admins) {
      await this.notifications.create({
        userId: admin.id, type: 'PRODUCTION_APPROVAL', title: 'Production approval action',
        message: `${message}: ${request.documentNumber}`,
        referenceType: request.documentType, referenceId: request.documentId,
        referenceNumber: request.documentNumber, priority: 'MEDIUM',
      }, actorUser.companyId, actorUser.id);
    }
  }

  async complete(id: string, dto: { completedQty: number; rejectedQty?: number }, user: any) {
    const wo = await this.findOne(id, user);
    if (wo.status !== 'IN_PROGRESS') throw new BadRequestException('Only IN_PROGRESS work orders can be completed');

    // In-process quality is a real gate, not just a log: if the most
    // recent IPQC inspection for this WO failed, completion is blocked
    // until a corrective re-inspection (a new IPQC record with a PASS or
    // CONDITIONAL result) exists. This holds even after a Plant Head
    // approves resuming a stopped WO - approving the restart isn't the
    // same as confirming the underlying quality issue was actually fixed.
    const lastQc = await this.prisma.productionQc.findFirst({
      where: { companyId: user.companyId, workOrderId: id, status: 'COMPLETED' },
      orderBy: { inspectionDate: 'desc' },
    });
    if (lastQc && lastQc.result === 'FAIL') {
      throw new BadRequestException(`Cannot complete: the most recent in-process QC inspection (${lastQc.qcNumber}) failed. Record a corrective re-inspection with a PASS or CONDITIONAL result first.`);
    }

    const result = await this.update(id, {
      status: 'COMPLETED', completedQty: dto.completedQty,
      rejectedQty: dto.rejectedQty || 0, actualEndDate: new Date().toISOString(),
    }, user);
    await this.materialReservation.releaseReservations(id, user, true);
    return result;
  }

  async cancel(id: string, user: any) {
    const wo = await this.findOne(id, user);
    if (wo.status === 'COMPLETED') throw new BadRequestException('Cannot cancel completed work order');
    const result = await this.update(id, { status: 'CANCELLED' }, user);
    await this.materialReservation.releaseReservations(id, user, false);
    return result;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (user.assignedStage && !STAGE_BYPASS_ROLES.includes(user.role)) {
      where.stageName = user.assignedStage;
    }
    const [total, draft, released, inProgress, completed, cancelled] = await Promise.all([
      this.prisma.workOrder.count({ where }),
      this.prisma.workOrder.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.workOrder.count({ where: { ...where, status: 'RELEASED' } }),
      this.prisma.workOrder.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.workOrder.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.workOrder.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const totals = await this.prisma.workOrder.aggregate({
      where, _sum: { plannedQty: true, completedQty: true, rejectedQty: true },
    });
    return {
      total, draft, released, inProgress, completed, cancelled,
      totalPlanned: totals._sum.plannedQty || 0,
      totalCompleted: totals._sum.completedQty || 0,
      totalRejected: totals._sum.rejectedQty || 0,
    };
  }
}
