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
exports.DeleteRequestService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const workflows_service_1 = require("../workflows/workflows.service");
const roles_constant_1 = require("../common/constants/roles.constant");
const schema_columns_util_1 = require("../common/utils/schema-columns.util");
const UPDATED_BY_COLUMN = (0, schema_columns_util_1.buildColumnMap)('updatedBy');
const UPDATED_AT_COLUMN = (0, schema_columns_util_1.buildColumnMap)('updatedAt');
const LABEL_FIELD_PRIORITY = [
    'name', 'code', 'title', 'label', 'woNumber', 'poNumber', 'soNumber',
    'cpoNumber', 'bomNumber', 'invoiceNumber', 'employeeCode', 'email', 'firstName',
];
let DeleteRequestService = class DeleteRequestService {
    constructor(prisma, audit, workflows) {
        this.prisma = prisma;
        this.audit = audit;
        this.workflows = workflows;
    }
    validateTable(tableName) {
        if (!schema_columns_util_1.ALL_TABLE_NAMES.has(tableName))
            throw new common_1.BadRequestException(`Unknown table: ${tableName}`);
        if (!schema_columns_util_1.HAS_IS_ACTIVE.has(tableName))
            throw new common_1.BadRequestException(`${tableName} does not support soft delete`);
    }
    async fetchRecordAndLabel(tableName, recordId, companyId) {
        const scoped = schema_columns_util_1.HAS_COMPANY_ID.has(tableName);
        const compCol = schema_columns_util_1.COMPANY_ID_COLUMN.get(tableName) || 'companyId';
        const activeCol = schema_columns_util_1.IS_ACTIVE_COLUMN.get(tableName) || 'isActive';
        const sql = scoped
            ? `SELECT * FROM "${tableName}" WHERE "id" = $1 AND "${compCol}" = $2`
            : `SELECT * FROM "${tableName}" WHERE "id" = $1`;
        const rows = scoped
            ? await this.prisma.$queryRawUnsafe(sql, recordId, companyId)
            : await this.prisma.$queryRawUnsafe(sql, recordId);
        const record = rows[0];
        if (!record)
            throw new common_1.NotFoundException('Record not found');
        if (record[activeCol] === false)
            throw new common_1.BadRequestException('This record is already inactive');
        let label = '';
        for (const field of LABEL_FIELD_PRIORITY) {
            if (record[field]) {
                label = String(record[field]);
                break;
            }
        }
        if (!label)
            label = `${tableName} ${String(recordId).slice(0, 8)}`;
        return { record, label, activeCol, compCol, scoped };
    }
    async deactivate(tableName, recordId, activeCol, userId) {
        const updatedByCol = UPDATED_BY_COLUMN.get(tableName);
        const updatedAtCol = UPDATED_AT_COLUMN.get(tableName);
        const setClauses = [`"${activeCol}" = false`];
        const params = [recordId];
        if (updatedAtCol)
            setClauses.push(`"${updatedAtCol}" = now()`);
        if (updatedByCol) {
            params.push(userId);
            setClauses.push(`"${updatedByCol}" = $${params.length}`);
        }
        const sql = `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE "id" = $1`;
        await this.prisma.$executeRawUnsafe(sql, ...params);
    }
    async create(tableName, recordId, reason, user) {
        this.validateTable(tableName);
        const { label, activeCol } = await this.fetchRecordAndLabel(tableName, recordId, user.companyId);
        const skipApproval = roles_constant_1.STAGE_BYPASS_ROLES.includes(user.role) || user.isTestUser === true;
        if (skipApproval) {
            await this.deactivate(tableName, recordId, activeCol, user.id);
            const dr = await this.prisma.deleteRequest.create({
                data: {
                    companyId: user.companyId, tableName, recordId, recordLabel: label, reason,
                    status: 'AUTO_EXECUTED', requestedBy: user.id, decidedBy: user.id, decidedAt: new Date(),
                    createdBy: user.id, updatedBy: user.id,
                },
            });
            await this.audit.log({
                tableName, recordId, action: 'DELETE',
                newValues: { isActive: false }, changedBy: user.id, reason,
            });
            return Object.assign(Object.assign({}, dr), { pendingApproval: false });
        }
        const dr = await this.prisma.deleteRequest.create({
            data: {
                companyId: user.companyId, tableName, recordId, recordLabel: label, reason,
                status: 'PENDING', requestedBy: user.id,
                createdBy: user.id, updatedBy: user.id,
            },
        });
        const { request } = await this.workflows.submit({
            documentType: 'DELETE_REQUEST', documentId: dr.id, documentNumber: label,
            remarks: `Delete request for ${tableName} "${label}": ${reason}`,
        }, user);
        const updated = await this.prisma.deleteRequest.update({
            where: { id: dr.id }, data: { approvalRequestId: request === null || request === void 0 ? void 0 : request.id },
        });
        return Object.assign(Object.assign({}, updated), { pendingApproval: true, message: 'Submitted for approval - the record is still active until approved' });
    }
    async approve(id, user) {
        const dr = await this.prisma.deleteRequest.findFirst({ where: { id, companyId: user.companyId } });
        if (!dr)
            throw new common_1.NotFoundException('Delete request not found');
        if (dr.status !== 'PENDING')
            throw new common_1.BadRequestException(`Request is already ${dr.status}`);
        if (!dr.approvalRequestId)
            throw new common_1.BadRequestException('This request has no linked approval - cannot approve');
        const result = await this.workflows.act(dr.approvalRequestId, { action: 'APPROVED' }, user);
        if (result.status === 'APPROVED') {
            const activeCol = schema_columns_util_1.IS_ACTIVE_COLUMN.get(dr.tableName) || 'isActive';
            await this.deactivate(dr.tableName, dr.recordId, activeCol, user.id);
            await this.audit.log({
                tableName: dr.tableName, recordId: dr.recordId, action: 'DELETE',
                newValues: { isActive: false }, changedBy: user.id, reason: dr.reason,
            });
            return this.prisma.deleteRequest.update({
                where: { id }, data: { status: 'APPROVED', decidedBy: user.id, decidedAt: new Date(), updatedBy: user.id },
            });
        }
        return dr;
    }
    async reject(id, user, comments) {
        const dr = await this.prisma.deleteRequest.findFirst({ where: { id, companyId: user.companyId } });
        if (!dr)
            throw new common_1.NotFoundException('Delete request not found');
        if (dr.status !== 'PENDING')
            throw new common_1.BadRequestException(`Request is already ${dr.status}`);
        if (!dr.approvalRequestId)
            throw new common_1.BadRequestException('This request has no linked approval - cannot reject');
        await this.workflows.act(dr.approvalRequestId, { action: 'REJECTED', comments }, user);
        return this.prisma.deleteRequest.update({
            where: { id }, data: { status: 'REJECTED', decidedBy: user.id, decidedAt: new Date(), updatedBy: user.id },
        });
    }
    async attachRequesterNames(requests) {
        const userIds = [...new Set(requests.map((r) => r.requestedBy))];
        if (userIds.length === 0)
            return requests;
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true },
        });
        const nameMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]));
        return requests.map((r) => (Object.assign(Object.assign({}, r), { requestedByName: nameMap.get(r.requestedBy) || 'Unknown' })));
    }
    async listPending(user) {
        const requests = await this.prisma.deleteRequest.findMany({
            where: { companyId: user.companyId, status: 'PENDING' },
            orderBy: { createdAt: 'asc' },
        });
        return this.attachRequesterNames(requests);
    }
    async listMine(user) {
        return this.prisma.deleteRequest.findMany({
            where: { companyId: user.companyId, requestedBy: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
};
exports.DeleteRequestService = DeleteRequestService;
exports.DeleteRequestService = DeleteRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        workflows_service_1.WorkflowsService])
], DeleteRequestService);
//# sourceMappingURL=delete-request.service.js.map