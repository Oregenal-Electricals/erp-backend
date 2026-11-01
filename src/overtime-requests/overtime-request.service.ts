import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { CreateOvertimeRequestDto, AdjustOvertimeRequestDto } from './dto/overtime-request.dto';

@Injectable()
export class OvertimeRequestService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private settings: SettingsService,
    @Inject(forwardRef(() => WorkflowsService)) private workflows: WorkflowsService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.overtimeRequest.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `OT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productCode: true, productName: true, stageName: true } },
      requestedByUser: { select: { firstName: true, lastName: true, email: true } },
      adjustedByUser: { select: { firstName: true, lastName: true, email: true } },
    };
  }

  // Supervisor requests permission for extra men/hours on a line's Work
  // Order, before any of it is actually worked - the request then goes
  // to Plant Head and Management via the generic workflow engine
  // (documentType OVERTIME_REQUEST). Nothing here touches target/costing
  // yet; that only happens once a production entry is recorded against
  // an APPROVED request (see ProductionEntryService.create()).
  async create(dto: CreateOvertimeRequestDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
    if (!wo) throw new NotFoundException('Work order not found');

    const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
    const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
    const otMultiplier = parseFloat(await this.settings.getSettingValue('STANDARD_OT_MULTIPLIER', '1.5')) || 1.5;
    let labourRateSnapshot: number | null = null;
    let estimatedOtCost: number | null = null;
    if (rate > 0) {
      labourRateSnapshot = rate / shiftHours;
      estimatedOtCost = Math.round(dto.requestedMenCount * dto.requestedHours * labourRateSnapshot * otMultiplier * 100) / 100;
    }

    const requestNumber = await this.generateNumber(user.companyId);
    const request = await this.prisma.overtimeRequest.create({
      data: {
        requestNumber, workOrderId: dto.workOrderId, shiftDate: new Date(dto.shiftDate),
        requestedMenCount: dto.requestedMenCount, requestedHours: dto.requestedHours, reason: dto.reason,
        labourRateSnapshot, otMultiplierSnapshot: otMultiplier, estimatedOtCost,
        status: 'PENDING_APPROVAL', requestedById: user.id,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'overtime_requests', recordId: request.id, action: 'CREATE', newValues: request, changedBy: user.id });
    await this.workflows.submit({ documentType: 'OVERTIME_REQUEST', documentId: request.id, documentNumber: request.requestNumber, amount: estimatedOtCost ?? undefined }, user);
    return request;
  }

  async findAll(user: any, query: any) {
    const { workOrderId, status } = query || {};
    return this.prisma.overtimeRequest.findMany({
      where: { companyId: user.companyId, isActive: true, ...(workOrderId ? { workOrderId } : {}), ...(status ? { status } : {}) },
      include: this.includes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const request = await this.prisma.overtimeRequest.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!request) throw new NotFoundException('Overtime request not found');
    return request;
  }

  // Management (the final approval level) narrowing the approved
  // men/hours before actually clicking Approve on the workflow request.
  // Deliberately a separate call from the generic workflow act() - that
  // engine only knows APPROVED/REJECTED + free-text comments, never a
  // document-specific quantity, so this is where the quantity itself is
  // set, same requested-vs-approved shape used elsewhere in this codebase.
  // Only usable while still PENDING_APPROVAL and only by someone who
  // actually holds OVERTIME_REQUEST_ADJUST (enforced by the controller's
  // @RequirePermissions) - the workflow engine's own per-step approver
  // check still applies separately when they go on to call Approve.
  async adjust(id: string, dto: AdjustOvertimeRequestDto, user: any) {
    const request = await this.prisma.overtimeRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!request) throw new NotFoundException('Overtime request not found');
    if (request.status !== 'PENDING_APPROVAL') throw new BadRequestException(`Request is ${request.status}, not pending approval`);

    const approvedMenCount = dto.approvedMenCount ?? request.approvedMenCount ?? undefined;
    const approvedHours = dto.approvedHours ?? request.approvedHours ?? undefined;
    const data: any = { updatedBy: user.id, adjustedById: user.id, adjustedAt: new Date() };
    if (approvedMenCount !== undefined) data.approvedMenCount = approvedMenCount;
    if (approvedHours !== undefined) data.approvedHours = approvedHours;

    const updated = await this.prisma.overtimeRequest.update({ where: { id }, data, include: this.includes() });
    await this.audit.log({ tableName: 'overtime_requests', recordId: id, action: 'UPDATE', oldValues: request, newValues: updated, changedBy: user.id });
    return updated;
  }

  // Called by WorkflowsService once the OvertimeRequest's ApprovalRequest
  // reaches its final level and is fully APPROVED. approvedMenCount/
  // approvedHours default to whatever was requested if Management never
  // explicitly adjusted them (adjust() above is optional, not mandatory).
  async onWorkflowApproved(id: string, user: any) {
    const request = await this.prisma.overtimeRequest.findFirst({ where: { id } });
    if (!request) return;
    const updated = await this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedMenCount: request.approvedMenCount ?? request.requestedMenCount,
        approvedHours: request.approvedHours ?? request.requestedHours,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'overtime_requests', recordId: id, action: 'UPDATE', oldValues: request, newValues: updated, changedBy: user.id });
    return updated;
  }

  async onWorkflowRejected(id: string, user: any) {
    const request = await this.prisma.overtimeRequest.findFirst({ where: { id } });
    if (!request) return;
    const updated = await this.prisma.overtimeRequest.update({ where: { id }, data: { status: 'REJECTED', updatedBy: user.id } });
    await this.audit.log({ tableName: 'overtime_requests', recordId: id, action: 'UPDATE', oldValues: request, newValues: updated, changedBy: user.id });
    return updated;
  }

  // Used by ProductionEntryService.create() to find the OT authorization
  // (if any) that covers a given Work Order on a given calendar date -
  // an entry's manpowerQty may legitimately exceed the WO's normal
  // approved allocation only up to this request's approvedMenCount.
  async findApprovedForWorkOrderOnDate(workOrderId: string, date: Date, companyId: string) {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    return this.prisma.overtimeRequest.findFirst({
      where: { companyId, workOrderId, status: 'APPROVED', isActive: true, shiftDate: { gte: dayStart, lte: dayEnd } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
