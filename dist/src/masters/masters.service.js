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
exports.MastersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let MastersService = class MastersService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createCompany(dto, userId) {
        const exists = await this.prisma.company.findUnique({
            where: { code: dto.code },
        });
        if (exists)
            throw new common_1.ConflictException(`Company code "${dto.code}" already exists`);
        const company = await this.prisma.company.create({
            data: Object.assign(Object.assign({}, dto), { createdBy: userId, updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'companies',
            recordId: company.id,
            action: 'CREATE',
            newValues: company,
            changedBy: userId,
        });
        return company;
    }
    async findAllCompanies(includeInactive = false) {
        return this.prisma.company.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    async findOneCompany(id) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                plants: { where: { isActive: true }, orderBy: { name: 'asc' } },
                branches: { where: { isActive: true }, orderBy: { name: 'asc' } },
                departments: { where: { isActive: true }, orderBy: { name: 'asc' } },
                financialYears: { orderBy: { startDate: 'desc' } },
            },
        });
        if (!company)
            throw new common_1.NotFoundException(`Company not found`);
        return company;
    }
    async updateCompany(id, dto, userId) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company)
            throw new common_1.NotFoundException(`Company not found`);
        if (dto.code && dto.code !== company.code) {
            const dup = await this.prisma.company.findUnique({
                where: { code: dto.code },
            });
            if (dup)
                throw new common_1.ConflictException(`Company code "${dto.code}" already in use`);
        }
        const updated = await this.prisma.company.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'companies',
            recordId: id,
            action: 'UPDATE',
            oldValues: company,
            newValues: updated,
            changedBy: userId,
        });
        return updated;
    }
    async toggleCompanyStatus(id, userId) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company)
            throw new common_1.NotFoundException(`Company not found`);
        const updated = await this.prisma.company.update({
            where: { id },
            data: { isActive: !company.isActive, updatedBy: userId },
        });
        await this.audit.log({
            tableName: 'companies',
            recordId: id,
            action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
            oldValues: { isActive: company.isActive },
            newValues: { isActive: updated.isActive },
            changedBy: userId,
        });
        return updated;
    }
    async createPlant(dto, userId) {
        const company = await this.prisma.company.findUnique({
            where: { id: dto.companyId },
        });
        if (!company)
            throw new common_1.NotFoundException(`Company not found`);
        const exists = await this.prisma.plant.findUnique({
            where: { code: dto.code },
        });
        if (exists)
            throw new common_1.ConflictException(`Plant code "${dto.code}" already exists`);
        const plant = await this.prisma.plant.create({
            data: Object.assign(Object.assign({}, dto), { createdBy: userId, updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'plants',
            recordId: plant.id,
            action: 'CREATE',
            newValues: plant,
            changedBy: userId,
        });
        return plant;
    }
    async findAllPlants(companyId, includeInactive = false) {
        return this.prisma.plant.findMany({
            where: Object.assign(Object.assign({}, (companyId ? { companyId } : {})), (includeInactive ? {} : { isActive: true })),
            include: { company: { select: { id: true, name: true, code: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async findOnePlant(id) {
        const plant = await this.prisma.plant.findUnique({
            where: { id },
            include: {
                company: { select: { id: true, name: true, code: true } },
                units: { where: { isActive: true }, orderBy: { name: 'asc' } },
            },
        });
        if (!plant)
            throw new common_1.NotFoundException(`Plant not found`);
        return plant;
    }
    async updatePlant(id, dto, userId) {
        const plant = await this.prisma.plant.findUnique({ where: { id } });
        if (!plant)
            throw new common_1.NotFoundException(`Plant not found`);
        if (dto.code && dto.code !== plant.code) {
            const dup = await this.prisma.plant.findUnique({
                where: { code: dto.code },
            });
            if (dup)
                throw new common_1.ConflictException(`Plant code "${dto.code}" already in use`);
        }
        const updated = await this.prisma.plant.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'plants',
            recordId: id,
            action: 'UPDATE',
            oldValues: plant,
            newValues: updated,
            changedBy: userId,
        });
        return updated;
    }
    async togglePlantStatus(id, userId) {
        const plant = await this.prisma.plant.findUnique({ where: { id } });
        if (!plant)
            throw new common_1.NotFoundException(`Plant not found`);
        const updated = await this.prisma.plant.update({
            where: { id },
            data: { isActive: !plant.isActive, updatedBy: userId },
        });
        await this.audit.log({
            tableName: 'plants',
            recordId: id,
            action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
            oldValues: { isActive: plant.isActive },
            newValues: { isActive: updated.isActive },
            changedBy: userId,
        });
        return updated;
    }
    async createUnit(dto, userId) {
        const plant = await this.prisma.plant.findUnique({
            where: { id: dto.plantId },
        });
        if (!plant)
            throw new common_1.NotFoundException(`Plant not found`);
        const exists = await this.prisma.unit.findUnique({
            where: { code: dto.code },
        });
        if (exists)
            throw new common_1.ConflictException(`Unit code "${dto.code}" already exists`);
        const unit = await this.prisma.unit.create({
            data: Object.assign(Object.assign({}, dto), { createdBy: userId, updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'units',
            recordId: unit.id,
            action: 'CREATE',
            newValues: unit,
            changedBy: userId,
        });
        return unit;
    }
    async findAllUnits(plantId, includeInactive = false) {
        return this.prisma.unit.findMany({
            where: Object.assign(Object.assign({}, (plantId ? { plantId } : {})), (includeInactive ? {} : { isActive: true })),
            include: {
                plant: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        company: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async findOneUnit(id) {
        const unit = await this.prisma.unit.findUnique({
            where: { id },
            include: {
                plant: {
                    include: { company: { select: { id: true, name: true } } },
                },
            },
        });
        if (!unit)
            throw new common_1.NotFoundException(`Unit not found`);
        return unit;
    }
    async updateUnit(id, dto, userId) {
        const unit = await this.prisma.unit.findUnique({ where: { id } });
        if (!unit)
            throw new common_1.NotFoundException(`Unit not found`);
        if (dto.code && dto.code !== unit.code) {
            const dup = await this.prisma.unit.findUnique({
                where: { code: dto.code },
            });
            if (dup)
                throw new common_1.ConflictException(`Unit code "${dto.code}" already in use`);
        }
        const updated = await this.prisma.unit.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'units',
            recordId: id,
            action: 'UPDATE',
            oldValues: unit,
            newValues: updated,
            changedBy: userId,
        });
        return updated;
    }
    async toggleUnitStatus(id, userId) {
        const unit = await this.prisma.unit.findUnique({ where: { id } });
        if (!unit)
            throw new common_1.NotFoundException(`Unit not found`);
        const updated = await this.prisma.unit.update({
            where: { id },
            data: { isActive: !unit.isActive, updatedBy: userId },
        });
        await this.audit.log({
            tableName: 'units',
            recordId: id,
            action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
            oldValues: { isActive: unit.isActive },
            newValues: { isActive: updated.isActive },
            changedBy: userId,
        });
        return updated;
    }
    async createDepartment(dto, userId) {
        const company = await this.prisma.company.findUnique({
            where: { id: dto.companyId },
        });
        if (!company)
            throw new common_1.NotFoundException(`Company not found`);
        const exists = await this.prisma.department.findUnique({
            where: { code: dto.code },
        });
        if (exists)
            throw new common_1.ConflictException(`Department code "${dto.code}" already exists`);
        const dept = await this.prisma.department.create({
            data: Object.assign(Object.assign({}, dto), { createdBy: userId, updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'departments',
            recordId: dept.id,
            action: 'CREATE',
            newValues: dept,
            changedBy: userId,
        });
        return dept;
    }
    async findAllDepartments(companyId, includeInactive = false) {
        return this.prisma.department.findMany({
            where: Object.assign(Object.assign({}, (companyId ? { companyId } : {})), (includeInactive ? {} : { isActive: true })),
            include: { company: { select: { id: true, name: true, code: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async findOneDepartment(id) {
        const dept = await this.prisma.department.findUnique({
            where: { id },
            include: { company: { select: { id: true, name: true } } },
        });
        if (!dept)
            throw new common_1.NotFoundException(`Department not found`);
        return dept;
    }
    async updateDepartment(id, dto, userId) {
        const dept = await this.prisma.department.findUnique({ where: { id } });
        if (!dept)
            throw new common_1.NotFoundException(`Department not found`);
        if (dto.code && dto.code !== dept.code) {
            const dup = await this.prisma.department.findUnique({
                where: { code: dto.code },
            });
            if (dup)
                throw new common_1.ConflictException(`Department code "${dto.code}" already in use`);
        }
        const updated = await this.prisma.department.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'departments',
            recordId: id,
            action: 'UPDATE',
            oldValues: dept,
            newValues: updated,
            changedBy: userId,
        });
        return updated;
    }
    async toggleDepartmentStatus(id, userId) {
        const dept = await this.prisma.department.findUnique({ where: { id } });
        if (!dept)
            throw new common_1.NotFoundException(`Department not found`);
        const updated = await this.prisma.department.update({
            where: { id },
            data: { isActive: !dept.isActive, updatedBy: userId },
        });
        await this.audit.log({
            tableName: 'departments',
            recordId: id,
            action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
            oldValues: { isActive: dept.isActive },
            newValues: { isActive: updated.isActive },
            changedBy: userId,
        });
        return updated;
    }
    async createBranch(dto, userId) {
        const company = await this.prisma.company.findUnique({
            where: { id: dto.companyId },
        });
        if (!company)
            throw new common_1.NotFoundException(`Company not found`);
        const exists = await this.prisma.branch.findUnique({
            where: { code: dto.code },
        });
        if (exists)
            throw new common_1.ConflictException(`Branch code "${dto.code}" already exists`);
        const branch = await this.prisma.branch.create({
            data: Object.assign(Object.assign({}, dto), { createdBy: userId, updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'branches',
            recordId: branch.id,
            action: 'CREATE',
            newValues: branch,
            changedBy: userId,
        });
        return branch;
    }
    async findAllBranches(companyId, includeInactive = false) {
        return this.prisma.branch.findMany({
            where: Object.assign(Object.assign({}, (companyId ? { companyId } : {})), (includeInactive ? {} : { isActive: true })),
            include: { company: { select: { id: true, name: true, code: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async findOneBranch(id) {
        const branch = await this.prisma.branch.findUnique({
            where: { id },
            include: { company: { select: { id: true, name: true } } },
        });
        if (!branch)
            throw new common_1.NotFoundException(`Branch not found`);
        return branch;
    }
    async updateBranch(id, dto, userId) {
        const branch = await this.prisma.branch.findUnique({ where: { id } });
        if (!branch)
            throw new common_1.NotFoundException(`Branch not found`);
        if (dto.code && dto.code !== branch.code) {
            const dup = await this.prisma.branch.findUnique({
                where: { code: dto.code },
            });
            if (dup)
                throw new common_1.ConflictException(`Branch code "${dto.code}" already in use`);
        }
        const updated = await this.prisma.branch.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'branches',
            recordId: id,
            action: 'UPDATE',
            oldValues: branch,
            newValues: updated,
            changedBy: userId,
        });
        return updated;
    }
    async toggleBranchStatus(id, userId) {
        const branch = await this.prisma.branch.findUnique({ where: { id } });
        if (!branch)
            throw new common_1.NotFoundException(`Branch not found`);
        const updated = await this.prisma.branch.update({
            where: { id },
            data: { isActive: !branch.isActive, updatedBy: userId },
        });
        await this.audit.log({
            tableName: 'branches',
            recordId: id,
            action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
            oldValues: { isActive: branch.isActive },
            newValues: { isActive: updated.isActive },
            changedBy: userId,
        });
        return updated;
    }
    async createFinancialYear(dto, userId) {
        const company = await this.prisma.company.findUnique({
            where: { id: dto.companyId },
        });
        if (!company)
            throw new common_1.NotFoundException(`Company not found`);
        const exists = await this.prisma.financialYear.findUnique({
            where: { code: dto.code },
        });
        if (exists)
            throw new common_1.ConflictException(`Financial year code "${dto.code}" already exists`);
        const labelExists = await this.prisma.financialYear.findUnique({
            where: {
                companyId_label: { companyId: dto.companyId, label: dto.label },
            },
        });
        if (labelExists)
            throw new common_1.ConflictException(`Financial year "${dto.label}" already exists for this company`);
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        if (start >= end)
            throw new common_1.BadRequestException('startDate must be before endDate');
        const fy = await this.prisma.financialYear.create({
            data: {
                code: dto.code,
                label: dto.label,
                startDate: start,
                endDate: end,
                companyId: dto.companyId,
                createdBy: userId,
                updatedBy: userId,
            },
        });
        await this.audit.log({
            tableName: 'financial_years',
            recordId: fy.id,
            action: 'CREATE',
            newValues: fy,
            changedBy: userId,
        });
        return fy;
    }
    async findAllFinancialYears(companyId) {
        return this.prisma.financialYear.findMany({
            where: companyId ? { companyId } : {},
            include: { company: { select: { id: true, name: true, code: true } } },
            orderBy: { startDate: 'desc' },
        });
    }
    async findOneFinancialYear(id) {
        const fy = await this.prisma.financialYear.findUnique({
            where: { id },
            include: { company: { select: { id: true, name: true } } },
        });
        if (!fy)
            throw new common_1.NotFoundException(`Financial year not found`);
        return fy;
    }
    async getCurrentFinancialYear(companyId) {
        const fy = await this.prisma.financialYear.findFirst({
            where: { companyId, status: 'CURRENT' },
        });
        if (!fy)
            throw new common_1.NotFoundException(`No current financial year set for this company`);
        return fy;
    }
    async setCurrentFinancialYear(id, userId) {
        const fy = await this.prisma.financialYear.findUnique({ where: { id } });
        if (!fy)
            throw new common_1.NotFoundException(`Financial year not found`);
        if (fy.status === 'CLOSED')
            throw new common_1.BadRequestException('Cannot set a closed financial year as current');
        await this.prisma.financialYear.updateMany({
            where: { companyId: fy.companyId, status: 'CURRENT' },
            data: { status: 'OPEN', updatedBy: userId },
        });
        const updated = await this.prisma.financialYear.update({
            where: { id },
            data: { status: 'CURRENT', updatedBy: userId },
        });
        await this.audit.log({
            tableName: 'financial_years',
            recordId: id,
            action: 'UPDATE',
            oldValues: { status: fy.status },
            newValues: { status: 'CURRENT' },
            changedBy: userId,
            reason: 'Set as current financial year',
        });
        return updated;
    }
    async closeFinancialYear(id, userId) {
        const fy = await this.prisma.financialYear.findUnique({ where: { id } });
        if (!fy)
            throw new common_1.NotFoundException(`Financial year not found`);
        if (fy.status === 'CLOSED')
            throw new common_1.BadRequestException('Financial year is already closed');
        const updated = await this.prisma.financialYear.update({
            where: { id },
            data: { status: 'CLOSED', isActive: false, updatedBy: userId },
        });
        await this.audit.log({
            tableName: 'financial_years',
            recordId: id,
            action: 'UPDATE',
            oldValues: { status: fy.status },
            newValues: { status: 'CLOSED' },
            changedBy: userId,
            reason: 'Financial year closed',
        });
        return updated;
    }
};
exports.MastersService = MastersService;
exports.MastersService = MastersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], MastersService);
//# sourceMappingURL=masters.service.js.map