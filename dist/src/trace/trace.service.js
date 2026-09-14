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
exports.TraceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TraceService = class TraceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(query, user) {
        const companyId = user.companyId;
        const q = query.trim();
        const batch = await this.prisma.stockBatch.findFirst({
            where: { companyId, batchNumber: q },
        });
        if (batch)
            return this.traceBatch(batch, user);
        const anyBatchForItem = await this.prisma.stockBatch.findFirst({
            where: { companyId, itemCode: q },
        });
        if (anyBatchForItem) {
            return this.traceItem(q, user);
        }
        const anyBalance = await this.prisma.stockBalance.findFirst({ where: { companyId, itemCode: q } });
        if (anyBalance)
            return this.traceItem(q, user);
        throw new common_1.NotFoundException(`No material found for "${query}" - not a known item code or batch number.`);
    }
    async traceBatch(batch, user) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        const companyId = user.companyId;
        const events = [];
        let po = null;
        let grn = null;
        if (batch.grnId) {
            grn = await this.prisma.grnHeader.findFirst({ where: { id: batch.grnId } });
            if (grn) {
                events.push({ stage: 'GRN', label: `GRN ${grn.grnNumber} posted`, qty: null, reference: grn.grnNumber, at: grn.receivedDate || grn.createdAt });
                if (grn.poId) {
                    po = await this.prisma.purchaseOrder.findFirst({ where: { id: grn.poId }, include: { vendor: { select: { name: true } } } });
                    if (po)
                        events.unshift({ stage: 'PO', label: `PO ${po.poNumber} - ${((_a = po.vendor) === null || _a === void 0 ? void 0 : _a.name) || 'vendor'}`, qty: null, reference: po.poNumber, at: po.createdAt });
                }
            }
        }
        const iqcItems = await this.prisma.iqcItem.findMany({
            where: { companyId, itemCode: batch.itemCode, batchNumber: batch.batchNumber },
            include: { iqc: { select: { iqcNumber: true, status: true, createdAt: true } } },
        });
        for (const it of iqcItems) {
            events.push({ stage: 'IQC', label: `IQC ${(_b = it.iqc) === null || _b === void 0 ? void 0 : _b.iqcNumber} - accepted ${it.acceptedQty}, rejected ${it.rejectedQty}, hold ${it.holdQty}`, qty: it.acceptedQty, reference: (_c = it.iqc) === null || _c === void 0 ? void 0 : _c.iqcNumber, at: (_d = it.iqc) === null || _d === void 0 ? void 0 : _d.createdAt });
        }
        const putawayItems = await this.prisma.stockPutawayItem.findMany({
            where: { companyId, stockBatchId: batch.id },
            include: { putaway: { select: { putawayNumber: true, createdAt: true } }, bin: { select: { code: true } } },
        });
        for (const it of putawayItems) {
            events.push({ stage: 'PUT_AWAY', label: `Put away ${it.qty} to bin ${(_e = it.bin) === null || _e === void 0 ? void 0 : _e.code}`, qty: it.qty, reference: (_f = it.putaway) === null || _f === void 0 ? void 0 : _f.putawayNumber, at: (_g = it.putaway) === null || _g === void 0 ? void 0 : _g.createdAt });
        }
        const reservations = await this.prisma.materialReservation.findMany({
            where: { companyId, itemCode: batch.itemCode },
            include: { workOrder: { select: { woNumber: true } } },
        });
        for (const r of reservations) {
            events.push({ stage: 'RESERVATION', label: `Reserved ${r.reservedQty} for WO ${(_h = r.workOrder) === null || _h === void 0 ? void 0 : _h.woNumber} (item-level, not batch-scoped)`, qty: r.reservedQty, reference: (_j = r.workOrder) === null || _j === void 0 ? void 0 : _j.woNumber, at: r.createdAt });
        }
        const issueItems = await this.prisma.productionIssueItem.findMany({
            where: { companyId, batchId: batch.id },
            include: { productionIssue: { select: { issueNumber: true, status: true, createdAt: true, workOrder: { select: { woNumber: true } } } } },
        });
        for (const it of issueItems) {
            events.push({ stage: 'ISSUE', label: `Issued ${it.issuedQty} to WO ${(_l = (_k = it.productionIssue) === null || _k === void 0 ? void 0 : _k.workOrder) === null || _l === void 0 ? void 0 : _l.woNumber} (${(_m = it.productionIssue) === null || _m === void 0 ? void 0 : _m.issueNumber})`, qty: it.issuedQty, reference: (_o = it.productionIssue) === null || _o === void 0 ? void 0 : _o.issueNumber, at: (_p = it.productionIssue) === null || _p === void 0 ? void 0 : _p.createdAt });
        }
        const returns = await this.prisma.productionMaterialReturn.findMany({
            where: { companyId, batchId: batch.id },
            include: { workOrder: { select: { woNumber: true } } },
        });
        for (const r of returns) {
            events.push({ stage: 'PRODUCTION_RETURN', label: `Returned ${r.qty} from WO ${(_q = r.workOrder) === null || _q === void 0 ? void 0 : _q.woNumber} - condition ${r.condition}`, qty: r.qty, reference: r.returnNumber, at: r.returnedAt });
        }
        const transferItems = await this.prisma.stockTransferItem.findMany({
            where: { companyId, batchId: batch.id },
            include: { transfer: { select: { transferNumber: true, fromBinId: true, toBinId: true, createdAt: true } } },
        });
        for (const it of transferItems) {
            events.push({ stage: 'LOCATION_TRANSFER', label: `Transferred ${it.qty}`, qty: it.qty, reference: (_r = it.transfer) === null || _r === void 0 ? void 0 : _r.transferNumber, at: (_s = it.transfer) === null || _s === void 0 ? void 0 : _s.createdAt });
        }
        const adjItems = await this.prisma.stockAdjustmentItem.findMany({
            where: { companyId, batchId: batch.id },
            include: { adjustment: { select: { adjustmentNumber: true, status: true, createdAt: true } } },
        });
        for (const it of adjItems) {
            events.push({ stage: 'STOCK_COUNT', label: `Count variance ${it.adjustmentQty > 0 ? '+' : ''}${it.adjustmentQty} (${(_t = it.adjustment) === null || _t === void 0 ? void 0 : _t.status})`, qty: it.adjustmentQty, reference: (_u = it.adjustment) === null || _u === void 0 ? void 0 : _u.adjustmentNumber, at: (_v = it.adjustment) === null || _v === void 0 ? void 0 : _v.createdAt });
        }
        const rtvs = await this.prisma.rtvRequest.findMany({
            where: { companyId, batchId: batch.id },
            include: { vendor: { select: { name: true } }, gateOuts: true },
        });
        for (const r of rtvs) {
            events.push({ stage: 'RTV', label: `RTV ${r.rtvNumber} - requested ${r.requestedQty} to ${(_w = r.vendor) === null || _w === void 0 ? void 0 : _w.name} (${r.status})`, qty: r.requestedQty, reference: r.rtvNumber, at: r.createdAt });
            for (const go of r.gateOuts) {
                events.push({ stage: 'GATE_OUT', label: `Gate-Out ${go.qty} against ${r.rtvNumber}`, qty: go.qty, reference: r.rtvNumber, at: go.gatedOutAt });
            }
        }
        events.sort((a, b) => new Date(a.at || 0).getTime() - new Date(b.at || 0).getTime());
        const locations = await this.prisma.stockLocationBalance.findMany({
            where: { companyId, batchId: batch.id, qty: { gt: 0 } },
            include: { bin: { select: { code: true } } },
        });
        return {
            identity: { itemCode: batch.itemCode, itemName: batch.itemName, batchNumber: batch.batchNumber, poNumber: po === null || po === void 0 ? void 0 : po.poNumber, grnNumber: grn === null || grn === void 0 ? void 0 : grn.grnNumber },
            currentState: {
                status: batch.status,
                availableQty: batch.availableQty,
                reservedQty: batch.reservedQty,
                freeQty: Math.max(0, batch.availableQty - batch.reservedQty),
                mfgDate: batch.mfgDate, expiryDate: batch.expiryDate, receivedDate: batch.receivedDate,
                locations: locations.map(l => { var _a; return ({ binCode: (_a = l.bin) === null || _a === void 0 ? void 0 : _a.code, qty: l.qty, status: l.status }); }),
            },
            timeline: events,
        };
    }
    async traceItem(itemCode, user) {
        var _a, _b;
        const companyId = user.companyId;
        const balances = await this.prisma.stockBalance.findMany({ where: { companyId, itemCode } });
        const batches = await this.prisma.stockBatch.findMany({ where: { companyId, itemCode }, orderBy: { receivedDate: 'desc' } });
        const locations = await this.prisma.stockLocationBalance.findMany({
            where: { companyId, itemCode, qty: { gt: 0 } },
            include: { bin: { select: { code: true } } },
        });
        const totalAvailable = balances.reduce((s, b) => s + b.availableQty, 0);
        const totalReserved = balances.reduce((s, b) => s + b.reservedQty, 0);
        return {
            identity: { itemCode, itemName: ((_a = balances[0]) === null || _a === void 0 ? void 0 : _a.itemName) || ((_b = batches[0]) === null || _b === void 0 ? void 0 : _b.itemName) },
            currentState: {
                availableQty: totalAvailable,
                reservedQty: totalReserved,
                freeQty: Math.max(0, totalAvailable - totalReserved),
                batches: batches.map(b => ({ batchNumber: b.batchNumber, status: b.status, availableQty: b.availableQty, reservedQty: b.reservedQty, expiryDate: b.expiryDate })),
                locations: locations.map(l => { var _a; return ({ binCode: (_a = l.bin) === null || _a === void 0 ? void 0 : _a.code, batchId: l.batchId, qty: l.qty, status: l.status }); }),
            },
            timeline: [],
            note: 'Multiple batches exist for this item - search a specific batch number for its full event timeline.',
        };
    }
};
exports.TraceService = TraceService;
exports.TraceService = TraceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TraceService);
//# sourceMappingURL=trace.service.js.map