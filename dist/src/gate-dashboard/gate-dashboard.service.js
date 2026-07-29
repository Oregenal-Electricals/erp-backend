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
exports.GateDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GateDashboardService = class GateDashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const base = { companyId: user.companyId };
        const [visitorsInside, vehiclesInside, todayVisitors, todayVehicles, pendingGINs, pendingGOEs, pendingPasses, issuedPasses, yesterdayVisitors, yesterdayVehicles, returnableOverdue,] = await Promise.all([
            this.prisma.visitorLog.count({ where: Object.assign(Object.assign({}, base), { status: 'CHECKED_IN' }) }),
            this.prisma.vehicleLog.count({ where: Object.assign(Object.assign({}, base), { status: 'INSIDE' }) }),
            this.prisma.visitorLog.count({ where: Object.assign(Object.assign({}, base), { checkInTime: { gte: today, lt: tomorrow } }) }),
            this.prisma.vehicleLog.count({ where: Object.assign(Object.assign({}, base), { entryTime: { gte: today, lt: tomorrow } }) }),
            this.prisma.gateInwardEntry.count({ where: Object.assign(Object.assign({}, base), { status: 'PENDING' }) }),
            this.prisma.gateOutwardEntry.count({ where: Object.assign(Object.assign({}, base), { status: 'PENDING' }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { status: 'PENDING' }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { status: 'ISSUED' }) }),
            this.prisma.visitorLog.count({ where: Object.assign(Object.assign({}, base), { checkInTime: { gte: yesterday, lt: today } }) }),
            this.prisma.vehicleLog.count({ where: Object.assign(Object.assign({}, base), { entryTime: { gte: yesterday, lt: today } }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { status: 'ISSUED', type: 'RETURNABLE', validTo: { lt: new Date() } }) }),
        ]);
        const activeVisitors = await this.prisma.visitorLog.findMany({
            where: Object.assign(Object.assign({}, base), { status: 'CHECKED_IN' }),
            include: {
                visitor: { select: { firstName: true, lastName: true, mobile: true, visitorCompany: true } },
                plant: { select: { name: true } },
                hostEmployee: { select: { firstName: true, lastName: true } },
            },
            orderBy: { checkInTime: 'asc' },
            take: 10,
        });
        const activeVehicles = await this.prisma.vehicleLog.findMany({
            where: Object.assign(Object.assign({}, base), { status: 'INSIDE' }),
            include: {
                vehicle: { select: { vehicleNumber: true, vehicleType: true } },
                plant: { select: { name: true } },
            },
            orderBy: { entryTime: 'asc' },
            take: 10,
        });
        const pendingGINList = await this.prisma.gateInwardEntry.findMany({
            where: Object.assign(Object.assign({}, base), { status: 'PENDING' }),
            include: { plant: { select: { name: true } } },
            orderBy: { createdAt: 'asc' },
            take: 5,
        });
        const pendingGOEList = await this.prisma.gateOutwardEntry.findMany({
            where: Object.assign(Object.assign({}, base), { status: 'PENDING' }),
            include: { plant: { select: { name: true } } },
            orderBy: { createdAt: 'asc' },
            take: 5,
        });
        const pendingPassList = await this.prisma.gatePass.findMany({
            where: Object.assign(Object.assign({}, base), { status: { in: ['PENDING', 'APPROVED'] } }),
            include: {
                plant: { select: { name: true } },
                requestedBy: { select: { firstName: true, lastName: true } },
                employee: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'asc' },
            take: 5,
        });
        const [recentVisitorLogs, recentVehicleLogs, recentGINs, recentGOEs, recentPasses] = await Promise.all([
            this.prisma.visitorLog.findMany({
                where: Object.assign(Object.assign({}, base), { checkInTime: { gte: today } }),
                include: { visitor: { select: { firstName: true, lastName: true } } },
                orderBy: { checkInTime: 'desc' }, take: 5,
            }),
            this.prisma.vehicleLog.findMany({
                where: Object.assign(Object.assign({}, base), { entryTime: { gte: today } }),
                include: { vehicle: { select: { vehicleNumber: true } } },
                orderBy: { entryTime: 'desc' }, take: 5,
            }),
            this.prisma.gateInwardEntry.findMany({
                where: Object.assign(Object.assign({}, base), { createdAt: { gte: today } }),
                orderBy: { createdAt: 'desc' }, take: 3,
            }),
            this.prisma.gateOutwardEntry.findMany({
                where: Object.assign(Object.assign({}, base), { createdAt: { gte: today } }),
                orderBy: { createdAt: 'desc' }, take: 3,
            }),
            this.prisma.gatePass.findMany({
                where: Object.assign(Object.assign({}, base), { createdAt: { gte: today } }),
                orderBy: { createdAt: 'desc' }, take: 3,
            }),
        ]);
        const timeline = [
            ...recentVisitorLogs.map(l => ({
                type: 'VISITOR', time: l.checkInTime,
                title: `${l.visitor.firstName} ${l.visitor.lastName} checked in`,
                badge: l.status === 'CHECKED_IN' ? 'IN' : 'OUT', color: 'blue',
            })),
            ...recentVehicleLogs.map(l => ({
                type: 'VEHICLE', time: l.entryTime,
                title: `${l.vehicle.vehicleNumber} entered`,
                badge: l.status, color: 'green',
            })),
            ...recentGINs.map(l => ({
                type: 'GIN', time: l.createdAt,
                title: `GIN ${l.ginNumber} — ${l.supplierName}`,
                badge: l.status, color: 'purple',
            })),
            ...recentGOEs.map(l => ({
                type: 'GOE', time: l.createdAt,
                title: `GOE ${l.goeNumber} — ${l.customerName}`,
                badge: l.status, color: 'orange',
            })),
            ...recentPasses.map(l => ({
                type: 'PASS', time: l.createdAt,
                title: `Pass ${l.passNumber} — ${l.carrierName}`,
                badge: l.status, color: 'teal',
            })),
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20);
        return {
            liveStats: {
                visitorsInside, vehiclesInside,
                todayVisitors, todayVehicles,
                pendingGINs, pendingGOEs,
                pendingPasses, issuedPasses,
                yesterdayVisitors, yesterdayVehicles,
                returnableOverdue,
            },
            activeVisitors,
            activeVehicles,
            pendingGINList,
            pendingGOEList,
            pendingPassList,
            timeline,
        };
    }
};
exports.GateDashboardService = GateDashboardService;
exports.GateDashboardService = GateDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GateDashboardService);
//# sourceMappingURL=gate-dashboard.service.js.map