import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { DispatchDocumentReadinessService } from '../dispatch-document-readiness/dispatch-document-readiness.service';

@Injectable()
export class DispatchTransportService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private readiness: DispatchDocumentReadinessService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.dispatchTransportAssignment.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `TA-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      dispatchPlan: { select: { planNumber: true } },
      salesOrder: { select: { soNumber: true, customerName: true } },
      vehicle: { select: { vehicleNumber: true, vehicleType: true, isCompanyVehicle: true } },
      packages: { include: { items: true } },
    };
  }

  // DSP-010 sections 6-9: reuses the existing Vehicle master when a
  // match exists (never duplicates it); section 8: an existing but
  // inactive Vehicle record is blocked, matching the same eligibility
  // philosophy DSP-007 used for batch status.
  async createAssignment(dto: any, user: any) {
    const plan = await this.prisma.dispatchPlan.findFirst({ where: { id: dto.dispatchPlanId, companyId: user.companyId } });
    if (!plan) throw new NotFoundException('Dispatch Plan not found');
    if (plan.status === 'CANCELLED') throw new BadRequestException('This Dispatch Plan is cancelled');

    const hasPacking = await this.prisma.dispatchPacking.count({ where: { verification: { pickList: { dispatchPlanId: dto.dispatchPlanId } }, status: { in: ['PARTIALLY_PACKED', 'PACKED'] } } });
    if (hasPacking === 0) throw new BadRequestException('This Dispatch Plan has no packed quantity yet to assign transport for');

    let vehicleId: string | null = null;
    if (dto.vehicleNumber) {
      const vehicle = await this.prisma.vehicle.findFirst({ where: { companyId: user.companyId, vehicleNumber: dto.vehicleNumber } });
      if (vehicle) {
        if (!vehicle.isActive) throw new BadRequestException(`Vehicle ${dto.vehicleNumber} is inactive/blocked`);
        vehicleId = vehicle.id;
      }
      // No master match: capture the plain vehicleNumber as given (section 11 -
      // controlled assignment for vehicles not pre-registered).
    }

    const assignmentNumber = await this.generateNumber(user.companyId);
    const assignment = await this.prisma.dispatchTransportAssignment.create({
      data: {
        assignmentNumber, dispatchPlanId: dto.dispatchPlanId, soId: plan.soId, customerName: plan.customerName,
        transportType: dto.transportType || 'TRANSPORTER_VEHICLE', transporterName: dto.transporterName,
        vehicleId, vehicleNumber: dto.vehicleNumber, vehicleType: dto.vehicleType,
        driverName: dto.driverName, driverPhone: dto.driverPhone, lrNumber: dto.lrNumber,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'dispatch_transport_assignments', recordId: assignment.id, action: 'CREATE', newValues: assignment, changedBy: user.id });
    return assignment;
  }

  // DSP-010 sections 18-19, 29, 59: atomic conditional claim - the
  // exact same compare-and-swap pattern used for every other claim in
  // this Dispatch chain, here at the WHERE-clause level: a package can
  // only move from unassigned to assigned once, so two concurrent
  // requests for the same package can never both succeed.
  async assignPackage(assignmentId: string, packageId: string, user: any) {
    const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: assignmentId, companyId: user.companyId } });
    if (!assignment) throw new NotFoundException('Transport Assignment not found');
    if (assignment.status === 'CANCELLED') throw new BadRequestException('This assignment is cancelled');

    const pkg = await this.prisma.dispatchPackage.findFirst({
      where: { id: packageId, isActive: true, status: 'ACTIVE', packing: { verification: { pickList: { dispatchPlanId: assignment.dispatchPlanId } } } },
    });
    if (!pkg) throw new NotFoundException('Package not found, not Active, or does not belong to this Dispatch Plan');

    const claim: number = await this.prisma.$executeRaw`
      UPDATE dispatch_packages SET "assignedTransportAssignmentId" = ${assignmentId}, "updatedBy" = ${user.id}
      WHERE id = ${packageId} AND "assignedTransportAssignmentId" IS NULL
    `;
    if (claim === 0) throw new BadRequestException('This package is already assigned to another active vehicle');

    await this.audit.log({ tableName: 'dispatch_packages', recordId: packageId, action: 'UPDATE', newValues: { assignedTransportAssignmentId: assignmentId }, changedBy: user.id });
    return this.findOne(assignmentId, user);
  }

  async unassignPackage(assignmentId: string, packageId: string, user: any) {
    const pkg = await this.prisma.dispatchPackage.findFirst({ where: { id: packageId, assignedTransportAssignmentId: assignmentId } });
    if (!pkg) throw new NotFoundException('This package is not assigned to this assignment');
    await this.prisma.dispatchPackage.update({ where: { id: packageId }, data: { assignedTransportAssignmentId: null, updatedBy: user.id } });
    await this.audit.log({ tableName: 'dispatch_packages', recordId: packageId, action: 'UPDATE', newValues: { assignedTransportAssignmentId: null }, changedBy: user.id });
    return this.findOne(assignmentId, user);
  }

  async confirmAssignment(assignmentId: string, user: any) {
    const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: assignmentId, companyId: user.companyId }, include: { packages: true } });
    if (!assignment) throw new NotFoundException('Transport Assignment not found');
    if (assignment.status === 'CANCELLED') throw new BadRequestException('This assignment is cancelled');
    if (assignment.packages.length === 0) throw new BadRequestException('Assign at least one package before confirming');
    const updated = await this.prisma.dispatchTransportAssignment.update({ where: { id: assignmentId }, data: { status: 'ASSIGNED', updatedBy: user.id }, include: this.includes() });
    await this.audit.log({ tableName: 'dispatch_transport_assignments', recordId: assignmentId, action: 'UPDATE', newValues: { status: 'ASSIGNED' }, changedBy: user.id });
    return updated;
  }

  // DSP-010 sections 36-37, 84: preserves full history via audit
  // rather than overwriting silently, and flags document recheck
  // rather than silently keeping stale readiness - readiness itself
  // is never cached (matches DSP-009's own design), so the "recheck"
  // is really just the natural fact that the very next readiness call
  // will already reflect the new vehicle.
  async reassignVehicle(assignmentId: string, dto: any, user: any) {
    const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: assignmentId, companyId: user.companyId } });
    if (!assignment) throw new NotFoundException('Transport Assignment not found');
    if (assignment.status === 'CANCELLED') throw new BadRequestException('This assignment is cancelled');

    const oldVehicle = { vehicleNumber: assignment.vehicleNumber, driverName: assignment.driverName };
    const updated = await this.prisma.dispatchTransportAssignment.update({
      where: { id: assignmentId },
      data: {
        vehicleNumber: dto.vehicleNumber ?? assignment.vehicleNumber,
        vehicleType: dto.vehicleType ?? assignment.vehicleType,
        driverName: dto.driverName ?? assignment.driverName,
        driverPhone: dto.driverPhone ?? assignment.driverPhone,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({
      tableName: 'dispatch_transport_assignments', recordId: assignmentId, action: 'UPDATE',
      newValues: { old: oldVehicle, new: { vehicleNumber: updated.vehicleNumber, driverName: updated.driverName }, reason: dto.reason },
      changedBy: user.id,
    });
    return { ...updated, documentRecheckRequired: true };
  }

  // DSP-010 sections 56-57: cancellation only releases the package
  // allocation - it never touches Reservation/Pick/Verification/
  // Packing, and packages remain committed to this Dispatch (not free
  // inventory), simply no longer bound to a vehicle.
  async cancelAssignment(assignmentId: string, reason: string | undefined, user: any) {
    const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: assignmentId, companyId: user.companyId } });
    if (!assignment) throw new NotFoundException('Transport Assignment not found');
    await this.prisma.dispatchPackage.updateMany({ where: { assignedTransportAssignmentId: assignmentId }, data: { assignedTransportAssignmentId: null } });
    const updated = await this.prisma.dispatchTransportAssignment.update({ where: { id: assignmentId }, data: { status: 'CANCELLED', remarks: reason, updatedBy: user.id }, include: this.includes() });
    await this.audit.log({ tableName: 'dispatch_transport_assignments', recordId: assignmentId, action: 'UPDATE', newValues: { status: 'CANCELLED', reason }, changedBy: user.id });
    return updated;
  }

  // DSP-010 section 50-51: READY FOR LOADING is computed fresh every
  // time from live upstream state (packages assigned + DSP-009
  // document readiness), never a stored flag - and it never implies
  // Loaded Qty > 0.
  async checkReadyForLoading(assignmentId: string, user: any) {
    const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: assignmentId, companyId: user.companyId }, include: { packages: true } });
    if (!assignment) throw new NotFoundException('Transport Assignment not found');

    const docReadiness = await this.readiness.checkReadiness(assignment.dispatchPlanId, user);
    const reasons: string[] = [];
    if (assignment.status !== 'ASSIGNED') reasons.push('Assignment is not yet confirmed');
    if (assignment.packages.length === 0) reasons.push('No packages assigned to this vehicle');
    if (!assignment.vehicleNumber) reasons.push('No vehicle number recorded');
    if (docReadiness.overall !== 'DOCUMENTS_READY') reasons.push(`Commercial documents: ${docReadiness.overall}`);

    return {
      assignmentId, assignmentNumber: assignment.assignmentNumber,
      readyForLoading: reasons.length === 0, reasons,
      documentReadiness: docReadiness, loadedQty: 0,
    };
  }

  async findOne(id: string, user: any) {
    const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!assignment) throw new NotFoundException('Transport Assignment not found');
    return assignment;
  }
}
