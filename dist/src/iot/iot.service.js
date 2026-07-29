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
exports.IotService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const DEFAULT_THRESHOLDS = {
    TEMPERATURE: { max: 80, unit: '°C' },
    VIBRATION: { max: 10, unit: 'mm/s' },
    CURRENT: { max: 50, unit: 'A' },
    PRESSURE: { max: 100, unit: 'bar' },
};
let IotService = class IotService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createMachine(dto, user) {
        const existing = await this.prisma.iotMachine.findUnique({ where: { companyId_machineCode: { companyId: user.companyId, machineCode: dto.machineCode } } });
        if (existing)
            throw new common_1.BadRequestException(`Machine code ${dto.machineCode} already exists`);
        const machine = await this.prisma.iotMachine.create({
            data: Object.assign(Object.assign({}, dto), { machineType: dto.machineType || 'GENERAL', companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'iot_machines', recordId: machine.id, action: 'CREATE', newValues: machine, changedBy: user.id });
        return machine;
    }
    async updateMachine(id, dto, user) {
        const machine = await this.prisma.iotMachine.findFirst({ where: { id, companyId: user.companyId } });
        if (!machine)
            throw new common_1.NotFoundException('Machine not found');
        return this.prisma.iotMachine.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
    }
    async updateMachineStatus(id, status, user) {
        const machine = await this.prisma.iotMachine.findFirst({ where: { id, companyId: user.companyId } });
        if (!machine)
            throw new common_1.NotFoundException('Machine not found');
        return this.prisma.iotMachine.update({ where: { id }, data: { status, lastPingAt: new Date(), updatedBy: user.id } });
    }
    async findAllMachines(user, query) {
        const { status, machineType } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (status)
            where.status = status;
        if (machineType)
            where.machineType = machineType;
        return this.prisma.iotMachine.findMany({ where, orderBy: { machineCode: 'asc' } });
    }
    async getMachine(id, user) {
        const machine = await this.prisma.iotMachine.findFirst({ where: { id, companyId: user.companyId } });
        if (!machine)
            throw new common_1.NotFoundException('Machine not found');
        const [latestReadings, openAlerts] = await Promise.all([
            this.prisma.machineReading.findMany({ where: { machineId: id, companyId: user.companyId }, orderBy: { recordedAt: 'desc' }, take: 20 }),
            this.prisma.iotAlert.findMany({ where: { machineId: id, companyId: user.companyId, status: 'OPEN' }, orderBy: { createdAt: 'desc' } }),
        ]);
        return Object.assign(Object.assign({}, machine), { latestReadings, openAlerts });
    }
    async postReading(dto, user) {
        const machine = await this.prisma.iotMachine.findFirst({ where: { id: dto.machineId, companyId: user.companyId } });
        if (!machine)
            throw new common_1.NotFoundException('Machine not found');
        const reading = await this.prisma.machineReading.create({
            data: { companyId: user.companyId, machineId: dto.machineId, readingType: dto.readingType, value: dto.value, unit: dto.unit, createdBy: user.id, updatedBy: user.id },
        });
        await this.prisma.iotMachine.update({ where: { id: dto.machineId }, data: { status: 'RUNNING', lastPingAt: new Date(), updatedBy: user.id } });
        const threshold = DEFAULT_THRESHOLDS[dto.readingType];
        if (threshold && dto.value > threshold.max) {
            await this.prisma.iotAlert.create({
                data: {
                    companyId: user.companyId, machineId: dto.machineId,
                    alertType: 'THRESHOLD_BREACH', severity: dto.value > threshold.max * 1.2 ? 'CRITICAL' : 'WARNING',
                    parameter: dto.readingType, value: dto.value, threshold: threshold.max,
                    message: `${machine.machineName}: ${dto.readingType} ${dto.value}${dto.unit || ''} exceeds threshold ${threshold.max}${threshold.unit}`,
                    createdBy: user.id, updatedBy: user.id,
                },
            });
        }
        return reading;
    }
    async bulkPostReadings(dto, user) {
        const results = [];
        for (const r of dto.readings) {
            try {
                const reading = await this.postReading(Object.assign({ machineId: dto.machineId }, r), user);
                results.push({ readingType: r.readingType, success: true, id: reading.id });
            }
            catch (e) {
                results.push({ readingType: r.readingType, success: false, error: e.message });
            }
        }
        return { machineId: dto.machineId, total: results.length, success: results.filter(r => r.success).length, results };
    }
    async getReadings(machineId, user, query) {
        const { readingType, hours = 24 } = query;
        const from = new Date(Date.now() - Number(hours) * 3600000);
        const where = { machineId, companyId: user.companyId, recordedAt: { gte: from } };
        if (readingType)
            where.readingType = readingType;
        return this.prisma.machineReading.findMany({ where, orderBy: { recordedAt: 'desc' }, take: 500 });
    }
    async getAlerts(user, query) {
        const { status, machineId, severity } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (status)
            where.status = status;
        if (machineId)
            where.machineId = machineId;
        if (severity)
            where.severity = severity;
        return this.prisma.iotAlert.findMany({
            where, orderBy: { createdAt: 'desc' }, take: 100,
            include: { machine: { select: { machineName: true, machineCode: true, location: true } } },
        });
    }
    async updateAlert(id, dto, user) {
        const alert = await this.prisma.iotAlert.findFirst({ where: { id, companyId: user.companyId } });
        if (!alert)
            throw new common_1.NotFoundException('Alert not found');
        return this.prisma.iotAlert.update({
            where: { id },
            data: Object.assign(Object.assign({ status: dto.status }, (dto.status === 'RESOLVED' && { resolvedAt: new Date(), resolvedBy: user.id })), { updatedBy: user.id }),
        });
    }
    async getDashboard(user) {
        const [totalMachines, onlineMachines, runningMachines, openAlerts, criticalAlerts] = await Promise.all([
            this.prisma.iotMachine.count({ where: { companyId: user.companyId, isActive: true } }),
            this.prisma.iotMachine.count({ where: { companyId: user.companyId, isActive: true, status: 'ONLINE' } }),
            this.prisma.iotMachine.count({ where: { companyId: user.companyId, isActive: true, status: 'RUNNING' } }),
            this.prisma.iotAlert.count({ where: { companyId: user.companyId, status: 'OPEN' } }),
            this.prisma.iotAlert.count({ where: { companyId: user.companyId, status: 'OPEN', severity: 'CRITICAL' } }),
        ]);
        const machines = await this.prisma.iotMachine.findMany({
            where: { companyId: user.companyId, isActive: true },
            orderBy: { machineCode: 'asc' },
        });
        return { totalMachines, onlineMachines, runningMachines, offlineMachines: totalMachines - onlineMachines - runningMachines, openAlerts, criticalAlerts, machines };
    }
    async getAiInsights(user) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [topOtEmployees, slowMovingItems, vendorRejectionRates, productionEfficiency] = await Promise.all([
            this.prisma.payrollEntry.findMany({
                where: { companyId: user.companyId, createdAt: { gte: monthStart }, otHours: { gt: 0 } },
                include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
                orderBy: { otHours: 'desc' }, take: 5,
            }),
            this.prisma.stockBalance.findMany({
                where: { companyId: user.companyId },
                take: 10,
            }),
            this.prisma.vendor.findMany({
                where: { companyId: user.companyId, isActive: true },
                include: { _count: { select: { purchaseOrders: true } } },
                take: 5,
            }),
            this.prisma.workOrder.findMany({
                where: { companyId: user.companyId, createdAt: { gte: monthStart } },
                select: { id: true, status: true, plannedQty: true },
                take: 20,
            }),
        ]);
        const totalPlanned = productionEfficiency.reduce((s, w) => s + (w.plannedQty || 0), 0);
        const totalActual = productionEfficiency.filter(w => w.status === 'COMPLETED').length * 100;
        const efficiencyRate = totalPlanned > 0 ? Math.round(totalActual / totalPlanned * 100) : 0;
        return {
            reportType: 'AI_INSIGHTS',
            generatedAt: now,
            insights: [
                { category: 'HR', title: 'High OT Employees', data: topOtEmployees.map(e => { var _a, _b; return ({ name: `${(_a = e.employee) === null || _a === void 0 ? void 0 : _a.firstName} ${(_b = e.employee) === null || _b === void 0 ? void 0 : _b.lastName}`, otHours: e.otHours, otAmount: e.otAmount }); }) },
                { category: 'INVENTORY', title: 'High Stock Items', data: slowMovingItems.map(i => ({ id: i.id, companyId: i.companyId })) },
                { category: 'PRODUCTION', title: 'Production Efficiency', data: { efficiencyRate, totalPlanned: productionEfficiency.length, completed: productionEfficiency.filter(w => w.status === 'COMPLETED').length, workOrders: productionEfficiency.length } },
            ],
        };
    }
    async getPredictiveInsights(user) {
        const machines = await this.prisma.iotMachine.findMany({ where: { companyId: user.companyId, isActive: true } });
        const predictions = machines.map(m => ({
            machineId: m.id, machineCode: m.machineCode, machineName: m.machineName,
            maintenanceDue: m.status === 'ERROR' ? 'IMMEDIATE' : m.status === 'OFFLINE' ? 'SOON' : 'SCHEDULED',
            predictedDowntime: m.status === 'ERROR' ? 'HIGH RISK' : 'LOW RISK',
            recommendation: m.status === 'ERROR' ? 'Schedule immediate maintenance' : m.status === 'OFFLINE' ? 'Check connectivity and power' : 'Continue monitoring',
        }));
        return { reportType: 'PREDICTIVE_ANALYTICS', generatedAt: new Date(), predictions };
    }
};
exports.IotService = IotService;
exports.IotService = IotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], IotService);
//# sourceMappingURL=iot.service.js.map