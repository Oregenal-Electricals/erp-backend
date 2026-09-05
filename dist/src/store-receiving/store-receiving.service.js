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
exports.StoreReceivingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const gate_inward_service_1 = require("../gate-inward/gate-inward.service");
let StoreReceivingService = class StoreReceivingService {
    constructor(prisma, audit, gateInward) {
        this.prisma = prisma;
        this.audit = audit;
        this.gateInward = gateInward;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.storeReceiving.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `SR-${year}-${String(count + 1).padStart(6, '0')}`;
    }
    includes() {
        return {
            gateInwardEntry: { select: { ginNumber: true, supplierName: true, poNumber: true, invoiceNumber: true, gateInAt: true, status: true, remarks: true } },
            receivedBy: { select: { firstName: true, lastName: true } },
            items: true,
        };
    }
    async findPendingFromGate(user) {
        return this.prisma.gateInwardEntry.findMany({
            where: { companyId: user.companyId, status: 'SENT_TO_STORES', isActive: true },
            include: { items: true },
            orderBy: { gateInAt: 'asc' },
        });
    }
    async receiveAtStore(dto, user) {
        var _a;
        const entry = await this.prisma.gateInwardEntry.findFirst({
            where: { id: dto.gateInwardEntryId, companyId: user.companyId },
            include: { items: true },
        });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (entry.status !== 'SENT_TO_STORES') {
            throw new common_1.BadRequestException(`Cannot receive at Store - Gate-In is ${entry.status}, not SENT_TO_STORES. ` +
                (entry.status === 'COMPLETED' ? 'This material has already been received at Store.' :
                    entry.status === 'REJECTED' ? 'Gate-rejected material cannot enter normal Store receiving.' :
                        ((_a = entry.status) === null || _a === void 0 ? void 0 : _a.startsWith('GATE_HOLD_')) ? 'This entry is on a Gate hold and must be resolved by Purchase/Gate first.' :
                            'Material must clear the gate and be sent to stores before Store can receive it.'));
        }
        const receivingNumber = await this.generateNumber(user.companyId);
        let created;
        try {
            created = await this.prisma.storeReceiving.create({
                data: {
                    companyId: user.companyId,
                    receivingNumber,
                    gateInwardEntryId: entry.id,
                    supplierName: entry.supplierName,
                    poId: entry.poId,
                    poNumber: entry.poNumber,
                    invoiceNumber: entry.invoiceNumber,
                    receivingWarehouseId: dto.receivingWarehouseId,
                    receivedById: user.id,
                    status: 'PHYSICAL_VERIFICATION_PENDING',
                    remarks: dto.remarks,
                    createdBy: user.id, updatedBy: user.id,
                    items: {
                        create: entry.items.map(item => ({
                            companyId: user.companyId,
                            gateInwardItemId: item.id,
                            itemCode: item.itemCode,
                            itemName: item.itemName,
                            uom: item.uom,
                            expectedQty: item.quantity,
                            actualVerifiedQty: null,
                            createdBy: user.id, updatedBy: user.id,
                        })),
                    },
                },
                include: this.includes(),
            });
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.BadRequestException('This Gate-In has already been received at Store');
            }
            throw e;
        }
        await this.gateInward.complete(entry.id, user);
        await this.audit.log({
            tableName: 'store_receivings', recordId: created.id, action: 'CREATE',
            newValues: created, changedBy: user.id,
        });
        return created;
    }
    async findAll(user, query) {
        const page = parseInt(query === null || query === void 0 ? void 0 : query.page) || 1;
        const limit = parseInt(query === null || query === void 0 ? void 0 : query.limit) || 20;
        const where = { companyId: user.companyId, isActive: true };
        if (query === null || query === void 0 ? void 0 : query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            this.prisma.storeReceiving.findMany({
                where, include: this.includes(), orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit, take: limit,
            }),
            this.prisma.storeReceiving.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        const record = await this.prisma.storeReceiving.findFirst({
            where: { id, companyId: user.companyId },
            include: this.includes(),
        });
        if (!record)
            throw new common_1.NotFoundException('Store receiving record not found');
        return record;
    }
};
exports.StoreReceivingService = StoreReceivingService;
exports.StoreReceivingService = StoreReceivingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        gate_inward_service_1.GateInwardService])
], StoreReceivingService);
//# sourceMappingURL=store-receiving.service.js.map