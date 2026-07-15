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
const sales_orders_service_1 = require("../sales-orders/sales-orders.service");
let CustomerPoService = class CustomerPoService {
    constructor(prisma, audit, salesOrders) {
        this.prisma = prisma;
        this.audit = audit;
        this.salesOrders = salesOrders;
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
            amendmentOf: { select: { id: true, cpoNumber: true, customerPoNumber: true } },
            amendmentChildren: { select: { id: true, cpoNumber: true, status: true, totalAmount: true, createdAt: true } },
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
        const existing = await this.prisma.customerPo.findFirst({
            where: { id, companyId: user.companyId },
            include: { items: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('CPO not found');
        if (existing.status !== 'RECEIVED')
            throw new common_1.BadRequestException('Only RECEIVED CPOs can be acknowledged');
        const result = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.customerPo.update({
                where: { id },
                data: { status: 'ACKNOWLEDGED', acknowledgedDate: new Date(), updatedBy: user.id },
                include: this.includes(),
            });
            const so = await this.salesOrders.createFromCpo(updated, existing.items, user, tx);
            return { cpo: updated, salesOrder: so };
        });
        await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: result.cpo, changedBy: user.id });
        return result.cpo;
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
    async createQuantityIncrease(originalId, dto, user) {
        const original = await this.prisma.customerPo.findFirst({ where: { id: originalId, companyId: user.companyId } });
        if (!original)
            throw new common_1.NotFoundException('Original CPO not found');
        if (original.status === 'RECEIVED') {
            throw new common_1.BadRequestException('This PO has not been acknowledged yet - use Edit instead of Increase Quantity.');
        }
        if (original.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Cannot increase quantity on a cancelled PO.');
        }
        const note = `Quantity increase against PO ${original.cpoNumber} (Customer PO: ${original.customerPoNumber}).${dto.remarks ? ' ' + dto.remarks : ''}`;
        const createDto = {
            poType: dto.poType,
            customerPoNumber: dto.poType === 'WRITTEN' ? dto.customerPoNumber : undefined,
            verbalConfirmedBy: dto.poType === 'VERBAL' ? dto.verbalConfirmedBy : undefined,
            verbalConfirmedDate: dto.poType === 'VERBAL' ? dto.verbalConfirmedDate : undefined,
            quotationId: undefined,
            customerName: original.customerName,
            customerEmail: original.customerEmail || undefined,
            customerPhone: original.customerPhone || undefined,
            deliveryAddress: original.deliveryAddress || undefined,
            poDate: new Date().toISOString(),
            deliveryDate: dto.deliveryDate,
            currency: original.currency,
            remarks: note,
            items: dto.items,
        };
        const newCpo = await this.create(createDto, user);
        const linked = await this.prisma.customerPo.update({
            where: { id: newCpo.id },
            data: { amendmentOfId: original.id },
            include: this.includes(),
        });
        return linked;
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
        try {
            await this.recheckAllOpenPos(user.companyId, user.id);
        }
        catch (e) {
        }
        return updated;
    }
    async recheckAllOpenPos(companyId, triggeredByUserId) {
        const pseudoUser = { companyId, id: triggeredByUserId };
        const openCpos = await this.prisma.customerPo.findMany({
            where: { companyId, status: { in: ['RECEIVED', 'ACKNOWLEDGED', 'IN_PROGRESS'] } },
            select: { id: true },
        });
        const results = [];
        for (const cpo of openCpos) {
            try {
                await this.runShortageCheck(cpo.id, pseudoUser);
                results.push({ cpoId: cpo.id, ok: true });
            }
            catch (e) {
                results.push({ cpoId: cpo.id, ok: false, error: e === null || e === void 0 ? void 0 : e.message });
            }
        }
        return results;
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
    async getFinishedGoodDemand(companyId, cpo) {
        const demand = new Map();
        for (const cpoItem of cpo.items) {
            const product = await this.prisma.product.findFirst({ where: { companyId, code: cpoItem.itemCode } });
            if (!product)
                continue;
            const existing = demand.get(cpoItem.itemCode);
            if (existing)
                existing.requiredQty += cpoItem.qty;
            else
                demand.set(cpoItem.itemCode, { requiredQty: cpoItem.qty, uom: cpoItem.uom, itemName: cpoItem.itemName, productId: product.id });
        }
        return demand;
    }
    async getRawMaterialDemand(companyId, cpo, fgNetOverride) {
        const demand = new Map();
        for (const cpoItem of cpo.items) {
            const product = await this.prisma.product.findFirst({ where: { companyId, code: cpoItem.itemCode } });
            if (product) {
                const effectiveQty = (fgNetOverride === null || fgNetOverride === void 0 ? void 0 : fgNetOverride.has(cpoItem.itemCode)) ? fgNetOverride.get(cpoItem.itemCode) : cpoItem.qty;
                if (effectiveQty <= 0)
                    continue;
                const bom = await this.prisma.bom.findFirst({
                    where: { companyId, productId: product.id, status: 'APPROVED' },
                    include: { items: { where: { isActive: true } } },
                    orderBy: { effectiveFrom: 'desc' },
                });
                if (!bom)
                    continue;
                for (const bomItem of bom.items) {
                    const grossQty = bomItem.effectiveQty * effectiveQty;
                    const wasteQty = (bomItem.wastagePercent || 0) / 100 * grossQty;
                    const netRequired = grossQty + wasteQty;
                    const existing = demand.get(bomItem.itemCode);
                    if (existing)
                        existing.requiredQty += netRequired;
                    else
                        demand.set(bomItem.itemCode, { requiredQty: netRequired, uom: bomItem.uom, itemName: bomItem.itemName, rawMaterialId: bomItem.rawMaterialId || null });
                }
                continue;
            }
            const rawMaterial = await this.prisma.rawMaterial.findFirst({ where: { companyId, code: cpoItem.itemCode } });
            if (rawMaterial) {
                const existing = demand.get(cpoItem.itemCode);
                if (existing)
                    existing.requiredQty += cpoItem.qty;
                else
                    demand.set(cpoItem.itemCode, { requiredQty: cpoItem.qty, uom: cpoItem.uom, itemName: cpoItem.itemName, rawMaterialId: rawMaterial.id });
            }
        }
        return demand;
    }
    async runShortageCheck(cpoId, user) {
        var _a, _b;
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
        const openCpos = await this.prisma.customerPo.findMany({
            where: { companyId, status: { in: ['RECEIVED', 'ACKNOWLEDGED', 'IN_PROGRESS'] } },
            include: { items: { where: { isActive: true } } },
            orderBy: { createdAt: 'asc' },
        });
        const fgDemandQueue = new Map();
        for (const otherCpo of openCpos) {
            const fgDemand = await this.getFinishedGoodDemand(companyId, otherCpo);
            for (const [itemCode, info] of fgDemand.entries()) {
                if (!fgDemandQueue.has(itemCode))
                    fgDemandQueue.set(itemCode, []);
                fgDemandQueue.get(itemCode).push({ cpoId: otherCpo.id, requiredQty: info.requiredQty });
            }
        }
        const fgAllocationByCpo = new Map();
        for (const [itemCode, queue] of fgDemandQueue.entries()) {
            const balance = await this.prisma.stockBalance.findFirst({ where: { companyId, itemCode } });
            let runningStock = (balance === null || balance === void 0 ? void 0 : balance.availableQty) || 0;
            const totalFgStock = runningStock;
            for (const entry of queue) {
                const allocated = Math.min(entry.requiredQty, Math.max(0, runningStock));
                runningStock -= allocated;
                if (!fgAllocationByCpo.has(entry.cpoId))
                    fgAllocationByCpo.set(entry.cpoId, new Map());
                fgAllocationByCpo.get(entry.cpoId).set(itemCode, {
                    fgAvailableQty: totalFgStock,
                    fgAllocatedQty: allocated,
                    netProductionQty: Math.max(0, entry.requiredQty - allocated),
                });
            }
        }
        const demandQueue = new Map();
        for (const otherCpo of openCpos) {
            const fgNetForThisCpo = fgAllocationByCpo.get(otherCpo.id);
            const fgNetOverride = fgNetForThisCpo
                ? new Map(Array.from(fgNetForThisCpo.entries()).map(([code, info]) => [code, info.netProductionQty]))
                : undefined;
            const demand = await this.getRawMaterialDemand(companyId, otherCpo, fgNetOverride);
            for (const [itemCode, info] of demand.entries()) {
                if (!demandQueue.has(itemCode))
                    demandQueue.set(itemCode, []);
                demandQueue.get(itemCode).push({ cpoId: otherCpo.id, requiredQty: info.requiredQty });
            }
        }
        const allocationForThisCpo = new Map();
        for (const [itemCode, queue] of demandQueue.entries()) {
            const balance = await this.prisma.stockBalance.findFirst({ where: { companyId, itemCode } });
            let runningStock = (balance === null || balance === void 0 ? void 0 : balance.availableQty) || 0;
            const totalStock = runningStock;
            for (const entry of queue) {
                const allocated = Math.min(entry.requiredQty, Math.max(0, runningStock));
                const shortage = Math.max(0, entry.requiredQty - allocated);
                runningStock -= allocated;
                if (entry.cpoId === cpoId) {
                    allocationForThisCpo.set(itemCode, {
                        netRequired: entry.requiredQty,
                        availableQty: totalStock,
                        shortage,
                    });
                }
            }
        }
        const fgAllocationForThisCpo = fgAllocationByCpo.get(cpoId) || new Map();
        const shortageRows = [];
        const itemResults = [];
        const bomTasksCreated = [];
        let hasShortage = false;
        for (const cpoItem of cpo.items) {
            const product = await this.prisma.product.findFirst({
                where: { companyId, code: cpoItem.itemCode },
            });
            if (product) {
                const fgAlloc = fgAllocationForThisCpo.get(cpoItem.itemCode);
                const fgAvailableQty = (_a = fgAlloc === null || fgAlloc === void 0 ? void 0 : fgAlloc.fgAvailableQty) !== null && _a !== void 0 ? _a : 0;
                const fgAllocatedQty = (_b = fgAlloc === null || fgAlloc === void 0 ? void 0 : fgAlloc.fgAllocatedQty) !== null && _b !== void 0 ? _b : 0;
                const netProductionQty = fgAlloc ? fgAlloc.netProductionQty : cpoItem.qty;
                if (netProductionQty <= 0) {
                    itemResults.push({
                        itemCode: cpoItem.itemCode, itemName: cpoItem.itemName,
                        status: 'AVAILABLE_FROM_FG_STOCK',
                        message: `Fully covered by existing finished goods stock (${fgAllocatedQty} ${cpoItem.uom} allocated). No production required.`,
                        requiredQty: cpoItem.qty,
                        fgAvailableQty, fgAllocatedQty,
                    });
                    continue;
                }
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
                            description: `Customer PO ${cpo.cpoNumber} ordered "${cpoItem.itemName}" (${cpoItem.qty} ${cpoItem.uom}) but no approved BOM exists for this product. A BOM must be created before a material shortage check can be run for this item.${fgAllocatedQty > 0 ? ` Note: ${fgAllocatedQty} ${cpoItem.uom} is already covered by existing finished goods stock; only the remaining ${netProductionQty} ${cpoItem.uom} needs production.` : ''}`,
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
                        fgAvailableQty, fgAllocatedQty, netProductionQty,
                    });
                    continue;
                }
                const componentResults = [];
                for (const bomItem of bom.items) {
                    const alloc = allocationForThisCpo.get(bomItem.itemCode);
                    const netRequired = alloc ? alloc.netRequired : (bomItem.effectiveQty * netProductionQty);
                    const availableQty = alloc ? alloc.availableQty : 0;
                    const shortage = alloc ? alloc.shortage : netRequired;
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
                    fgAvailableQty, fgAllocatedQty, netProductionQty,
                    message: fgAllocatedQty > 0 ? `${fgAllocatedQty} ${cpoItem.uom} covered by finished goods stock; ${netProductionQty} ${cpoItem.uom} requires production.` : undefined,
                });
                continue;
            }
            const rawMaterial = await this.prisma.rawMaterial.findFirst({
                where: { companyId, code: cpoItem.itemCode },
            });
            if (rawMaterial) {
                const alloc = allocationForThisCpo.get(cpoItem.itemCode);
                const availableQty = alloc ? alloc.availableQty : 0;
                const shortage = alloc ? alloc.shortage : cpoItem.qty;
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
                itemsAvailableFromFgStock: itemResults.filter(i => i.status === 'AVAILABLE_FROM_FG_STOCK').length,
                itemsMissingBom: itemResults.filter(i => i.status === 'BOM_MISSING').length,
                itemsMissingProduct: itemResults.filter(i => i.status === 'NO_PRODUCT_MASTER').length,
                shortageCount: shortageRows.length,
                bomTasksCreated,
                hasShortage,
                canFulfillFromStock: !hasShortage,
            },
        };
    }
    async getAllOpenShortages(user) {
        const companyId = user.companyId;
        const shortages = await this.prisma.materialShortage.findMany({
            where: { companyId, status: 'OPEN' },
            include: { customerPo: { select: { cpoNumber: true, customerName: true, deliveryDate: true } } },
            orderBy: { itemCode: 'asc' },
        });
        const grouped = new Map();
        for (const s of shortages) {
            if (!grouped.has(s.itemCode)) {
                grouped.set(s.itemCode, { itemCode: s.itemCode, itemName: s.itemName, uom: s.uom, totalShortageQty: 0, affectedOrders: [] });
            }
            const g = grouped.get(s.itemCode);
            g.totalShortageQty = Math.round((g.totalShortageQty + s.shortageQty) * 1000) / 1000;
            g.affectedOrders.push({
                shortageId: s.id,
                cpoNumber: s.customerPo.cpoNumber,
                customerName: s.customerPo.customerName,
                deliveryDate: s.customerPo.deliveryDate,
                shortageQty: s.shortageQty,
            });
        }
        const data = Array.from(grouped.values()).sort((a, b) => b.totalShortageQty - a.totalShortageQty);
        return {
            data,
            totalItemsShort: data.length,
            totalShortageRecords: shortages.length,
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, sales_orders_service_1.SalesOrdersService])
], CustomerPoService);
//# sourceMappingURL=customer-po.service.js.map