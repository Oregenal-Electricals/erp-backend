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
exports.CustomerPortalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomerPortalService = class CustomerPortalService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCustomerDashboard(customerId, companyId) {
        const customer = await this.prisma.customerPo.findFirst({ where: { id: customerId, companyId } });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        const [openOrders, pendingDeliveries, totalOrders, recentOrders] = await Promise.all([
            this.prisma.salesOrder.count({ where: { companyId, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
            this.prisma.dispatch.count({ where: { companyId, status: 'DISPATCHED' } }),
            this.prisma.salesOrder.count({ where: { companyId } }),
            this.prisma.salesOrder.findMany({
                where: { companyId },
                take: 5, orderBy: { createdAt: 'desc' },
                select: { id: true, soNumber: true, totalAmount: true, status: true, createdAt: true },
            }),
        ]);
        return { customer: { name: (customer === null || customer === void 0 ? void 0 : customer.customerName) || 'Customer', code: (customer === null || customer === void 0 ? void 0 : customer.cpoNumber) || '', email: '' }, stats: { openOrders, pendingDeliveries, totalOrders }, recentOrders };
    }
    async getCustomerOrders(customerId, companyId, query) {
        const { status, page = 1, limit = 20 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId, isActive: true };
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.salesOrder.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { items: true },
            }),
            this.prisma.salesOrder.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async getCustomerDispatches(customerId, companyId) {
        return this.prisma.dispatch.findMany({
            where: { companyId, isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async getCustomerComplaints(customerId, companyId) {
        return this.prisma.customerComplaint.findMany({
            where: { companyId, customerId, isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
};
exports.CustomerPortalService = CustomerPortalService;
exports.CustomerPortalService = CustomerPortalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomerPortalService);
//# sourceMappingURL=customer-portal.service.js.map