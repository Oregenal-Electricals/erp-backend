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
exports.ChangeRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const settings_service_1 = require("../settings/settings.service");
const client_1 = require("@prisma/client");
const APPROVER_ROLES = [
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.CORPORATE_ADMIN,
    client_1.UserRole.PLANT_HEAD,
    client_1.UserRole.FINANCE_MANAGER,
    client_1.UserRole.HR_MANAGER,
];
let ChangeRequestsService = class ChangeRequestsService {
    constructor(prisma, audit, settings) {
        this.prisma = prisma;
        this.audit = audit;
        this.settings = settings;
    }
    async create(dto, user) {
        var _a;
        let requestNumber;
        try {
            requestNumber = await this.settings.getNextNumber(user.companyId, 'CR');
        }
        catch (_b) {
            const count = await this.prisma.changeRequest.count({
                where: { companyId: user.companyId },
            });
            const now = new Date();
            const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
            requestNumber = `CR-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
        }
        const cr = await this.prisma.changeRequest.create({
            data: {
                requestNumber,
                title: dto.title,
                description: dto.description,
                type: dto.type,
                priority: (_a = dto.priority) !== null && _a !== void 0 ? _a : 'NORMAL',
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                companyId: user.companyId,
                requestedById: user.id,
                createdBy: user.id,
                updatedBy: user.id,
            },
            include: this.includeRelations(),
        });
        await this.audit.log({
            tableName: 'change_requests',
            recordId: cr.id,
            action: 'CREATE',
            newValues: { requestNumber, title: dto.title, type: dto.type },
            changedBy: user.id,
        });
        return cr;
    }
    async findAll(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.status)
            where.status = filters.status;
        if (filters.type)
            where.type = filters.type;
        if (filters.myRequests) {
            where.requestedById = user.id;
        }
        if (filters.pendingApproval && APPROVER_ROLES.includes(user.role)) {
            where.status = { in: ['SUBMITTED', 'UNDER_REVIEW'] };
        }
        if (!APPROVER_ROLES.includes(user.role) && !filters.myRequests) {
            where.requestedById = user.id;
        }
        return this.prisma.changeRequest.findMany({
            where,
            include: this.includeRelations(),
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, user) {
        const cr = await this.prisma.changeRequest.findUnique({
            where: { id },
            include: Object.assign(Object.assign({}, this.includeRelations()), { comments: {
                    include: {
                        commenter: {
                            select: { id: true, firstName: true, lastName: true, role: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                } }),
        });
        if (!cr)
            throw new common_1.NotFoundException('Change request not found');
        const canView = APPROVER_ROLES.includes(user.role) || cr.requestedById === user.id;
        if (!canView)
            throw new common_1.ForbiddenException('You can only view your own requests');
        if (cr.status === client_1.ChangeRequestStatus.SUBMITTED &&
            APPROVER_ROLES.includes(user.role)) {
            await this.prisma.changeRequest.update({
                where: { id },
                data: { status: client_1.ChangeRequestStatus.UNDER_REVIEW, updatedBy: user.id },
            });
            cr.status = client_1.ChangeRequestStatus.UNDER_REVIEW;
        }
        return cr;
    }
    async update(id, dto, user) {
        const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
        if (!cr)
            throw new common_1.NotFoundException('Change request not found');
        if (cr.requestedById !== user.id)
            throw new common_1.ForbiddenException('You can only edit your own requests');
        if (cr.status !== client_1.ChangeRequestStatus.DRAFT) {
            throw new common_1.BadRequestException('Only DRAFT requests can be edited');
        }
        const updated = await this.prisma.changeRequest.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined, updatedBy: user.id }),
            include: this.includeRelations(),
        });
        await this.audit.log({
            tableName: 'change_requests',
            recordId: id,
            action: 'UPDATE',
            oldValues: cr,
            newValues: dto,
            changedBy: user.id,
        });
        return updated;
    }
    async submit(id, user) {
        const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
        if (!cr)
            throw new common_1.NotFoundException('Change request not found');
        if (cr.requestedById !== user.id)
            throw new common_1.ForbiddenException('You can only submit your own requests');
        if (cr.status !== client_1.ChangeRequestStatus.DRAFT) {
            throw new common_1.BadRequestException('Only DRAFT requests can be submitted');
        }
        const updated = await this.prisma.changeRequest.update({
            where: { id },
            data: {
                status: client_1.ChangeRequestStatus.SUBMITTED,
                submittedAt: new Date(),
                updatedBy: user.id,
            },
            include: this.includeRelations(),
        });
        await this.audit.log({
            tableName: 'change_requests',
            recordId: id,
            action: 'UPDATE',
            oldValues: { status: 'DRAFT' },
            newValues: { status: 'SUBMITTED' },
            changedBy: user.id,
            reason: 'Request submitted for approval',
        });
        return updated;
    }
    async approve(id, dto, user) {
        if (!APPROVER_ROLES.includes(user.role)) {
            throw new common_1.ForbiddenException('You do not have permission to approve requests');
        }
        const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
        if (!cr)
            throw new common_1.NotFoundException('Change request not found');
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(cr.status)) {
            throw new common_1.BadRequestException('Only SUBMITTED or UNDER_REVIEW requests can be approved');
        }
        const updated = await this.prisma.changeRequest.update({
            where: { id },
            data: {
                status: client_1.ChangeRequestStatus.APPROVED,
                reviewedById: user.id,
                reviewedAt: new Date(),
                reviewComment: dto.reviewComment,
                updatedBy: user.id,
            },
            include: this.includeRelations(),
        });
        await this.audit.log({
            tableName: 'change_requests',
            recordId: id,
            action: 'UPDATE',
            oldValues: { status: cr.status },
            newValues: { status: 'APPROVED' },
            changedBy: user.id,
            reason: `Approved: ${dto.reviewComment}`,
        });
        return updated;
    }
    async reject(id, dto, user) {
        if (!APPROVER_ROLES.includes(user.role)) {
            throw new common_1.ForbiddenException('You do not have permission to reject requests');
        }
        const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
        if (!cr)
            throw new common_1.NotFoundException('Change request not found');
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(cr.status)) {
            throw new common_1.BadRequestException('Only SUBMITTED or UNDER_REVIEW requests can be rejected');
        }
        const updated = await this.prisma.changeRequest.update({
            where: { id },
            data: {
                status: client_1.ChangeRequestStatus.REJECTED,
                reviewedById: user.id,
                reviewedAt: new Date(),
                reviewComment: dto.reviewComment,
                updatedBy: user.id,
            },
            include: this.includeRelations(),
        });
        await this.audit.log({
            tableName: 'change_requests',
            recordId: id,
            action: 'UPDATE',
            oldValues: { status: cr.status },
            newValues: { status: 'REJECTED' },
            changedBy: user.id,
            reason: `Rejected: ${dto.reviewComment}`,
        });
        return updated;
    }
    async cancel(id, user) {
        const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
        if (!cr)
            throw new common_1.NotFoundException('Change request not found');
        if (cr.requestedById !== user.id && !APPROVER_ROLES.includes(user.role)) {
            throw new common_1.ForbiddenException('You can only cancel your own requests');
        }
        if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(cr.status)) {
            throw new common_1.BadRequestException(`Cannot cancel a ${cr.status} request`);
        }
        const updated = await this.prisma.changeRequest.update({
            where: { id },
            data: { status: client_1.ChangeRequestStatus.CANCELLED, updatedBy: user.id },
            include: this.includeRelations(),
        });
        await this.audit.log({
            tableName: 'change_requests',
            recordId: id,
            action: 'UPDATE',
            oldValues: { status: cr.status },
            newValues: { status: 'CANCELLED' },
            changedBy: user.id,
            reason: 'Request cancelled',
        });
        return updated;
    }
    async addComment(id, dto, user) {
        const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
        if (!cr)
            throw new common_1.NotFoundException('Change request not found');
        const canComment = APPROVER_ROLES.includes(user.role) || cr.requestedById === user.id;
        if (!canComment)
            throw new common_1.ForbiddenException('You cannot comment on this request');
        const comment = await this.prisma.changeRequestComment.create({
            data: {
                changeRequestId: id,
                comment: dto.comment,
                commentBy: user.id,
                createdBy: user.id,
                updatedBy: user.id,
            },
            include: {
                commenter: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
        });
        return comment;
    }
    async getStats(user) {
        const base = { companyId: user.companyId };
        const myBase = { companyId: user.companyId, requestedById: user.id };
        const [total, draft, submitted, underReview, approved, rejected, myTotal, pendingApproval,] = await Promise.all([
            this.prisma.changeRequest.count({ where: base }),
            this.prisma.changeRequest.count({ where: Object.assign(Object.assign({}, base), { status: 'DRAFT' }) }),
            this.prisma.changeRequest.count({
                where: Object.assign(Object.assign({}, base), { status: 'SUBMITTED' }),
            }),
            this.prisma.changeRequest.count({
                where: Object.assign(Object.assign({}, base), { status: 'UNDER_REVIEW' }),
            }),
            this.prisma.changeRequest.count({
                where: Object.assign(Object.assign({}, base), { status: 'APPROVED' }),
            }),
            this.prisma.changeRequest.count({
                where: Object.assign(Object.assign({}, base), { status: 'REJECTED' }),
            }),
            this.prisma.changeRequest.count({ where: myBase }),
            this.prisma.changeRequest.count({
                where: Object.assign(Object.assign({}, base), { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } }),
            }),
        ]);
        return {
            total,
            draft,
            submitted,
            underReview,
            approved,
            rejected,
            myTotal,
            pendingApproval,
        };
    }
    includeRelations() {
        return {
            company: { select: { id: true, name: true, code: true } },
            requestedBy: {
                select: { id: true, firstName: true, lastName: true, role: true },
            },
            reviewedBy: {
                select: { id: true, firstName: true, lastName: true, role: true },
            },
        };
    }
};
exports.ChangeRequestsService = ChangeRequestsService;
exports.ChangeRequestsService = ChangeRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        settings_service_1.SettingsService])
], ChangeRequestsService);
//# sourceMappingURL=change-requests.service.js.map