import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MaterialReservationService } from './material-reservation.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';

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

  async release(id: string, user: any) {
    const wo = await this.findOne(id, user);
    if (wo.status !== 'DRAFT') throw new BadRequestException('Only DRAFT work orders can be released');
    const updated = await this.update(id, { status: 'RELEASED' }, user);
    const reservations = await this.materialReservation.reserveForWorkOrder(id, user);
    return { ...updated, materialReservations: reservations };
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
      return this.update(id, { status: 'IN_PROGRESS', actualStartDate: new Date().toISOString() }, user);
    }
    const { request } = await this.workflows.submit({
      documentType: 'WO_START', documentId: wo.id, documentNumber: wo.woNumber,
      remarks: `Start requested by ${user.firstName || ''} ${user.lastName || ''}`.trim(),
    }, user);
    return { ...wo, pendingApproval: true, approvalRequestId: request?.id, message: 'Submitted for Plant Head approval - this Work Order has not started yet' };
  }

  async approveStart(requestId: string, user: any) {
    const actionResult = await this.workflows.act(requestId, { action: 'APPROVED' }, user);
    if (actionResult.status === 'APPROVED') {
      await this.start(actionResult.documentId, user);
      await this.notifyAdmins(user, actionResult, 'Work Order start approved');
    }
    return actionResult;
  }

  async rejectStart(requestId: string, user: any, comments?: string) {
    return this.workflows.act(requestId, { action: 'REJECTED', comments }, user);
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
