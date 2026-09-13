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
exports.StockLocationTransferService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const stock_location_balance_service_1 = require("../stock-location-balance/stock-location-balance.service");
let StockLocationTransferService = class StockLocationTransferService {
    constructor(prisma, audit, locationBalance) {
        this.prisma = prisma;
        this.audit = audit;
        this.locationBalance = locationBalance;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.stockTransfer.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `LOCXFER-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    async transfer(dto, user) {
        var _a;
        const status = dto.status || 'AVAILABLE';
        const batchId = (_a = dto.batchId) !== null && _a !== void 0 ? _a : null;
        if (dto.fromBinId === dto.toBinId) {
            throw new common_1.BadRequestException('Source and destination bin cannot be the same.');
        }
        const [fromBin, toBin] = await Promise.all([
            this.prisma.warehouseBin.findFirst({ where: { id: dto.fromBinId, companyId: user.companyId } }),
            this.prisma.warehouseBin.findFirst({ where: { id: dto.toBinId, companyId: user.companyId } }),
        ]);
        if (!fromBin)
            throw new common_1.NotFoundException('Source bin not found');
        if (!toBin)
            throw new common_1.NotFoundException('Destination bin not found');
        if (fromBin.warehouseId !== toBin.warehouseId) {
            throw new common_1.BadRequestException('Source and destination bins are in different warehouses - use the inter-warehouse transfer process, not a simple location transfer.');
        }
        if (!toBin.isActive || toBin.status === 'BLOCKED') {
            throw new common_1.BadRequestException(`Destination bin ${toBin.code} is blocked or inactive and cannot receive a transfer.`);
        }
        const sourceBalance = await this.locationBalance.getBalance(user.companyId, dto.itemCode, dto.fromBinId, batchId, status);
        if (!sourceBalance || sourceBalance.qty < dto.qty - 0.0001) {
            throw new common_1.BadRequestException(`Transfer qty (${dto.qty}) exceeds what is actually available in the source bin (${(sourceBalance === null || sourceBalance === void 0 ? void 0 : sourceBalance.qty) || 0}) for ${dto.itemCode}.`);
        }
        const alreadyInDest = toBin.currentQty;
        const newDestQty = alreadyInDest + dto.qty;
        if (toBin.maxQty && newDestQty > toBin.maxQty) {
            throw new common_1.BadRequestException(`Bin ${toBin.code} can only hold ${toBin.maxQty} but this transfer would bring it to ${newDestQty} (already has ${alreadyInDest}, adding ${dto.qty}). Choose a bin with more capacity or reduce the transfer qty.`);
        }
        await this.locationBalance.adjustQty({
            companyId: user.companyId, itemCode: dto.itemCode, itemName: dto.itemName,
            warehouseId: fromBin.warehouseId, binId: dto.fromBinId, batchId, status,
            deltaQty: -dto.qty, userId: user.id,
        });
        await this.locationBalance.adjustQty({
            companyId: user.companyId, itemCode: dto.itemCode, itemName: dto.itemName,
            warehouseId: toBin.warehouseId, binId: dto.toBinId, batchId, status,
            deltaQty: dto.qty, userId: user.id,
        });
        const newFromQty = Math.max(0, fromBin.currentQty - dto.qty);
        await this.prisma.warehouseBin.update({
            where: { id: dto.fromBinId },
            data: { currentQty: newFromQty, status: newFromQty <= 0 ? 'EMPTY' : (fromBin.maxQty && newFromQty >= fromBin.maxQty ? 'FULL' : 'PARTIAL'), updatedBy: user.id },
        });
        await this.prisma.warehouseBin.update({
            where: { id: dto.toBinId },
            data: { currentQty: newDestQty, itemCode: dto.itemCode, status: toBin.maxQty && newDestQty >= toBin.maxQty ? 'FULL' : 'PARTIAL', updatedBy: user.id },
        });
        const transferNumber = await this.generateNumber(user.companyId);
        const transfer = await this.prisma.stockTransfer.create({
            data: {
                companyId: user.companyId, transferNumber, transferType: 'INTRA_WAREHOUSE',
                fromWarehouseId: fromBin.warehouseId, toWarehouseId: toBin.warehouseId,
                fromBinId: dto.fromBinId, toBinId: dto.toBinId, status: 'CONFIRMED',
                remarks: dto.remarks ? `${dto.reason || 'OTHER'}: ${dto.remarks}` : dto.reason,
                createdBy: user.id, updatedBy: user.id,
                items: {
                    create: [{
                            companyId: user.companyId, batchId: batchId || undefined,
                            itemCode: dto.itemCode, itemName: dto.itemName, uom: dto.uom, qty: dto.qty,
                            createdBy: user.id, updatedBy: user.id,
                        }],
                },
            },
            include: { items: true },
        });
        await this.audit.log({
            tableName: 'stock_transfers', recordId: transfer.id, action: 'CREATE',
            newValues: transfer, changedBy: user.id,
        });
        return transfer;
    }
    async getBinContents(binId, user) {
        return this.locationBalance.getByBin(user.companyId, binId);
    }
    async getItemLocations(itemCode, user) {
        return this.locationBalance.getByItem(user.companyId, itemCode);
    }
    async findHistory(user, itemCode) {
        return this.prisma.stockTransfer.findMany({
            where: Object.assign({ companyId: user.companyId, transferType: 'INTRA_WAREHOUSE' }, (itemCode ? { items: { some: { itemCode } } } : {})),
            include: { items: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
};
exports.StockLocationTransferService = StockLocationTransferService;
exports.StockLocationTransferService = StockLocationTransferService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        stock_location_balance_service_1.StockLocationBalanceService])
], StockLocationTransferService);
//# sourceMappingURL=stock-location-transfer.service.js.map