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
exports.IqcEscalationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const rejected_stock_service_1 = require("../rejected-stock/rejected-stock.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
const STAGE_ORDER = ['IQC', 'QUALITY_MANAGER', 'PLANT_HEAD', 'FINAL_AUTHORITY'];
function isAuthorizedForStage(stage, user) {
    const allRoles = user.allRoles || [user.role, ...(user.additionalRoles || [])];
    if (allRoles.includes('SUPER_ADMIN'))
        return true;
    switch (stage) {
        case 'IQC':
            return allRoles.some(r => ['QC_MANAGER', 'CORPORATE_ADMIN'].includes(r));
        case 'QUALITY_MANAGER':
            return allRoles.includes('QC_MANAGER');
        case 'PLANT_HEAD':
            return allRoles.includes('PLANT_HEAD');
        case 'FINAL_AUTHORITY':
            return allRoles.includes('FINAL_AUTHORITY');
        default:
            return false;
    }
}
const VENDOR_PICKUP_DAYS = 21;
let IqcEscalationService = class IqcEscalationService {
    constructor(prisma, audit, notifications, rejectedStock, stockLedger) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
        this.rejectedStock = rejectedStock;
        this.stockLedger = stockLedger;
    }
    async createTemplate(dto, user) {
        const existingCurrent = await this.prisma.iqcCheckTemplate.findFirst({
            where: { companyId: user.companyId, name: dto.name, isActive: true, isCurrent: true },
        });
        if (existingCurrent) {
            throw new common_1.BadRequestException(`A template named "${dto.name}" already exists (version ${existingCurrent.version}). Edit it instead to create a new version.`);
        }
        const template = await this.prisma.iqcCheckTemplate.create({
            data: {
                companyId: user.companyId,
                rawMaterialId: dto.rawMaterialId,
                name: dto.name,
                docCode: dto.docCode,
                revision: dto.revision,
                version: 1,
                isCurrent: true,
                createdBy: user.id, updatedBy: user.id,
                parameters: {
                    create: dto.parameters.map((p, idx) => {
                        var _a;
                        return ({
                            companyId: user.companyId,
                            sNo: p.sNo,
                            category: p.category,
                            parameterName: p.parameterName,
                            specification: p.specification,
                            sortOrder: (_a = p.sortOrder) !== null && _a !== void 0 ? _a : idx,
                            createdBy: user.id, updatedBy: user.id,
                        });
                    }),
                },
            },
            include: { parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        });
        await this.audit.log({ tableName: 'iqc_check_templates', recordId: template.id, action: 'CREATE', newValues: template, changedBy: user.id });
        return template;
    }
    async findAllTemplates(user, query) {
        const { search, rawMaterialId } = query;
        const where = { companyId: user.companyId, isActive: true, isCurrent: true };
        if (rawMaterialId)
            where.rawMaterialId = rawMaterialId;
        if (search)
            where.name = { contains: search, mode: 'insensitive' };
        return this.prisma.iqcCheckTemplate.findMany({
            where, orderBy: { name: 'asc' },
            include: { rawMaterial: { select: { code: true, name: true } }, _count: { select: { parameters: true } } },
        });
    }
    async findOneTemplate(id, user) {
        const template = await this.prisma.iqcCheckTemplate.findFirst({
            where: { id, companyId: user.companyId },
            include: { parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }, rawMaterial: { select: { code: true, name: true } } },
        });
        if (!template)
            throw new common_1.NotFoundException('Check template not found');
        return template;
    }
    async updateTemplate(id, dto, user) {
        var _a, _b, _c, _d, _e, _f, _g;
        const current = await this.findOneTemplate(id, user);
        if (!current.isCurrent) {
            throw new common_1.BadRequestException('This is a past version and cannot be edited directly - edit the current version instead.');
        }
        const newVersion = await this.prisma.iqcCheckTemplate.create({
            data: {
                companyId: user.companyId,
                rawMaterialId: (_a = current.rawMaterialId) !== null && _a !== void 0 ? _a : undefined,
                name: (_b = dto.name) !== null && _b !== void 0 ? _b : current.name,
                docCode: (_d = (_c = dto.docCode) !== null && _c !== void 0 ? _c : current.docCode) !== null && _d !== void 0 ? _d : undefined,
                revision: (_f = (_e = dto.revision) !== null && _e !== void 0 ? _e : current.revision) !== null && _f !== void 0 ? _f : undefined,
                version: current.version + 1,
                isCurrent: true,
                createdBy: user.id, updatedBy: user.id,
                parameters: {
                    create: ((_g = dto.parameters) !== null && _g !== void 0 ? _g : current.parameters.map(p => ({ sNo: p.sNo, category: p.category, parameterName: p.parameterName, specification: p.specification, sortOrder: p.sortOrder }))).map((p, idx) => {
                        var _a;
                        return ({
                            companyId: user.companyId,
                            sNo: p.sNo,
                            category: p.category,
                            parameterName: p.parameterName,
                            specification: p.specification,
                            sortOrder: (_a = p.sortOrder) !== null && _a !== void 0 ? _a : idx,
                            createdBy: user.id, updatedBy: user.id,
                        });
                    }),
                },
            },
            include: { parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        });
        await this.prisma.iqcCheckTemplate.update({ where: { id }, data: { isCurrent: false, updatedBy: user.id } });
        await this.audit.log({ tableName: 'iqc_check_templates', recordId: newVersion.id, action: 'CREATE', newValues: Object.assign(Object.assign({}, newVersion), { supersedes: id }), changedBy: user.id });
        return newVersion;
    }
    async cloneTemplate(id, newName, user) {
        var _a, _b;
        const source = await this.findOneTemplate(id, user);
        return this.createTemplate({
            name: newName,
            docCode: (_a = source.docCode) !== null && _a !== void 0 ? _a : undefined,
            revision: (_b = source.revision) !== null && _b !== void 0 ? _b : undefined,
            rawMaterialId: undefined,
            parameters: source.parameters.map(p => ({
                sNo: p.sNo, category: p.category, parameterName: p.parameterName,
                specification: p.specification, sortOrder: p.sortOrder,
            })),
        }, user);
    }
    itemIncludes() {
        return {
            template: { include: { parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } } },
            stageResults: {
                where: { isActive: true },
                orderBy: { reviewedAt: 'asc' },
                include: { parameterResults: { include: { parameter: true } } },
            },
            iqc: {
                select: {
                    iqcNumber: true, inspectionDate: true,
                    grn: { select: { grnNumber: true, warehouseId: true, po: { select: { vendor: { select: { name: true } } } } } },
                },
            },
        };
    }
    async attachTemplate(itemId, dto, user) {
        const item = await this.prisma.iqcItem.findFirst({ where: { id: itemId, companyId: user.companyId } });
        if (!item)
            throw new common_1.NotFoundException('IQC item not found');
        await this.findOneTemplate(dto.templateId, user);
        const updated = await this.prisma.iqcItem.update({
            where: { id: itemId },
            data: { templateId: dto.templateId, sampleSize: dto.sampleSize, updatedBy: user.id },
            include: this.itemIncludes(),
        });
        await this.audit.log({ tableName: 'iqc_items', recordId: itemId, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async getItemEscalationDetail(itemId, user) {
        const item = await this.prisma.iqcItem.findFirst({
            where: { id: itemId, companyId: user.companyId },
            include: this.itemIncludes(),
        });
        if (!item)
            throw new common_1.NotFoundException('IQC item not found');
        return item;
    }
    async submitStageResult(itemId, dto, user) {
        if (dto.outcome !== 'PASS' && dto.outcome !== 'FAIL') {
            throw new common_1.BadRequestException('outcome must be PASS or FAIL');
        }
        if (!dto.remarks || !dto.remarks.trim()) {
            throw new common_1.BadRequestException('A remark explaining this decision is required');
        }
        const item = await this.getItemEscalationDetail(itemId, user);
        if (item.currentStage === 'CLOSED')
            throw new common_1.BadRequestException('This item is already closed');
        if (!isAuthorizedForStage(item.currentStage, user)) {
            throw new common_1.ForbiddenException(`You are not authorized to record a decision at the ${item.currentStage} stage`);
        }
        const stageResult = await this.prisma.iqcStageResult.create({
            data: {
                companyId: user.companyId,
                iqcItemId: itemId,
                stage: item.currentStage,
                outcome: dto.outcome,
                remarks: dto.remarks,
                reviewedBy: user.id,
                createdBy: user.id, updatedBy: user.id,
                parameterResults: dto.parameterResults ? {
                    create: dto.parameterResults.map(pr => ({
                        companyId: user.companyId,
                        parameterId: pr.parameterId,
                        s1: pr.s1, s2: pr.s2, s3: pr.s3, s4: pr.s4, s5: pr.s5,
                        remark: pr.remark,
                        createdBy: user.id, updatedBy: user.id,
                    })),
                } : undefined,
            },
            include: { parameterResults: true },
        });
        if (dto.outcome === 'PASS') {
            await this.closeAsPass(itemId, user);
        }
        else {
            const currentIdx = STAGE_ORDER.indexOf(item.currentStage);
            const isTerminal = currentIdx === STAGE_ORDER.length - 1;
            if (isTerminal) {
                await this.closeAsFail(itemId, user);
            }
            else {
                const nextStage = STAGE_ORDER[currentIdx + 1];
                await this.prisma.iqcItem.update({ where: { id: itemId }, data: { currentStage: nextStage, updatedBy: user.id } });
                await this.notifyEscalation(itemId, nextStage, user);
            }
        }
        await this.audit.log({ tableName: 'iqc_stage_results', recordId: stageResult.id, action: 'CREATE', newValues: stageResult, changedBy: user.id });
        return this.getItemEscalationDetail(itemId, user);
    }
    async closeAsPass(itemId, user) {
        const item = await this.prisma.iqcItem.findFirst({ where: { id: itemId } });
        if (!item)
            return;
        await this.prisma.iqcItem.update({
            where: { id: itemId },
            data: {
                currentStage: 'CLOSED', finalOutcome: 'PASS',
                acceptedQty: item.acceptedQty === 0 && item.rejectedQty === 0 ? item.receivedQty : item.acceptedQty,
                updatedBy: user.id,
            },
        });
        await this.maybeCloseInspection(item.iqcId, user);
    }
    async closeAsFail(itemId, user) {
        const item = await this.prisma.iqcItem.findFirst({ where: { id: itemId } });
        if (!item)
            return;
        await this.prisma.iqcItem.update({
            where: { id: itemId },
            data: { currentStage: 'CLOSED', finalOutcome: 'FAIL', acceptedQty: 0, rejectedQty: item.receivedQty, updatedBy: user.id },
        });
        await this.maybeCloseInspection(item.iqcId, user);
    }
    async maybeCloseInspection(iqcId, user) {
        const iqc = await this.prisma.iqcInspection.findFirst({ where: { id: iqcId }, include: { items: { where: { isActive: true } } } });
        if (!iqc)
            return;
        const allClosed = iqc.items.every(i => i.currentStage === 'CLOSED');
        if (!allClosed)
            return;
        await this.prisma.iqcInspection.update({ where: { id: iqcId }, data: { status: 'APPROVED', updatedBy: user.id } });
        await this.stockLedger.receiveFromIqc(iqcId, user);
        const refreshed = await this.prisma.iqcInspection.findFirst({ where: { id: iqcId }, include: { items: { where: { isActive: true } } } });
        if (!refreshed)
            return;
        for (const item of refreshed.items) {
            await this.prisma.grnItem.update({
                where: { id: item.grnItemId },
                data: { acceptedQty: item.acceptedQty, rejectedQty: item.rejectedQty, updatedBy: user.id },
            });
        }
        const totalAccepted = refreshed.items.reduce((s, i) => s + i.acceptedQty, 0);
        const totalReceived = refreshed.items.reduce((s, i) => s + i.receivedQty, 0);
        const totalRejected = refreshed.items.reduce((s, i) => s + i.rejectedQty, 0);
        let grnStatus = 'ACCEPTED';
        if (totalRejected > 0 && totalAccepted > 0)
            grnStatus = 'PARTIALLY_ACCEPTED';
        else if (totalRejected === totalReceived)
            grnStatus = 'ACCEPTED';
        await this.prisma.grnHeader.update({ where: { id: refreshed.grnId }, data: { status: grnStatus, updatedBy: user.id } });
        if (totalRejected > 0) {
            const existing = await this.prisma.rejectedStock.findFirst({ where: { iqcId, companyId: user.companyId } });
            if (!existing) {
                const rejected = await this.rejectedStock.createFromIqc(iqcId, user);
                const deadline = new Date();
                deadline.setDate(deadline.getDate() + VENDOR_PICKUP_DAYS);
                await this.prisma.rejectedStockItem.updateMany({
                    where: { rejectedStockId: rejected.id },
                    data: { disposition: 'RTV', vendorPickupDeadline: deadline, vendorNotifiedAt: new Date(), updatedBy: user.id },
                });
                const targets = await this.prisma.user.findMany({
                    where: { companyId: user.companyId, isActive: true, role: { in: ['FINANCE_MANAGER', 'PURCHASE_MANAGER'] } },
                    select: { id: true },
                });
                if (targets.length > 0) {
                    await this.notifications.createBulk(targets.map(t => ({
                        userId: t.id,
                        type: 'QUALITY_ALERT',
                        title: `Material rejected — vendor return required`,
                        message: `${rejected.rejectionNumber} failed final IQC review and is dead stock pending vendor pickup within ${VENDOR_PICKUP_DAYS} days.`,
                        referenceType: 'REJECTED_STOCK', referenceId: rejected.id, referenceNumber: rejected.rejectionNumber,
                        priority: 'HIGH',
                    })), user.companyId, user.id);
                }
            }
        }
    }
    async notifyEscalation(itemId, nextStage, user) {
        const item = await this.prisma.iqcItem.findFirst({ where: { id: itemId }, include: { iqc: { select: { iqcNumber: true } } } });
        const roleForStage = {
            QUALITY_MANAGER: ['QC_MANAGER'],
            PLANT_HEAD: ['PLANT_HEAD'],
            FINAL_AUTHORITY: ['FINAL_AUTHORITY'],
        };
        const roles = roleForStage[nextStage] || [];
        const targets = await this.prisma.user.findMany({
            where: { companyId: user.companyId, isActive: true, OR: [{ role: { in: roles } }, { additionalRoles: { hasSome: roles } }, { role: 'SUPER_ADMIN' }] },
            select: { id: true },
        });
        if (targets.length === 0)
            return;
        await this.notifications.createBulk(targets.map(t => {
            var _a, _b;
            return ({
                userId: t.id,
                type: 'QUALITY_ALERT',
                title: `IQC escalated to ${nextStage.replace('_', ' ')}`,
                message: `${(_a = item === null || item === void 0 ? void 0 : item.iqc) === null || _a === void 0 ? void 0 : _a.iqcNumber} — ${item === null || item === void 0 ? void 0 : item.itemName} failed review and needs your decision.`,
                referenceType: 'IQC_ITEM', referenceId: itemId, referenceNumber: (_b = item === null || item === void 0 ? void 0 : item.iqc) === null || _b === void 0 ? void 0 : _b.iqcNumber,
                priority: 'HIGH',
            });
        }), user.companyId, user.id);
    }
};
exports.IqcEscalationService = IqcEscalationService;
exports.IqcEscalationService = IqcEscalationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        rejected_stock_service_1.RejectedStockService,
        stock_ledger_service_1.StockLedgerService])
], IqcEscalationService);
//# sourceMappingURL=iqc-escalation.service.js.map