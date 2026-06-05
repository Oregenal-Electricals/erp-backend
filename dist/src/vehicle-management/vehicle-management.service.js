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
exports.VehicleManagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const settings_service_1 = require("../settings/settings.service");
const client_1 = require("@prisma/client");
let VehicleManagementService = class VehicleManagementService {
    constructor(prisma, audit, settings) {
        this.prisma = prisma;
        this.audit = audit;
        this.settings = settings;
    }
    async createVehicle(dto, user) {
        const exists = await this.prisma.vehicle.findUnique({
            where: { companyId_vehicleNumber: { companyId: user.companyId, vehicleNumber: dto.vehicleNumber.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Vehicle ${dto.vehicleNumber} already registered`);
        const vehicle = await this.prisma.vehicle.create({
            data: Object.assign(Object.assign({}, dto), { vehicleNumber: dto.vehicleNumber.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'vehicles', recordId: vehicle.id, action: 'CREATE', newValues: vehicle, changedBy: user.id });
        return vehicle;
    }
    async findAllVehicles(user, search) {
        const where = { companyId: user.companyId };
        if (search) {
            where.OR = [
                { vehicleNumber: { contains: search.toUpperCase(), mode: 'insensitive' } },
                { ownerName: { contains: search, mode: 'insensitive' } },
                { ownerMobile: { contains: search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.vehicle.findMany({
            where,
            include: { _count: { select: { logs: true } } },
            orderBy: { vehicleNumber: 'asc' },
        });
    }
    async findOneVehicle(id) {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                logs: {
                    include: {
                        plant: { select: { id: true, name: true, code: true } },
                        entryBy: { select: { id: true, firstName: true, lastName: true } },
                    },
                    orderBy: { entryTime: 'desc' },
                    take: 10,
                },
            },
        });
        if (!vehicle)
            throw new common_1.NotFoundException('Vehicle not found');
        return vehicle;
    }
    async updateVehicle(id, dto, user) {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle)
            throw new common_1.NotFoundException('Vehicle not found');
        const updated = await this.prisma.vehicle.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'vehicles', recordId: id, action: 'UPDATE', oldValues: vehicle, newValues: dto, changedBy: user.id });
        return updated;
    }
    async logEntry(dto, user) {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
        if (!vehicle)
            throw new common_1.NotFoundException('Vehicle not found');
        const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
        if (!plant)
            throw new common_1.NotFoundException('Plant not found');
        const alreadyIn = await this.prisma.vehicleLog.findFirst({
            where: { vehicleId: dto.vehicleId, status: client_1.VehicleLogStatus.INSIDE },
        });
        if (alreadyIn)
            throw new common_1.ConflictException(`Vehicle ${vehicle.vehicleNumber} is already inside`);
        let logNumber;
        try {
            logNumber = await this.settings.getNextNumber(user.companyId, 'VEH');
        }
        catch (_a) {
            const count = await this.prisma.vehicleLog.count({ where: { companyId: user.companyId } });
            const now = new Date();
            const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
            logNumber = `VEH-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
        }
        const log = await this.prisma.vehicleLog.create({
            data: {
                logNumber,
                companyId: user.companyId,
                vehicleId: dto.vehicleId,
                plantId: dto.plantId,
                driverName: dto.driverName,
                driverMobile: dto.driverMobile,
                driverLicense: dto.driverLicense,
                purpose: dto.purpose,
                inWeight: dto.inWeight,
                materialDescription: dto.materialDescription,
                supplierName: dto.supplierName,
                customerName: dto.customerName,
                poNumber: dto.poNumber,
                remarks: dto.remarks,
                expectedExitTime: dto.expectedExitTime ? new Date(dto.expectedExitTime) : undefined,
                entryById: user.id,
                createdBy: user.id,
                updatedBy: user.id,
            },
            include: this.logIncludes(),
        });
        await this.audit.log({ tableName: 'vehicle_logs', recordId: log.id, action: 'CREATE', newValues: { logNumber, vehicleId: dto.vehicleId }, changedBy: user.id });
        return log;
    }
    async logExit(id, dto, user) {
        const log = await this.prisma.vehicleLog.findUnique({ where: { id } });
        if (!log)
            throw new common_1.NotFoundException('Vehicle log not found');
        if (log.status !== client_1.VehicleLogStatus.INSIDE)
            throw new common_1.BadRequestException('Vehicle is not currently inside');
        const netWeight = dto.outWeight && log.inWeight
            ? Math.abs(log.inWeight - dto.outWeight)
            : null;
        const updated = await this.prisma.vehicleLog.update({
            where: { id },
            data: {
                status: client_1.VehicleLogStatus.EXITED,
                exitTime: new Date(),
                outWeight: dto.outWeight,
                netWeight,
                remarks: dto.remarks || log.remarks,
                exitById: user.id,
                updatedBy: user.id,
            },
            include: this.logIncludes(),
        });
        await this.audit.log({ tableName: 'vehicle_logs', recordId: id, action: 'UPDATE', oldValues: { status: 'INSIDE' }, newValues: { status: 'EXITED', exitTime: new Date() }, changedBy: user.id });
        return updated;
    }
    async findAllLogs(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.plantId)
            where.plantId = filters.plantId;
        if (filters.status)
            where.status = filters.status;
        if (filters.purpose)
            where.purpose = filters.purpose;
        if (filters.date) {
            const d = new Date(filters.date);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            where.entryTime = { gte: d, lt: next };
        }
        return this.prisma.vehicleLog.findMany({ where, include: this.logIncludes(), orderBy: { entryTime: 'desc' } });
    }
    async getActiveVehicles(user) {
        return this.prisma.vehicleLog.findMany({
            where: { companyId: user.companyId, status: client_1.VehicleLogStatus.INSIDE },
            include: this.logIncludes(),
            orderBy: { entryTime: 'asc' },
        });
    }
    async getStats(user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const base = { companyId: user.companyId };
        const [totalVehicles, insideNow, todayIn, todayOut, totalLogs] = await Promise.all([
            this.prisma.vehicle.count({ where: base }),
            this.prisma.vehicleLog.count({ where: Object.assign(Object.assign({}, base), { status: 'INSIDE' }) }),
            this.prisma.vehicleLog.count({ where: Object.assign(Object.assign({}, base), { entryTime: { gte: today, lt: tomorrow } }) }),
            this.prisma.vehicleLog.count({ where: Object.assign(Object.assign({}, base), { status: 'EXITED', exitTime: { gte: today, lt: tomorrow } }) }),
            this.prisma.vehicleLog.count({ where: base }),
        ]);
        return { totalVehicles, insideNow, todayIn, todayOut, totalLogs };
    }
    logIncludes() {
        return {
            vehicle: { select: { id: true, vehicleNumber: true, vehicleType: true, ownerName: true } },
            plant: { select: { id: true, name: true, code: true } },
            entryBy: { select: { id: true, firstName: true, lastName: true } },
            exitBy: { select: { id: true, firstName: true, lastName: true } },
        };
    }
};
exports.VehicleManagementService = VehicleManagementService;
exports.VehicleManagementService = VehicleManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        settings_service_1.SettingsService])
], VehicleManagementService);
//# sourceMappingURL=vehicle-management.service.js.map