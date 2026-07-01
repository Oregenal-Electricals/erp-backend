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
exports.ComplaintService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ComplaintService = class ComplaintService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.customerComplaint.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `CC-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async create(dto, user) {
        const complaintNumber = await this.generateNumber(user.companyId);
        const complaint = await this.prisma.customerComplaint.create({
            data: {
                complaintNumber, customerId: dto.customerId,
                customerName: dto.customerName, customerPo: dto.customerPo,
                invoiceNumber: dto.invoiceNumber, itemCode: dto.itemCode, itemName: dto.itemName,
                batchNumber: dto.batchNumber,
                complaintDate: dto.complaintDate ? new Date(dto.complaintDate) : new Date(),
                receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(),
                complaintType: dto.complaintType, description: dto.description,
                qtyAffected: dto.qtyAffected || 0, customerRequest: dto.customerRequest,
                severity: dto.severity, assignedTo: dto.assignedTo, remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.audit.log({ tableName: 'customer_complaints', recordId: complaint.id, action: 'CREATE', newValues: complaint, changedBy: user.id });
        return complaint;
    }
    async update(id, dto, user) {
        const complaint = await this.prisma.customerComplaint.findFirst({ where: { id, companyId: user.companyId } });
        if (!complaint)
            throw new common_1.NotFoundException('Complaint not found');
        if (complaint.status === 'CLOSED')
            throw new common_1.BadRequestException('Cannot edit closed complaint');
        const updated = await this.prisma.customerComplaint.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'customer_complaints', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async respond(id, dto, user) {
        const complaint = await this.prisma.customerComplaint.findFirst({ where: { id, companyId: user.companyId } });
        if (!complaint)
            throw new common_1.NotFoundException('Complaint not found');
        if (complaint.status === 'CLOSED')
            throw new common_1.BadRequestException('Already closed');
        const updated = await this.prisma.customerComplaint.update({
            where: { id },
            data: {
                rootCause: dto.rootCause, correctiveAction: dto.correctiveAction,
                eighthDNumber: dto.eighthDNumber, remarks: dto.remarks,
                status: 'RESPONDED', responseDate: new Date(), updatedBy: user.id,
            },
        });
        await this.audit.log({ tableName: 'customer_complaints', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async close(id, user) {
        const complaint = await this.prisma.customerComplaint.findFirst({ where: { id, companyId: user.companyId } });
        if (!complaint)
            throw new common_1.NotFoundException('Complaint not found');
        if (!['RESPONDED'].includes(complaint.status))
            throw new common_1.BadRequestException('Complaint must be RESPONDED before closing');
        const updated = await this.prisma.customerComplaint.update({
            where: { id },
            data: { status: 'CLOSED', closedDate: new Date(), closedBy: user.id, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'customer_complaints', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, severity, complaintType } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { complaintNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { itemCode: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (severity)
            where.severity = severity;
        if (complaintType)
            where.complaintType = complaintType;
        const [data, total] = await Promise.all([
            this.prisma.customerComplaint.findMany({
                where, skip, take: Number(limit), orderBy: { complaintDate: 'desc' },
            }),
            this.prisma.customerComplaint.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const complaint = await this.prisma.customerComplaint.findFirst({ where: { id, companyId: user.companyId } });
        if (!complaint)
            throw new common_1.NotFoundException('Complaint not found');
        return complaint;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, open, investigating, responded, closed, critical, major] = await Promise.all([
            this.prisma.customerComplaint.count({ where }),
            this.prisma.customerComplaint.count({ where: Object.assign(Object.assign({}, where), { status: 'OPEN' }) }),
            this.prisma.customerComplaint.count({ where: Object.assign(Object.assign({}, where), { status: 'INVESTIGATING' }) }),
            this.prisma.customerComplaint.count({ where: Object.assign(Object.assign({}, where), { status: 'RESPONDED' }) }),
            this.prisma.customerComplaint.count({ where: Object.assign(Object.assign({}, where), { status: 'CLOSED' }) }),
            this.prisma.customerComplaint.count({ where: Object.assign(Object.assign({}, where), { severity: 'CRITICAL' }) }),
            this.prisma.customerComplaint.count({ where: Object.assign(Object.assign({}, where), { severity: 'MAJOR' }) }),
        ]);
        const byType = await this.prisma.customerComplaint.groupBy({
            by: ['complaintType'], where, _count: { id: true },
        });
        return { total, open, investigating, responded, closed, critical, major, byType };
    }
};
exports.ComplaintService = ComplaintService;
exports.ComplaintService = ComplaintService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ComplaintService);
//# sourceMappingURL=complaint.service.js.map