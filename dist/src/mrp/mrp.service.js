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
exports.MrpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const material_reservation_service_1 = require("../work-orders/material-reservation.service");
const routing_service_1 = require("../routing/routing.service");
const test_session_context_1 = require("../common/context/test-session.context");
let MrpService = class MrpService {
    constructor(prisma, audit, materialReservation, routingService) {
        this.prisma = prisma;
        this.audit = audit;
        this.materialReservation = materialReservation;
        this.routingService = routingService;
    }
    async findProducingBom(companyId, productId) {
        const master = await this.prisma.bom.findFirst({
            where: { companyId, productId, status: 'APPROVED', bomType: 'MASTER' },
            include: { items: { where: { isActive: true } } },
        });
        if (master)
            return master;
        const matchedStage = await this.prisma.routingStage.findFirst({
            where: { companyId, isActive: true, bom: { productId, status: 'APPROVED' } },
            include: { bom: { include: { items: { where: { isActive: true } } } }, routing: true },
        });
        if (matchedStage && matchedStage.routing.isActive)
            return matchedStage.bom;
        return null;
    }
    async discoverBomTree(companyId, rootItemCodes) {
        const lowLevelCode = new Map();
        const bomOf = new Map();
        const itemMeta = new Map();
        const discover = async (itemCode, depth, ancestors) => {
            var _a;
            lowLevelCode.set(itemCode, Math.max((_a = lowLevelCode.get(itemCode)) !== null && _a !== void 0 ? _a : -1, depth));
            if (ancestors.has(itemCode))
                return;
            let children = bomOf.get(itemCode);
            if (children === undefined) {
                const product = await this.prisma.product.findFirst({ where: { companyId, code: itemCode } });
                if (!product) {
                    bomOf.set(itemCode, null);
                    return;
                }
                itemMeta.set(itemCode, { itemName: product.name, uom: 'PCS' });
                const bom = await this.findProducingBom(companyId, product.id);
                if (!bom) {
                    bomOf.set(itemCode, null);
                    return;
                }
                children = bom.items.map(bi => ({
                    itemCode: bi.itemCode, itemName: bi.itemName, uom: bi.uom,
                    qtyPerUnit: bi.effectiveQty * (1 + (bi.wastagePercent || 0) / 100),
                }));
                bomOf.set(itemCode, children);
            }
            if (!children)
                return;
            const nextAncestors = new Set(ancestors);
            nextAncestors.add(itemCode);
            for (const c of children) {
                if (!itemMeta.has(c.itemCode))
                    itemMeta.set(c.itemCode, { itemName: c.itemName, uom: c.uom });
                await discover(c.itemCode, depth + 1, nextAncestors);
            }
        };
        for (const code of rootItemCodes)
            await discover(code, 0, new Set());
        const leavesOf = new Map();
        const collectLeaves = (itemCode, seen) => {
            if (seen.has(itemCode))
                return new Set();
            seen.add(itemCode);
            const children = bomOf.get(itemCode);
            if (!children)
                return new Set([itemCode]);
            const out = new Set();
            for (const c of children)
                for (const l of collectLeaves(c.itemCode, seen))
                    out.add(l);
            return out;
        };
        for (const code of rootItemCodes)
            leavesOf.set(code, collectLeaves(code, new Set()));
        return { lowLevelCode, bomOf, itemMeta, leavesOf };
    }
    async explodeMultiCpoMaterialNeeds(companyId, buckets, bucketOrder, warehouseId) {
        const rootItemCodes = Array.from(new Set(buckets.map(b => b.itemCode)));
        const { lowLevelCode, bomOf, itemMeta: discoveredMeta, leavesOf } = await this.discoverBomTree(companyId, rootItemCodes);
        const itemMeta = discoveredMeta;
        for (const b of buckets)
            itemMeta.set(b.itemCode, { itemName: b.itemName, uom: b.uom });
        let currentQueue = new Map();
        for (const b of buckets) {
            if (!currentQueue.has(b.itemCode))
                currentQueue.set(b.itemCode, new Map());
            const m = currentQueue.get(b.itemCode);
            m.set(b.bucketKey, (m.get(b.bucketKey) || 0) + b.qty);
        }
        const levelZero = new Map();
        const leafShortages = new Map();
        const maxLevel = Math.max(0, ...Array.from(lowLevelCode.values()));
        for (let level = 0; level <= maxLevel; level++) {
            const nextQueue = new Map();
            const itemsAtLevel = Array.from(lowLevelCode.entries()).filter(([, lvl]) => lvl === level).map(([code]) => code);
            for (const itemCode of itemsAtLevel) {
                const bucketQtyMap = currentQueue.get(itemCode);
                if (!bucketQtyMap || bucketQtyMap.size === 0)
                    continue;
                const children = bomOf.get(itemCode);
                const meta = itemMeta.get(itemCode) || { itemName: itemCode, uom: 'PCS' };
                const balance = warehouseId
                    ? await this.prisma.stockBalance.findUnique({ where: { companyId_itemCode_warehouseId: { companyId, itemCode, warehouseId } } })
                    : await this.prisma.stockBalance.findFirst({ where: { companyId, itemCode } });
                let onOrderQty = 0;
                if (!children) {
                    const testFlag = (0, test_session_context_1.isTestSessionActive)();
                    const onOrderItems = await this.prisma.purchaseOrderItem.findMany({
                        where: { companyId, itemCode, isTestData: testFlag, po: { status: { in: ['SENT', 'APPROVED', 'PARTIALLY_RECEIVED'] }, isTestData: testFlag } },
                        select: { pendingQty: true },
                    });
                    onOrderQty = onOrderItems.reduce((sum, i) => sum + (i.pendingQty || 0), 0);
                }
                let runningStock = ((balance === null || balance === void 0 ? void 0 : balance.availableQty) || 0) + onOrderQty;
                const totalStock = runningStock;
                for (const bucketKey of bucketOrder) {
                    const required = bucketQtyMap.get(bucketKey);
                    if (!required || required <= 0.0001)
                        continue;
                    const allocated = Math.min(required, Math.max(0, runningStock));
                    runningStock -= allocated;
                    const net = Math.max(0, required - allocated);
                    if (level === 0) {
                        if (!levelZero.has(bucketKey))
                            levelZero.set(bucketKey, new Map());
                        levelZero.get(bucketKey).set(itemCode, {
                            requiredQty: required, availableQty: totalStock, allocatedQty: allocated,
                            netQty: net, hasBom: !!children,
                        });
                    }
                    if (net <= 0.0001)
                        continue;
                    if (!children) {
                        const rawMaterial = await this.prisma.rawMaterial.findFirst({ where: { companyId, code: itemCode } });
                        if (!leafShortages.has(bucketKey))
                            leafShortages.set(bucketKey, []);
                        leafShortages.get(bucketKey).push({
                            itemCode, itemName: meta.itemName, uom: meta.uom,
                            netRequired: Math.round(required * 1000) / 1000,
                            availableQty: totalStock,
                            shortage: Math.round(net * 1000) / 1000,
                            rawMaterialId: (rawMaterial === null || rawMaterial === void 0 ? void 0 : rawMaterial.id) || null,
                        });
                        continue;
                    }
                    for (const c of children) {
                        if (!nextQueue.has(c.itemCode))
                            nextQueue.set(c.itemCode, new Map());
                        const nm = nextQueue.get(c.itemCode);
                        nm.set(bucketKey, (nm.get(bucketKey) || 0) + c.qtyPerUnit * net);
                    }
                }
            }
            currentQueue = nextQueue;
        }
        return { levelZero, leafShortages, leavesOf };
    }
    async explodeMaterialNeeds(companyId, warehouseId, rootDemands) {
        const SINGLE = 'SINGLE';
        const buckets = rootDemands.map(d => ({ bucketKey: SINGLE, itemCode: d.itemCode, itemName: d.itemName, uom: d.uom, qty: d.qty }));
        const { leafShortages } = await this.explodeMultiCpoMaterialNeeds(companyId, buckets, [SINGLE], warehouseId);
        return leafShortages.get(SINGLE) || [];
    }
    async calculateMrp(woId, user) {
        var _a;
        const companyId = user.companyId;
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: woId, companyId },
            include: { warehouse: { select: { name: true } } },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        if (!wo.bomId)
            throw new common_1.BadRequestException('Work order has no BOM linked');
        if (['COMPLETED', 'CANCELLED'].includes(wo.status)) {
            throw new common_1.BadRequestException('Cannot run MRP for completed/cancelled work order');
        }
        const bom = await this.prisma.bom.findFirst({
            where: { id: wo.bomId, companyId },
            include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } },
        });
        if (!bom)
            throw new common_1.NotFoundException('BOM not found');
        const requirements = [];
        let hasShortage = false;
        for (const item of bom.items) {
            const grossQty = item.effectiveQty * wo.plannedQty;
            const wasteQty = (item.wastagePercent || 0) / 100 * grossQty;
            const netRequired = grossQty + wasteQty;
            const balance = await this.prisma.stockBalance.findFirst({
                where: { companyId, itemCode: item.itemCode },
            });
            const availableQty = (balance === null || balance === void 0 ? void 0 : balance.availableQty) || 0;
            const batches = await this.prisma.stockBatch.findMany({
                where: { companyId, itemCode: item.itemCode, status: 'ACTIVE', availableQty: { gt: 0 } },
                orderBy: { receivedDate: 'asc' },
                select: { batchNumber: true, availableQty: true, expiryDate: true, receivedDate: true },
            });
            const shortage = Math.max(0, netRequired - availableQty);
            if (shortage > 0)
                hasShortage = true;
            requirements.push({
                sequence: item.sequence,
                itemCode: item.itemCode,
                itemName: item.itemName,
                uom: item.uom,
                itemType: item.itemType,
                qtyPer: item.quantity,
                wastagePercent: item.wastagePercent || 0,
                grossRequired: grossQty,
                netRequired: Math.round(netRequired * 1000) / 1000,
                availableQty,
                shortage: Math.round(shortage * 1000) / 1000,
                status: shortage > 0 ? 'SHORTAGE' : availableQty === 0 ? 'NO_STOCK' : 'AVAILABLE',
                batches: batches.slice(0, 5),
            });
        }
        return {
            workOrder: {
                id: wo.id, woNumber: wo.woNumber, productCode: wo.productCode,
                productName: wo.productName, plannedQty: wo.plannedQty,
                status: wo.status, warehouse: (_a = wo.warehouse) === null || _a === void 0 ? void 0 : _a.name,
            },
            bom: { bomNumber: bom.bomNumber, version: bom.version },
            requirements,
            summary: {
                totalComponents: requirements.length,
                availableComponents: requirements.filter(r => r.status === 'AVAILABLE').length,
                shortageComponents: requirements.filter(r => r.status === 'SHORTAGE').length,
                noStockComponents: requirements.filter(r => r.status === 'NO_STOCK').length,
                hasShortage,
                canProduce: !hasShortage,
            },
        };
    }
    async getShortageReport(user) {
        var _a;
        const companyId = user.companyId;
        const activeWOs = await this.prisma.workOrder.findMany({
            where: { companyId, status: { in: ['RELEASED', 'IN_PROGRESS'] }, bomId: { not: null } },
            include: { warehouse: { select: { name: true } } },
        });
        const report = [];
        for (const wo of activeWOs) {
            try {
                const mrp = await this.calculateMrp(wo.id, user);
                if (mrp.summary.hasShortage) {
                    report.push({
                        woNumber: wo.woNumber, productCode: wo.productCode,
                        productName: wo.productName, plannedQty: wo.plannedQty,
                        status: wo.status, warehouse: (_a = wo.warehouse) === null || _a === void 0 ? void 0 : _a.name,
                        shortageItems: mrp.requirements.filter(r => r.shortage > 0).map(r => ({
                            itemCode: r.itemCode, itemName: r.itemName, uom: r.uom,
                            required: r.netRequired, available: r.availableQty, shortage: r.shortage,
                        })),
                    });
                }
            }
            catch (e) { }
        }
        return { data: report, totalWOs: activeWOs.length, wosWithShortage: report.length };
    }
    async getMaterialPlan(user, query) {
        const companyId = user.companyId;
        const { status = 'RELEASED' } = query;
        const wos = await this.prisma.workOrder.findMany({
            where: { companyId, status: { in: status.split(',') }, bomId: { not: null } },
        });
        const aggregate = {};
        for (const wo of wos) {
            try {
                const mrp = await this.calculateMrp(wo.id, user);
                for (const req of mrp.requirements) {
                    const key = req.itemCode;
                    if (!aggregate[key]) {
                        aggregate[key] = {
                            itemCode: req.itemCode, itemName: req.itemName, uom: req.uom,
                            totalRequired: 0, totalAvailable: req.availableQty,
                            totalShortage: 0, woCount: 0,
                        };
                    }
                    aggregate[key].totalRequired += req.netRequired;
                    aggregate[key].totalShortage = Math.max(0, aggregate[key].totalRequired - aggregate[key].totalAvailable);
                    aggregate[key].woCount += 1;
                }
            }
            catch (e) { }
        }
        const data = Object.values(aggregate).sort((a, b) => b.totalShortage - a.totalShortage);
        return { data, totalWOs: wos.length, totalItems: data.length };
    }
    async getOpenSoLineItems(user, warehouseId) {
        const companyId = user.companyId;
        const testFlag = (0, test_session_context_1.isTestSessionActive)();
        const sos = await this.prisma.salesOrder.findMany({
            where: { companyId, status: { in: ['CONFIRMED', 'IN_PRODUCTION'] }, isTestData: testFlag },
            include: { items: { where: { isActive: true, pendingQty: { gt: 0 }, isTestData: testFlag } } },
            orderBy: { deliveryDate: 'asc' },
        });
        const flat = [];
        for (const so of sos) {
            for (const item of so.items) {
                const product = await this.prisma.product.findFirst({ where: { companyId, code: item.itemCode } });
                const bom = product ? await this.findProducingBom(companyId, product.id) : null;
                const alreadyPlanned = await this.prisma.workOrder.aggregate({
                    where: { companyId, salesOrderId: so.id, productCode: item.itemCode, status: { not: 'CANCELLED' }, isTestData: testFlag },
                    _sum: { plannedQty: true },
                });
                const remainingToPlan = Math.max(0, item.pendingQty - (alreadyPlanned._sum.plannedQty || 0));
                flat.push({
                    soId: so.id, soNumber: so.soNumber, customerName: so.customerName, deliveryDate: so.deliveryDate,
                    soItemId: item.id, itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
                    pendingQty: item.pendingQty, alreadyPlannedQty: alreadyPlanned._sum.plannedQty || 0, remainingToPlan,
                    productId: (product === null || product === void 0 ? void 0 : product.id) || null,
                    hasBom: !!bom, bomId: (bom === null || bom === void 0 ? void 0 : bom.id) || null,
                });
            }
        }
        return flat;
    }
    async clusterProductsBySimilarity(companyId, bomIds) {
        const isPackagingSection = (name) => /packag/i.test(name || '');
        const uniqueBomIds = [...new Set(bomIds)];
        if (uniqueBomIds.length === 0)
            return new Map();
        const boms = await this.prisma.bom.findMany({
            where: { id: { in: uniqueBomIds }, companyId },
            include: { items: { where: { isActive: true }, select: { itemCode: true, section: true } } },
        });
        const codeSets = new Map();
        for (const bom of boms) {
            codeSets.set(bom.id, new Set(bom.items.filter((i) => !isPackagingSection(i.section || '')).map((i) => i.itemCode)));
        }
        const THRESHOLD = 0.5;
        const clusterOf = new Map();
        let nextCluster = 0;
        for (const bomId of uniqueBomIds) {
            if (clusterOf.has(bomId))
                continue;
            const mySet = codeSets.get(bomId);
            const clusterId = nextCluster++;
            clusterOf.set(bomId, clusterId);
            if (!mySet || mySet.size === 0)
                continue;
            for (const otherBomId of uniqueBomIds) {
                if (clusterOf.has(otherBomId))
                    continue;
                const otherSet = codeSets.get(otherBomId);
                if (!otherSet || otherSet.size === 0)
                    continue;
                let intersection = 0;
                for (const code of mySet)
                    if (otherSet.has(code))
                        intersection++;
                const union = mySet.size + otherSet.size - intersection;
                const similarity = union > 0 ? intersection / union : 0;
                if (similarity >= THRESHOLD)
                    clusterOf.set(otherBomId, clusterId);
            }
        }
        return clusterOf;
    }
    async getPlanningBoard(user, warehouseId) {
        if (!warehouseId)
            throw new common_1.BadRequestException('warehouseId is required');
        const companyId = user.companyId;
        const flatItems = await this.getOpenSoLineItems(user, warehouseId);
        const bySo = new Map();
        for (const item of flatItems) {
            if (!bySo.has(item.soId)) {
                bySo.set(item.soId, {
                    soId: item.soId, soNumber: item.soNumber, customerName: item.customerName,
                    deliveryDate: item.deliveryDate, items: [],
                });
            }
            const rawRmRequirements = item.hasBom && item.remainingToPlan > 0
                ? await this.explodeMaterialNeeds(companyId, warehouseId, [
                    { itemCode: item.itemCode, itemName: item.itemName, uom: item.uom, qty: item.remainingToPlan },
                ])
                : [];
            const rmRequirements = rawRmRequirements.map(s => ({
                itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
                totalNeeded: s.netRequired, available: s.availableQty, shortfall: s.shortage,
            }));
            bySo.get(item.soId).items.push({
                soItemId: item.soItemId, itemCode: item.itemCode, itemName: item.itemName,
                pendingQty: item.pendingQty, alreadyPlannedQty: item.alreadyPlannedQty,
                remainingToPlan: item.remainingToPlan, hasBom: item.hasBom, bomId: item.bomId, rmRequirements,
            });
        }
        return Array.from(bySo.values()).filter((so) => so.items.some((i) => i.remainingToPlan > 0));
    }
    async getPlanningBoardByFamily(user, warehouseId) {
        if (!warehouseId)
            throw new common_1.BadRequestException('warehouseId is required');
        const companyId = user.companyId;
        const flatItems = (await this.getOpenSoLineItems(user, warehouseId))
            .filter(i => i.remainingToPlan > 0 && i.hasBom);
        const clusterOf = await this.clusterProductsBySimilarity(companyId, flatItems.map(i => i.bomId));
        const byCluster = new Map();
        for (const item of flatItems) {
            const clusterId = clusterOf.get(item.bomId);
            if (clusterId === undefined)
                continue;
            if (!byCluster.has(clusterId))
                byCluster.set(clusterId, []);
            byCluster.get(clusterId).push(item);
        }
        const families = [];
        const ungroupedSingles = [];
        for (const [, items] of byCluster) {
            if (items.length < 2) {
                ungroupedSingles.push(...items);
                continue;
            }
            const sortedItems = [...items].sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
            const bucketOrder = sortedItems.map(i => i.soItemId);
            const buckets = sortedItems.map(i => ({
                bucketKey: i.soItemId, itemCode: i.itemCode, itemName: i.itemName, uom: i.uom, qty: i.remainingToPlan,
            }));
            const { leafShortages } = await this.explodeMultiCpoMaterialNeeds(companyId, buckets, bucketOrder, warehouseId);
            const members = sortedItems.map(i => ({
                soId: i.soId, soNumber: i.soNumber, customerName: i.customerName, deliveryDate: i.deliveryDate,
                soItemId: i.soItemId, itemCode: i.itemCode, itemName: i.itemName,
                pendingQty: i.pendingQty, alreadyPlannedQty: i.alreadyPlannedQty, remainingToPlan: i.remainingToPlan,
                bomId: i.bomId,
                rmRequirements: (leafShortages.get(i.soItemId) || []).map(s => ({
                    itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
                    totalNeeded: s.netRequired, available: s.availableQty, shortfall: s.shortage,
                })),
            }));
            const sharedShortageMap = new Map();
            for (const i of sortedItems) {
                for (const s of leafShortages.get(i.soItemId) || []) {
                    const existing = sharedShortageMap.get(s.itemCode);
                    if (existing) {
                        existing.totalNeeded += s.netRequired;
                        existing.shortfall += s.shortage;
                    }
                    else {
                        sharedShortageMap.set(s.itemCode, {
                            itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
                            totalNeeded: s.netRequired, available: s.availableQty, shortfall: s.shortage,
                        });
                    }
                }
            }
            const distinctItemCodes = [...new Set(sortedItems.map(i => i.itemCode))];
            const distinctItemNames = [...new Set(sortedItems.map(i => i.itemName))];
            families.push({
                groupLabel: distinctItemNames.length === 1 ? distinctItemNames[0] : `${distinctItemNames[0]} + ${distinctItemNames.length - 1} similar`,
                productCodes: distinctItemCodes,
                totalRemainingToPlan: sortedItems.reduce((s, i) => s + i.remainingToPlan, 0),
                memberCount: sortedItems.length,
                sharedRmRequirements: Array.from(sharedShortageMap.values()),
                members,
            });
        }
        families.sort((a, b) => b.memberCount - a.memberCount);
        const ungroupedOut = [];
        for (const i of ungroupedSingles) {
            const rawRmRequirements = await this.explodeMaterialNeeds(companyId, warehouseId, [{ itemCode: i.itemCode, itemName: i.itemName, uom: i.uom, qty: i.remainingToPlan }]);
            ungroupedOut.push({
                soId: i.soId, soNumber: i.soNumber, customerName: i.customerName, deliveryDate: i.deliveryDate,
                soItemId: i.soItemId, itemCode: i.itemCode, itemName: i.itemName,
                pendingQty: i.pendingQty, alreadyPlannedQty: i.alreadyPlannedQty, remainingToPlan: i.remainingToPlan,
                bomId: i.bomId,
                rmRequirements: rawRmRequirements.map(s => ({
                    itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
                    totalNeeded: s.netRequired, available: s.availableQty, shortfall: s.shortage,
                })),
            });
        }
        return { families, ungrouped: ungroupedOut };
    }
    async runAllocation(dto, user) {
        const companyId = user.companyId;
        const active = (dto.allocations || []).filter(a => a.buildQty > 0);
        if (active.length === 0)
            throw new common_1.BadRequestException('No build quantities entered');
        if (!dto.warehouseId)
            throw new common_1.BadRequestException('warehouseId is required');
        const resolved = [];
        const skipped = [];
        for (const a of active) {
            const soItem = await this.prisma.salesOrderItem.findFirst({
                where: { id: a.soItemId, salesOrder: { companyId } },
                include: { salesOrder: true },
            });
            if (!soItem)
                throw new common_1.NotFoundException(`Sales order item ${a.soItemId} not found`);
            const product = await this.prisma.product.findFirst({ where: { companyId, code: soItem.itemCode } });
            if (!product) {
                skipped.push({
                    soItemId: soItem.id, itemCode: soItem.itemCode, itemName: soItem.itemName,
                    soNumber: soItem.salesOrder.soNumber, requestedQty: a.buildQty,
                    reason: 'Not a manufactured product - likely a raw material sold directly, fulfill from stock instead of building a Work Order',
                });
                continue;
            }
            const bom = await this.findProducingBom(companyId, product.id);
            if (!bom) {
                skipped.push({
                    soItemId: soItem.id, itemCode: soItem.itemCode, itemName: soItem.itemName,
                    soNumber: soItem.salesOrder.soNumber, requestedQty: a.buildQty,
                    reason: 'No approved BOM for this product yet',
                });
                continue;
            }
            const alreadyPlanned = await this.prisma.workOrder.aggregate({
                where: { companyId, salesOrderId: soItem.salesOrder.id, productCode: soItem.itemCode, status: { not: 'CANCELLED' } },
                _sum: { plannedQty: true },
            });
            const remainingToPlan = Math.max(0, soItem.pendingQty - (alreadyPlanned._sum.plannedQty || 0));
            if (a.buildQty > remainingToPlan + 0.0001) {
                throw new common_1.BadRequestException(`Build qty for ${soItem.itemCode} (${a.buildQty}) exceeds the remaining unplanned quantity (${remainingToPlan}) for ${soItem.salesOrder.soNumber}`);
            }
            resolved.push({ soItem, product, bom, buildQty: a.buildQty });
        }
        const consumedSoFar = new Map();
        const createdWorkOrders = [];
        const partiallyFulfilled = [];
        for (const r of resolved) {
            const rawNeed = await this.explodeMaterialNeeds(companyId, dto.warehouseId, [{ itemCode: r.soItem.itemCode, itemName: r.soItem.itemName, uom: r.soItem.uom, qty: r.buildQty }]);
            let minRatio = 1;
            for (const need of rawNeed) {
                const alreadyTaken = consumedSoFar.get(need.itemCode) || 0;
                const effectiveAvailable = Math.max(0, need.availableQty - alreadyTaken);
                const ratio = need.netRequired > 0 ? effectiveAvailable / need.netRequired : 1;
                minRatio = Math.min(minRatio, ratio);
            }
            minRatio = Math.max(0, Math.min(1, minRatio));
            const actualQty = Math.floor(r.buildQty * minRatio);
            if (actualQty <= 0) {
                skipped.push({
                    soItemId: r.soItem.id, itemCode: r.soItem.itemCode, itemName: r.soItem.itemName,
                    soNumber: r.soItem.salesOrder.soNumber, requestedQty: r.buildQty,
                    reason: 'No material currently available for this item',
                });
                continue;
            }
            for (const need of rawNeed) {
                const perUnit = r.buildQty > 0 ? need.netRequired / r.buildQty : 0;
                consumedSoFar.set(need.itemCode, (consumedSoFar.get(need.itemCode) || 0) + perUnit * actualQty);
            }
            let routing = await this.prisma.productRouting.findFirst({
                where: { companyId, finalProductId: r.product.id, isActive: true },
            });
            let stopAtSequence = undefined;
            if (!routing) {
                const matchedStage = await this.prisma.routingStage.findFirst({
                    where: { companyId, isActive: true, bom: { productId: r.product.id } },
                    include: { routing: true },
                });
                if (matchedStage && matchedStage.routing.isActive) {
                    routing = matchedStage.routing;
                    stopAtSequence = matchedStage.sequence;
                }
            }
            let createdEntry;
            if (routing) {
                const chain = await this.routingService.startProduction({ routingId: routing.id, plannedQty: actualQty, warehouseId: dto.warehouseId, stopAtSequence }, user);
                const finalStage = chain.stages[chain.stages.length - 1];
                await this.prisma.workOrder.update({
                    where: { id: finalStage.woId },
                    data: { salesOrderId: r.soItem.salesOrder.id },
                });
                await this.prisma.salesOrder.updateMany({
                    where: { id: r.soItem.salesOrder.id, status: 'CONFIRMED' },
                    data: { status: 'IN_PRODUCTION', updatedBy: user.id },
                });
                createdEntry = {
                    woId: finalStage.woId, woNumber: finalStage.woNumber,
                    soNumber: r.soItem.salesOrder.soNumber,
                    productCode: r.product.code, buildQty: actualQty,
                    routingGroupId: chain.routingGroupId, stages: chain.stages,
                };
            }
            else {
                const woNumber = await this.generateWoNumber(companyId);
                const wo = await this.prisma.workOrder.create({
                    data: {
                        woNumber, productCode: r.product.code, productName: r.product.name,
                        uom: r.soItem.uom || 'PCS', bomId: r.bom.id, warehouseId: dto.warehouseId,
                        plannedQty: actualQty,
                        plannedStartDate: new Date(),
                        plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        priority: 'MEDIUM', salesOrderId: r.soItem.salesOrder.id,
                        remarks: `Auto-planned from ${r.soItem.salesOrder.soNumber}`,
                        companyId, createdBy: user.id, updatedBy: user.id,
                    },
                });
                await this.audit.log({ tableName: 'work_orders', recordId: wo.id, action: 'CREATE', newValues: wo, changedBy: user.id });
                const reservations = await this.materialReservation.reserveForWorkOrder(wo.id, user);
                await this.prisma.workOrder.update({ where: { id: wo.id }, data: { status: 'RELEASED' } });
                await this.prisma.salesOrder.updateMany({
                    where: { id: r.soItem.salesOrder.id, status: 'CONFIRMED' },
                    data: { status: 'IN_PRODUCTION', updatedBy: user.id },
                });
                createdEntry = {
                    woId: wo.id, woNumber, soNumber: r.soItem.salesOrder.soNumber,
                    productCode: r.product.code, buildQty: actualQty, reservations,
                };
            }
            if (actualQty < r.buildQty) {
                createdEntry.partial = true;
                createdEntry.requestedQty = r.buildQty;
                createdEntry.remainingPending = r.buildQty - actualQty;
                partiallyFulfilled.push({
                    itemCode: r.soItem.itemCode, soNumber: r.soItem.salesOrder.soNumber,
                    requestedQty: r.buildQty, builtQty: actualQty, remainingPending: r.buildQty - actualQty,
                });
            }
            createdWorkOrders.push(createdEntry);
        }
        return {
            feasible: createdWorkOrders.length > 0,
            createdWorkOrders,
            partiallyFulfilled,
            skipped,
            note: skipped.length > 0 || partiallyFulfilled.length > 0
                ? 'Some items were partially fulfilled or skipped due to material availability - the shortfall remains pending for a future allocation run.'
                : undefined,
        };
    }
    async generateWoNumber(companyId) {
        const count = await this.prisma.workOrder.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `WO-${year}-${String(count + 1).padStart(4, '0')}`;
    }
};
exports.MrpService = MrpService;
exports.MrpService = MrpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        material_reservation_service_1.MaterialReservationService,
        routing_service_1.RoutingService])
], MrpService);
//# sourceMappingURL=mrp.service.js.map