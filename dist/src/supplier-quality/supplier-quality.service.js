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
exports.SupplierQualityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let SupplierQualityService = class SupplierQualityService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    calculateScore(defectRate, onTimeDelivery, ncrCount) {
        const defectScore = Math.max(0, 100 - defectRate * 10);
        const otdScore = onTimeDelivery;
        const ncrScore = Math.max(0, 100 - ncrCount * 10);
        const score = Math.round(defectScore * 0.4 + otdScore * 0.3 + ncrScore * 0.3);
        let rating = 'A';
        if (score < 60)
            rating = 'D';
        else if (score < 75)
            rating = 'C';
        else if (score < 90)
            rating = 'B';
        return { score, rating };
    }
    async generateRating(dto, user) {
        const vendor = await this.prisma.vendor.findFirst({ where: { id: dto.vendorId, companyId: user.companyId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const ncrCount = await this.prisma.ncrRecord.count({
            where: { companyId: user.companyId, source: 'SUPPLIER', createdAt: { gte: new Date(`${dto.period.split('-')[0]}-01-01`) } },
        });
        const carCount = await this.prisma.supplierCar.count({ where: { companyId: user.companyId, vendorId: dto.vendorId } });
        const defectRate = dto.totalReceived > 0 ? Math.round(dto.totalRejected / dto.totalReceived * 100 * 100) / 100 : 0;
        const { score, rating } = this.calculateScore(defectRate, dto.onTimeDelivery || 100, ncrCount);
        let avlStatus = 'APPROVED';
        if (score < 60)
            avlStatus = 'BLACKLISTED';
        else if (score < 75)
            avlStatus = 'PROBATION';
        const existing = await this.prisma.supplierQualityRating.findUnique({
            where: { companyId_vendorId_period: { companyId: user.companyId, vendorId: dto.vendorId, period: dto.period } },
        });
        const data = {
            vendorId: dto.vendorId, period: dto.period, periodType: dto.periodType || 'MONTHLY',
            totalReceived: dto.totalReceived, totalRejected: dto.totalRejected,
            defectRate, ncrCount, carCount, onTimeDelivery: dto.onTimeDelivery || 100,
            qualityScore: score, rating, avlStatus, remarks: dto.remarks,
            companyId: user.companyId, updatedBy: user.id,
        };
        let result;
        if (existing) {
            result = await this.prisma.supplierQualityRating.update({ where: { id: existing.id }, data, include: { vendor: { select: { name: true, code: true } } } });
        }
        else {
            result = await this.prisma.supplierQualityRating.create({ data: Object.assign(Object.assign({}, data), { createdBy: user.id }), include: { vendor: { select: { name: true, code: true } } } });
        }
        await this.audit.log({ tableName: 'supplier_quality_ratings', recordId: result.id, action: 'CREATE', newValues: result, changedBy: user.id });
        return result;
    }
    async getRatings(user, query) {
        const { vendorId, period, avlStatus } = query;
        const where = { companyId: user.companyId };
        if (vendorId)
            where.vendorId = vendorId;
        if (period)
            where.period = period;
        if (avlStatus)
            where.avlStatus = avlStatus;
        const data = await this.prisma.supplierQualityRating.findMany({
            where, orderBy: [{ period: 'desc' }, { qualityScore: 'asc' }],
            include: { vendor: { select: { name: true, code: true } } },
        });
        return { data, total: data.length };
    }
    async getVendorScorecard(vendorId, user) {
        const vendor = await this.prisma.vendor.findFirst({ where: { id: vendorId, companyId: user.companyId }, select: { name: true, code: true } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const ratings = await this.prisma.supplierQualityRating.findMany({
            where: { vendorId, companyId: user.companyId }, orderBy: { period: 'desc' }, take: 12,
        });
        const cars = await this.prisma.supplierCar.findMany({
            where: { vendorId, companyId: user.companyId }, orderBy: { createdAt: 'desc' },
            include: { ncr: { select: { ncrNumber: true, severity: true } } },
        });
        return { vendor, ratings, cars, totalCars: cars.length, openCars: cars.filter(c => c.status !== 'CLOSED').length };
    }
    async createCar(dto, user) {
        const count = await this.prisma.supplierCar.count({ where: { companyId: user.companyId } });
        const year = new Date().getFullYear();
        const carNumber = `CAR-${year}-${String(count + 1).padStart(4, '0')}`;
        const car = await this.prisma.supplierCar.create({
            data: {
                carNumber, vendorId: dto.vendorId, ncrId: dto.ncrId,
                description: dto.description, severity: dto.severity || 'MAJOR',
                dueDate: new Date(dto.dueDate), remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: { vendor: { select: { name: true, code: true } }, ncr: { select: { ncrNumber: true } } },
        });
        await this.audit.log({ tableName: 'supplier_cars', recordId: car.id, action: 'CREATE', newValues: car, changedBy: user.id });
        return car;
    }
    async respondCar(id, dto, user) {
        const car = await this.prisma.supplierCar.findFirst({ where: { id, companyId: user.companyId } });
        if (!car)
            throw new common_1.NotFoundException('CAR not found');
        if (car.status !== 'SENT')
            throw new common_1.BadRequestException('CAR must be in SENT status');
        const updated = await this.prisma.supplierCar.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { status: 'RESPONDED', respondedDate: new Date(), updatedBy: user.id }),
            include: { vendor: { select: { name: true } } },
        });
        await this.audit.log({ tableName: 'supplier_cars', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async verifyCar(id, dto, user) {
        const car = await this.prisma.supplierCar.findFirst({ where: { id, companyId: user.companyId } });
        if (!car)
            throw new common_1.NotFoundException('CAR not found');
        if (car.status !== 'RESPONDED')
            throw new common_1.BadRequestException('CAR must be RESPONDED before verification');
        const updated = await this.prisma.supplierCar.update({
            where: { id },
            data: { status: 'VERIFIED', verifiedBy: user.id, verifiedDate: new Date(), remarks: dto.remarks, updatedBy: user.id },
            include: { vendor: { select: { name: true } } },
        });
        return updated;
    }
    async closeCar(id, user) {
        const car = await this.prisma.supplierCar.findFirst({ where: { id, companyId: user.companyId } });
        if (!car)
            throw new common_1.NotFoundException('CAR not found');
        if (car.status !== 'VERIFIED')
            throw new common_1.BadRequestException('CAR must be VERIFIED before closing');
        return this.prisma.supplierCar.update({
            where: { id }, data: { status: 'CLOSED', closedDate: new Date(), updatedBy: user.id },
            include: { vendor: { select: { name: true } } },
        });
    }
    async getCars(user, query) {
        const { vendorId, status } = query;
        const where = { companyId: user.companyId };
        if (vendorId)
            where.vendorId = vendorId;
        if (status)
            where.status = status;
        const data = await this.prisma.supplierCar.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: { vendor: { select: { name: true, code: true } }, ncr: { select: { ncrNumber: true, severity: true } } },
        });
        return { data, total: data.length };
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [totalRatings, totalCars, openCars, blacklisted, probation] = await Promise.all([
            this.prisma.supplierQualityRating.count({ where }),
            this.prisma.supplierCar.count({ where }),
            this.prisma.supplierCar.count({ where: Object.assign(Object.assign({}, where), { status: { in: ['SENT', 'RESPONDED'] } }) }),
            this.prisma.supplierQualityRating.count({ where: Object.assign(Object.assign({}, where), { avlStatus: 'BLACKLISTED' }) }),
            this.prisma.supplierQualityRating.count({ where: Object.assign(Object.assign({}, where), { avlStatus: 'PROBATION' }) }),
        ]);
        return { totalRatings, totalCars, openCars, blacklisted, probation };
    }
};
exports.SupplierQualityService = SupplierQualityService;
exports.SupplierQualityService = SupplierQualityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], SupplierQualityService);
//# sourceMappingURL=supplier-quality.service.js.map