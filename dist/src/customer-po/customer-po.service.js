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
exports.CustomerPoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let CustomerPoService = class CustomerPoService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.customerPo.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `CPO-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async generateTaskNumber(companyId) {
        const count = await this.prisma.task.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `TSK-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    calcItem(item) {
        var _a;
        const qty = item.qty || 0;
        const unitPrice = item.unitPrice || 0;
        const discount = item.discount || 0;
        const gstRate = (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18;
        const gross = qty * unitPrice;
        const discAmt = Math.round(gross * discount / 100 * 100) / 100;
        const taxableAmt = Math.round((gross - discAmt) * 100) / 100;
        const gstAmount = Math.round(taxableAmt * gstRate / 100 * 100) / 100;
        const totalAmount = Math.round((taxableAmt + gstAmount) * 100) / 100;
        return { taxableAmt, gstAmount, totalAmount, pendingQty: qty };
    }
    includes() {
        return {
            items: true,
            quotation: { select: { quotationNumber: true, revision: true, totalAmount: true } },
        };
    }
    async create(dto, user) {
        if (dto.quotationId) {
            const qt = await this.prisma.quotation.findFirst({ where: { id: dto.quotationId, companyId: user.companyId } });
            if (!qt)
                throw new common_1.NotFoundException('Quotation not found');
            if (qt.status !== 'ACCEPTED')
                throw new common_1.BadRequestException('Quotation must be ACCEPTED to create CPO');
        }
        const cpoNumber = await this.generateNumber(user.companyId);
        const customerPoNumber = dto.poType === 'VERBAL'
            ? `VERBAL-${cpoNumber}`
            : dto.customerPoNumber;
        if (dto.poType === 'WRITTEN' && !dto.customerPoNumber) {
            throw new common_1.BadRequestException('customerPoNumber is required for WRITTEN orders');
        }
        if (dto.poType === 'VERBAL' && !dto.verbalConfirmedBy) {
            throw new common_1.BadRequestException('verbalConfirmedBy is required for VERBAL orders');
        }
        const calcItems = dto.items.map(item => {
            var _a;
            return (Object.assign(Object.assign({ itemCode: item.itemCode, itemName: item.itemName, description: item.description, qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice, discount: item.discount || 0, gstRate: (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18 }, this.calcItem(item)), { createdBy: user.id, updatedBy: user.id }));
        });
        const subtotal = calcItems.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
        const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
        const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);
        const cpo = await this.prisma.customerPo.create({
            data: {
                cpoNumber,
                customerPoNumber,
                poType: dto.poType,
                verbalConfirmedBy: dto.poType === 'VERBAL' ? dto.verbalConfirmedBy : null,
                verbalConfirmedDate: dto.poType === 'VERBAL' && dto.verbalConfirmedDate ? new Date(dto.verbalConfirmedDate) : null,
                quotationId: dto.quotationId,
                customerName: dto.customerName, customerEmail: dto.customerEmail,
                customerPhone: dto.customerPhone, deliveryAddress: dto.deliveryAddress,
                poDate: new Date(dto.poDate), deliveryDate: new Date(dto.deliveryDate),
                currency: dto.currency || 'INR', remarks: dto.remarks,
                subtotal: Math.round(subtotal * 100) / 100,
                totalGst: Math.round(totalGst * 100) / 100,
                totalAmount: Math.round(totalAmount * 100) / 100,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                items: { create: calcItems },
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customer_pos', recordId: cpo.id, action: 'CREATE', newValues: cpo, changedBy: user.id });
        try {
            await this.runShortageCheck(cpo.id, user);
        }
        catch (e) {
        }
        return cpo;
    }
    async acknowledge(id, user) {
        const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId } });
        if (!cpo)
            throw new common_1.NotFoundException('CPO not found');
        if (cpo.status !== 'RECEIVED')
            throw new common_1.BadRequestException('Only RECEIVED CPOs can be acknowledged');
        const updated = await this.prisma.customerPo.update({
            where: { id },
            data: { status: 'ACKNOWLEDGED', acknowledgedDate: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async update(id, dto, user) {
        const existing = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId } });
        if (!existing)
            throw new common_1.NotFoundException('CPO not found');
        if (existing.status !== 'RECEIVED') {
            throw new common_1.BadRequestException(`Cannot edit a CPO once it is ${existing.status}. Cancel and create a new one instead.`);
        }
        const customerPoNumber = dto.poType === 'VERBAL'
            ? existing.customerPoNumber.startsWith('VERBAL-') ? existing.customerPoNumber : `VERBAL-${existing.cpoNumber}`
            : dto.customerPoNumber;
        if (dto.poType === 'WRITTEN' && !dto.customerPoNumber) {
            throw new common_1.BadRequestException('customerPoNumber is required for WRITTEN orders');
        }
        if (dto.poType === 'VERBAL' && !dto.verbalConfirmedBy) {
            throw new common_1.BadRequestException('verbalConfirmedBy is required for VERBAL orders');
        }
        const calcItems = dto.items.map(item => {
            var _a;
            return (Object.assign(Object.assign({ itemCode: item.itemCode, itemName: item.itemName, description: item.description, qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice, discount: item.discount || 0, gstRate: (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18 }, this.calcItem(item)), { createdBy: user.id, updatedBy: user.id }));
        });
        const subtotal = calcItems.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
        const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
        const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);
        await this.prisma.customerPoItem.deleteMany({ where: { cpoId: id } });
        const updated = await this.prisma.customerPo.update({
            where: { id },
            data: {
                customerPoNumber,
                poType: dto.poType,
                verbalConfirmedBy: dto.poType === 'VERBAL' ? dto.verbalConfirmedBy : null,
                verbalConfirmedDate: dto.poType === 'VERBAL' && dto.verbalConfirmedDate ? new Date(dto.verbalConfirmedDate) : null,
                quotationId: dto.quotationId,
                customerName: dto.customerName, customerEmail: dto.customerEmail,
                customerPhone: dto.customerPhone, deliveryAddress: dto.deliveryAddress,
                poDate: new Date(dto.poDate), deliveryDate: new Date(dto.deliveryDate),
                currency: dto.currency || 'INR', remarks: dto.remarks,
                subtotal: Math.round(subtotal * 100) / 100,
                totalGst: Math.round(totalGst * 100) / 100,
                totalAmount: Math.round(totalAmount * 100) / 100,
                updatedBy: user.id,
                items: { create: calcItems },
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        try {
            await this.runShortageCheck(id, user);
        }
        catch (e) {
        }
        return updated;
    }
    async cancel(id, dto, user) {
        const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId } });
        if (!cpo)
            throw new common_1.NotFoundException('CPO not found');
        if (['COMPLETED', 'CANCELLED'].includes(cpo.status))
            throw new common_1.BadRequestException(`Cannot cancel ${cpo.status} CPO`);
        const updated = await this.prisma.customerPo.update({
            where: { id },
            data: { status: 'CANCELLED', cancelledDate: new Date(), cancelReason: dto.cancelReason, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, poType } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId };
        if (search)
            where.OR = [
                { cpoNumber: { contains: search, mode: 'insensitive' } },
                { customerPoNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (poType)
            where.poType = poType;
        const [data, total] = await Promise.all([
            this.prisma.customerPo.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { items: { select: { id: true, itemCode: true, qty: true, deliveredQty: true, pendingQty: true } }, quotation: { select: { quotationNumber: true } } },
            }),
            this.prisma.customerPo.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!cpo)
            throw new common_1.NotFoundException('CPO not found');
        return cpo;
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, received, acknowledged, inProgress, completed, cancelled, written, verbal] = await Promise.all([
            this.prisma.customerPo.count({ where }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { status: 'RECEIVED' }) }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { status: 'ACKNOWLEDGED' }) }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { status: 'IN_PROGRESS' }) }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }) }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { poType: 'WRITTEN' }) }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { poType: 'VERBAL' }) }),
        ]);
        const valueAgg = await this.prisma.customerPo.aggregate({
            where: Object.assign(Object.assign({}, where), { status: { notIn: ['CANCELLED'] } }), _sum: { totalAmount: true },
        });
        const overdueCount = await this.prisma.customerPo.count({
            where: Object.assign(Object.assign({}, where), { status: { in: ['ACKNOWLEDGED', 'IN_PROGRESS'] }, deliveryDate: { lt: new Date() } }),
        });
        return { total, received, acknowledged, inProgress, completed, cancelled, written, verbal, overdueCount, totalOrderValue: valueAgg._sum.totalAmount || 0 };
    }
    async runShortageCheck(cpoId, user) {
        const companyId = user.companyId;
        const cpo = await this.prisma.customerPo.findFirst({
            where: { id: cpoId, companyId },
            include: { items: { where: { isActive: true } } },
        });
        if (!cpo)
            throw new common_1.NotFoundException('CPO not found');
        if (['CANCELLED'].includes(cpo.status)) {
            throw new common_1.BadRequestException('Cannot run shortage check on a cancelled CPO');
        }
        await this.prisma.materialShortage.deleteMany({
            where: { companyId, customerPoId: cpoId, status: 'OPEN' },
        });
        const shortageRows = [];
        const itemResults = [];
        const bomTasksCreated = [];
        let hasShortage = false;
        for (const cpoItem of cpo.items) {
            const product = await this.prisma.product.findFirst({
                where: { companyId, code: cpoItem.itemCode },
            });
            if (product) {
                const bom = await this.prisma.bom.findFirst({
                    where: { companyId, productId: product.id, status: 'APPROVED' },
                    include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } },
                    orderBy: { effectiveFrom: 'desc' },
                });
                if (!bom) {
                    const taskNumber = await this.generateTaskNumber(companyId);
                    const task = await this.prisma.task.create({
                        data: {
                            companyId,
                            taskNumber,
                            title: `Create BOM for product ${cpoItem.itemCode} (${cpoItem.itemName})`,
                            description: `Customer PO ${cpo.cpoNumber} ordered "${cpoItem.itemName}" (${cpoItem.qty} ${cpoItem.uom}) but no approved BOM exists for this product. A BOM must be created before a material shortage check can be run for this item.`,
                            assignedTo: user.id,
                            assignedBy: user.id,
                            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                            priority: 'HIGH',
                            category: 'BOM_CREATION',
                            referenceType: 'CustomerPo',
                            referenceId: cpoId,
                            referenceNumber: cpo.cpoNumber,
                            createdBy: user.id,
                            updatedBy: user.id,
                        },
                    });
                    bomTasksCreated.push(task.taskNumber);
                    itemResults.push({
                        itemCode: cpoItem.itemCode, itemName: cpoItem.itemName,
                        status: 'BOM_MISSING',
                        message: `No approved BOM found. Task ${task.taskNumber} created to request BOM creation.`,
                        taskNumber: task.taskNumber,
                    });
                    continue;
                }
                const componentResults = [];
                for (const bomItem of bom.items) {
                    const grossQty = bomItem.effectiveQty * cpoItem.qty;
                    const wasteQty = (bomItem.wastagePercent || 0) / 100 * grossQty;
                    const netRequired = grossQty + wasteQty;
                    const balance = await this.prisma.stockBalance.findFirst({
                        where: { companyId, itemCode: bomItem.itemCode },
                    });
                    const availableQty = (balance === null || balance === void 0 ? void 0 : balance.availableQty) || 0;
                    const shortage = Math.max(0, netRequired - availableQty);
                    if (shortage > 0) {
                        hasShortage = true;
                        shortageRows.push({
                            companyId,
                            customerPoId: cpoId,
                            rawMaterialId: bomItem.rawMaterialId || null,
                            itemCode: bomItem.itemCode,
                            itemName: bomItem.itemName,
                            requiredQty: Math.round(netRequired * 1000) / 1000,
                            availableQty,
                            shortageQty: Math.round(shortage * 1000) / 1000,
                            uom: bomItem.uom,
                            status: 'OPEN',
                            createdBy: user.id,
                            updatedBy: user.id,
                        });
                    }
                    componentResults.push({
                        itemCode: bomItem.itemCode, itemName: bomItem.itemName, uom: bomItem.uom,
                        netRequired: Math.round(netRequired * 1000) / 1000,
                        availableQty,
                        shortage: Math.round(shortage * 1000) / 1000,
                        status: shortage > 0 ? 'SHORTAGE' : 'AVAILABLE',
                    });
                }
                itemResults.push({
                    itemCode: cpoItem.itemCode, itemName: cpoItem.itemName,
                    status: 'CHECKED', bomNumber: bom.bomNumber, components: componentResults,
                });
                continue;
            }
            const rawMaterial = await this.prisma.rawMaterial.findFirst({
                where: { companyId, code: cpoItem.itemCode },
            });
            if (rawMaterial) {
                const balance = await this.prisma.stockBalance.findFirst({
                    where: { companyId, itemCode: cpoItem.itemCode },
                });
                const availableQty = (balance === null || balance === void 0 ? void 0 : balance.availableQty) || 0;
                const shortage = Math.max(0, cpoItem.qty - availableQty);
                if (shortage > 0) {
                    hasShortage = true;
                    shortageRows.push({
                        companyId,
                        customerPoId: cpoId,
                        rawMaterialId: rawMaterial.id,
                        itemCode: cpoItem.itemCode,
                        itemName: cpoItem.itemName,
                        requiredQty: cpoItem.qty,
                        availableQty,
                        shortageQty: Math.round(shortage * 1000) / 1000,
                        uom: cpoItem.uom,
                        status: 'OPEN',
                        createdBy: user.id,
                        updatedBy: user.id,
                    });
                }
                itemResults.push({
                    itemCode: cpoItem.itemCode, itemName: cpoItem.itemName,
                    status: 'CHECKED_DIRECT_STOCK',
                    message: 'Item is a raw material sold directly - checked store stock, no BOM applicable.',
                    availableQty, requiredQty: cpoItem.qty, shortage: Math.round(shortage * 1000) / 1000,
                });
                continue;
            }
            itemResults.push({
                itemCode: cpoItem.itemCode, itemName: cpoItem.itemName,
                status: 'NO_PRODUCT_MASTER',
                message: 'No matching Product or Raw Material master found for this item code.',
            });
        }
        if (shortageRows.length > 0) {
            await this.prisma.materialShortage.createMany({ data: shortageRows });
        }
        const updated = await this.prisma.customerPo.update({
            where: { id: cpoId },
            data: {
                mrpRunAt: new Date(),
                mrpRunBy: user.id,
                lastShortageCheckResult: itemResults,
                updatedBy: user.id,
            },
        });
        await this.audit.log({
            tableName: 'customer_pos', recordId: cpoId, action: 'UPDATE',
            newValues: { mrpRunAt: updated.mrpRunAt, shortageCount: shortageRows.length, bomTasksCreated },
            changedBy: user.id,
        });
        return {
            cpoNumber: cpo.cpoNumber,
            itemResults,
            summary: {
                totalItems: cpo.items.length,
                itemsChecked: itemResults.filter(i => i.status === 'CHECKED' || i.status === 'CHECKED_DIRECT_STOCK').length,
                itemsMissingBom: itemResults.filter(i => i.status === 'BOM_MISSING').length,
                itemsMissingProduct: itemResults.filter(i => i.status === 'NO_PRODUCT_MASTER').length,
                shortageCount: shortageRows.length,
                bomTasksCreated,
                hasShortage,
                canFulfillFromStock: !hasShortage,
            },
        };
    }
    async getShortages(cpoId, user) {
        const cpo = await this.prisma.customerPo.findFirst({ where: { id: cpoId, companyId: user.companyId } });
        if (!cpo)
            throw new common_1.NotFoundException('CPO not found');
        const shortages = await this.prisma.materialShortage.findMany({
            where: { companyId: user.companyId, customerPoId: cpoId },
            orderBy: { createdAt: 'desc' },
        });
        return {
            cpoNumber: cpo.cpoNumber,
            mrpRunAt: cpo.mrpRunAt,
            mrpRunBy: cpo.mrpRunBy,
            itemResults: cpo.lastShortageCheckResult || null,
            data: shortages,
            openCount: shortages.filter(s => s.status === 'OPEN').length,
        };
    }
};
exports.CustomerPoService = CustomerPoService;
exports.CustomerPoService = CustomerPoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], CustomerPoService);
//# sourceMappingURL=customer-po.service.js.map