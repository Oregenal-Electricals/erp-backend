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
exports.VendorPortalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VendorPortalService = class VendorPortalService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getVendorDashboard(vendorId, companyId) {
        const vendor = await this.prisma.vendor.findFirst({ where: { id: vendorId, companyId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const [openPOs, pendingRFQs, totalPOs, recentPOs] = await Promise.all([
            this.prisma.purchaseOrder.count({ where: { companyId, vendorId, status: { in: ['APPROVED', 'SENT'] } } }),
            this.prisma.rfq.count({ where: { companyId, status: 'SENT' } }),
            this.prisma.purchaseOrder.count({ where: { companyId, vendorId } }),
            this.prisma.purchaseOrder.findMany({
                where: { companyId, vendorId },
                take: 5, orderBy: { createdAt: 'desc' },
                select: { id: true, poNumber: true, totalAmount: true, status: true, createdAt: true },
            }),
        ]);
        return { vendor: { name: vendor.name, code: vendor.code, email: vendor.email }, stats: { openPOs, pendingRFQs, totalPOs }, recentPOs };
    }
    async getVendorPOs(vendorId, companyId, query) {
        const { status, page = 1, limit = 20 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId, vendorId, isActive: true };
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.purchaseOrder.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { items: true },
            }),
            this.prisma.purchaseOrder.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async getVendorRFQs(vendorId, companyId) {
        return this.prisma.rfq.findMany({
            where: { companyId, status: { in: ['SENT', 'CLOSED'] },
                vendors: { some: { vendorId } }
            },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async getVendorQuotations(vendorId, companyId) {
        return this.prisma.vendorQuotation.findMany({
            where: { companyId, vendorId, isActive: true },
            include: { rfq: { select: { rfqNumber: true } }, items: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
};
exports.VendorPortalService = VendorPortalService;
exports.VendorPortalService = VendorPortalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VendorPortalService);
//# sourceMappingURL=vendor-portal.service.js.map