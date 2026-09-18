"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchTransportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const dispatch_document_readiness_service_1 = require("../dispatch-document-readiness/dispatch-document-readiness.service");
let DispatchTransportService = class DispatchTransportService {
    constructor(prisma, audit, readiness) {
        this.prisma = prisma;
        this.audit = audit;
        this.readiness = readiness;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.dispatchTransportAssignment.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `TA-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            dispatchPlan: { select: { planNumber: true } },
            salesOrder: { select: { soNumber: true, customerName: true } },
            vehicle: { select: { vehicleNumber: true, vehicleType: true, isCompanyVehicle: true } },
            packages: { include: { items: true } },
        };
    }
    async createAssignment(dto, user) {
        const plan = await this.prisma.dispatchPlan.findFirst({ where: { id: dto.dispatchPlanId, companyId: user.companyId } });
        if (!plan)
            throw new common_1.NotFoundException('Dispatch Plan not found');
        if (plan.status === 'CANCELLED')
            throw new common_1.BadRequestException('This Dispatch Plan is cancelled');
        const hasPacking = await this.prisma.dispatchPacking.count({ where: { verification: { pickList: { dispatchPlanId: dto.dispatchPlanId } }, status: { in: ['PARTIALLY_PACKED', 'PACKED'] } } });
        if (hasPacking === 0)
            throw new common_1.BadRequestException('This Dispatch Plan has no packed quantity yet to assign transport for');
        let vehicleId = null;
        if (dto.vehicleNumber) {
            const vehicle = await this.prisma.vehicle.findFirst({ where: { companyId: user.companyId, vehicleNumber: dto.vehicleNumber } });
            if (vehicle) {
                if (!vehicle.isActive)
                    throw new common_1.BadRequestException(`Vehicle ${dto.vehicleNumber} is inactive/blocked`);
                vehicleId = vehicle.id;
            }
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
    async assignPackage(assignmentId, packageId, user) {
        const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: assignmentId, companyId: user.companyId } });
        if (!assignment)
            throw new common_1.NotFoundException('Transport Assignment not found');
        if (assignment.status === 'CANCELLED')
            throw new common_1.BadRequestException('This assignment is cancelled');
        const pkg = await this.prisma.dispatchPackage.findFirst({
            where: { id: packageId, isActive: true, status: 'ACTIVE', packing: { verification: { pickList: { dispatchPlanId: assignment.dispatchPlanId } } } },
        });
        if (!pkg)
            throw new common_1.NotFoundException('Package not found, not Active, or does not belong to this Dispatch Plan');
        const claim = await this.prisma.$executeRaw `
      UPDATE dispatch_packages SET "assignedTransportAssignmentId" = ${assignmentId}, "updatedBy" = ${user.id}
      WHERE id = ${packageId} AND "assignedTransportAssignmentId" IS NULL
    `;
        if (claim === 0)
            throw new common_1.BadRequestException('This package is already assigned to another active vehicle');
        await this.audit.log({ tableName: 'dispatch_packages', recordId: packageId, action: 'UPDATE', newValues: { assignedTransportAssignmentId: assignmentId }, changedBy: user.id });
        return this.findOne(assignmentId, user);
    }
    async unassignPackage(assignmentId, packageId, user) {
        const pkg = await this.prisma.dispatchPackage.findFirst({ where: { id: packageId, assignedTransportAssignmentId: assignmentId } });
        if (!pkg)
            throw new common_1.NotFoundException('This package is not assigned to this assignment');
        await this.prisma.dispatchPackage.update({ where: { id: packageId }, data: { assignedTransportAssignmentId: null, updatedBy: user.id } });
        await this.audit.log({ tableName: 'dispatch_packages', recordId: packageId, action: 'UPDATE', newValues: { assignedTransportAssignmentId: null }, changedBy: user.id });
        return this.findOne(assignmentId, user);
    }
    async confirmAssignment(assignmentId, user) {
        const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: assignmentId, companyId: user.companyId }, include: { packages: true } });
        if (!assignment)
            throw new common_1.NotFoundException('Transport Assignment not found');
        if (assignment.status === 'CANCELLED')
            throw new common_1.BadRequestException('This assignment is cancelled');
        if (assignment.packages.length === 0)
            throw new common_1.BadRequestException('Assign at least one package before confirming');
        const updated = await this.prisma.dispatchTransportAssignment.update({ where: { id: assignmentId }, data: { status: 'ASSIGNED', updatedBy: user.id }, include: this.includes() });
        await this.audit.log({ tableName: 'dispatch_transport_assignments', recordId: assignmentId, action: 'UPDATE', newValues: { status: 'ASSIGNED' }, changedBy: user.id });
        return updated;
    }
    async reassignVehicle(assignmentId, dto, user) {
        var _a, _b, _c, _d;
        const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: assignmentId, companyId: user.companyId } });
        if (!assignment)
            throw new common_1.NotFoundException('Transport Assignment not found');
        if (assignment.status === 'CANCELLED')
            throw new common_1.BadRequestException('This assignment is cancelled');
        const oldVehicle = { vehicleNumber: assignment.vehicleNumber, driverName: assignment.driverName };
        const updated = await this.prisma.dispatchTransportAssignment.update({
            where: { id: assignmentId },
            data: {
                vehicleNumber: (_a = dto.vehicleNumber) !== null && _a !== void 0 ? _a : assignment.vehicleNumber,
                vehicleType: (_b = dto.vehicleType) !== null && _b !== void 0 ? _b : assignment.vehicleType,
                driverName: (_c = dto.driverName) !== null && _c !== void 0 ? _c : assignment.driverName,
                driverPhone: (_d = dto.driverPhone) !== null && _d !== void 0 ? _d : assignment.driverPhone,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'dispatch_transport_assignments', recordId: assignmentId, action: 'UPDATE',
            newValues: { old: oldVehicle, new: { vehicleNumber: updated.vehicleNumber, driverName: updated.driverName }, reason: dto.reason },
            changedBy: user.id,
        });
        return Object.assign(Object.assign({}, updated), { documentRecheckRequired: true });
    }
    async cancelAssignment(assignmentId, reason, user) {
        const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: assignmentId, companyId: user.companyId } });
        if (!assignment)
            throw new common_1.NotFoundException('Transport Assignment not found');
        await this.prisma.dispatchPackage.updateMany({ where: { assignedTransportAssignmentId: assignmentId }, data: { assignedTransportAssignmentId: null } });
        const updated = await this.prisma.dispatchTransportAssignment.update({ where: { id: assignmentId }, data: { status: 'CANCELLED', remarks: reason, updatedBy: user.id }, include: this.includes() });
        await this.audit.log({ tableName: 'dispatch_transport_assignments', recordId: assignmentId, action: 'UPDATE', newValues: { status: 'CANCELLED', reason }, changedBy: user.id });
        return updated;
    }
    async checkReadyForLoading(assignmentId, user) {
        const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: assignmentId, companyId: user.companyId }, include: { packages: true } });
        if (!assignment)
            throw new common_1.NotFoundException('Transport Assignment not found');
        const docReadiness = await this.readiness.checkReadiness(assignment.dispatchPlanId, user);
        const reasons = [];
        if (assignment.status !== 'ASSIGNED')
            reasons.push('Assignment is not yet confirmed');
        if (assignment.packages.length === 0)
            reasons.push('No packages assigned to this vehicle');
        if (!assignment.vehicleNumber)
            reasons.push('No vehicle number recorded');
        if (docReadiness.overall !== 'DOCUMENTS_READY')
            reasons.push(`Commercial documents: ${docReadiness.overall}`);
        return {
            assignmentId, assignmentNumber: assignment.assignmentNumber,
            readyForLoading: reasons.length === 0, reasons,
            documentReadiness: docReadiness, loadedQty: 0,
        };
    }
    async findOne(id, user) {
        const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!assignment)
            throw new common_1.NotFoundException('Transport Assignment not found');
        return assignment;
    }
};
exports.DispatchTransportService = DispatchTransportService;
exports.DispatchTransportService = DispatchTransportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        dispatch_document_readiness_service_1.DispatchDocumentReadinessService])
], DispatchTransportService);
//# sourceMappingURL=dispatch-transport.service.js.map