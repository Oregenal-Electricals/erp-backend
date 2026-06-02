import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { CreatePlantDto, UpdatePlantDto } from './dto/plant.dto';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import {
  CreateFinancialYearDto,
  UpdateFinancialYearDto,
} from './dto/financial-year.dto';

@Injectable()
export class MastersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // COMPANY
  // ─────────────────────────────────────────────────────────

  async createCompany(dto: CreateCompanyDto, userId: string) {
    const exists = await this.prisma.company.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(`Company code "${dto.code}" already exists`);

    const company = await this.prisma.company.create({
      data: { ...dto, createdBy: userId, updatedBy: userId },
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

  async findOneCompany(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        plants: { where: { isActive: true }, orderBy: { name: 'asc' } },
        branches: { where: { isActive: true }, orderBy: { name: 'asc' } },
        departments: { where: { isActive: true }, orderBy: { name: 'asc' } },
        financialYears: { orderBy: { startDate: 'desc' } },
      },
    });
    if (!company) throw new NotFoundException(`Company not found`);
    return company;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto, userId: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException(`Company not found`);

    if (dto.code && dto.code !== company.code) {
      const dup = await this.prisma.company.findUnique({
        where: { code: dto.code },
      });
      if (dup)
        throw new ConflictException(
          `Company code "${dto.code}" already in use`,
        );
    }

    const updated = await this.prisma.company.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
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

  async toggleCompanyStatus(id: string, userId: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException(`Company not found`);

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

  // ─────────────────────────────────────────────────────────
  // PLANT
  // ─────────────────────────────────────────────────────────

  async createPlant(dto: CreatePlantDto, userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException(`Company not found`);

    const exists = await this.prisma.plant.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(`Plant code "${dto.code}" already exists`);

    const plant = await this.prisma.plant.create({
      data: { ...dto, createdBy: userId, updatedBy: userId },
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

  async findAllPlants(companyId?: string, includeInactive = false) {
    return this.prisma.plant.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: { company: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOnePlant(id: string) {
    const plant = await this.prisma.plant.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, code: true } },
        units: { where: { isActive: true }, orderBy: { name: 'asc' } },
      },
    });
    if (!plant) throw new NotFoundException(`Plant not found`);
    return plant;
  }

  async updatePlant(id: string, dto: UpdatePlantDto, userId: string) {
    const plant = await this.prisma.plant.findUnique({ where: { id } });
    if (!plant) throw new NotFoundException(`Plant not found`);

    if (dto.code && dto.code !== plant.code) {
      const dup = await this.prisma.plant.findUnique({
        where: { code: dto.code },
      });
      if (dup)
        throw new ConflictException(`Plant code "${dto.code}" already in use`);
    }

    const updated = await this.prisma.plant.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
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

  async togglePlantStatus(id: string, userId: string) {
    const plant = await this.prisma.plant.findUnique({ where: { id } });
    if (!plant) throw new NotFoundException(`Plant not found`);

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

  // ─────────────────────────────────────────────────────────
  // UNIT
  // ─────────────────────────────────────────────────────────

  async createUnit(dto: CreateUnitDto, userId: string) {
    const plant = await this.prisma.plant.findUnique({
      where: { id: dto.plantId },
    });
    if (!plant) throw new NotFoundException(`Plant not found`);

    const exists = await this.prisma.unit.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(`Unit code "${dto.code}" already exists`);

    const unit = await this.prisma.unit.create({
      data: { ...dto, createdBy: userId, updatedBy: userId },
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

  async findAllUnits(plantId?: string, includeInactive = false) {
    return this.prisma.unit.findMany({
      where: {
        ...(plantId ? { plantId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
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

  async findOneUnit(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        plant: {
          include: { company: { select: { id: true, name: true } } },
        },
      },
    });
    if (!unit) throw new NotFoundException(`Unit not found`);
    return unit;
  }

  async updateUnit(id: string, dto: UpdateUnitDto, userId: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException(`Unit not found`);

    if (dto.code && dto.code !== unit.code) {
      const dup = await this.prisma.unit.findUnique({
        where: { code: dto.code },
      });
      if (dup)
        throw new ConflictException(`Unit code "${dto.code}" already in use`);
    }

    const updated = await this.prisma.unit.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
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

  async toggleUnitStatus(id: string, userId: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException(`Unit not found`);

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

  // ─────────────────────────────────────────────────────────
  // DEPARTMENT
  // ─────────────────────────────────────────────────────────

  async createDepartment(dto: CreateDepartmentDto, userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException(`Company not found`);

    const exists = await this.prisma.department.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(
        `Department code "${dto.code}" already exists`,
      );

    const dept = await this.prisma.department.create({
      data: { ...dto, createdBy: userId, updatedBy: userId },
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

  async findAllDepartments(companyId?: string, includeInactive = false) {
    return this.prisma.department.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: { company: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOneDepartment(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true } } },
    });
    if (!dept) throw new NotFoundException(`Department not found`);
    return dept;
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto, userId: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException(`Department not found`);

    if (dto.code && dto.code !== dept.code) {
      const dup = await this.prisma.department.findUnique({
        where: { code: dto.code },
      });
      if (dup)
        throw new ConflictException(
          `Department code "${dto.code}" already in use`,
        );
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
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

  async toggleDepartmentStatus(id: string, userId: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException(`Department not found`);

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

  // ─────────────────────────────────────────────────────────
  // BRANCH
  // ─────────────────────────────────────────────────────────

  async createBranch(dto: CreateBranchDto, userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException(`Company not found`);

    const exists = await this.prisma.branch.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(`Branch code "${dto.code}" already exists`);

    const branch = await this.prisma.branch.create({
      data: { ...dto, createdBy: userId, updatedBy: userId },
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

  async findAllBranches(companyId?: string, includeInactive = false) {
    return this.prisma.branch.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: { company: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOneBranch(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true } } },
    });
    if (!branch) throw new NotFoundException(`Branch not found`);
    return branch;
  }

  async updateBranch(id: string, dto: UpdateBranchDto, userId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException(`Branch not found`);

    if (dto.code && dto.code !== branch.code) {
      const dup = await this.prisma.branch.findUnique({
        where: { code: dto.code },
      });
      if (dup)
        throw new ConflictException(`Branch code "${dto.code}" already in use`);
    }

    const updated = await this.prisma.branch.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
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

  async toggleBranchStatus(id: string, userId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException(`Branch not found`);

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

  // ─────────────────────────────────────────────────────────
  // FINANCIAL YEAR
  // ─────────────────────────────────────────────────────────

  async createFinancialYear(dto: CreateFinancialYearDto, userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException(`Company not found`);

    const exists = await this.prisma.financialYear.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(
        `Financial year code "${dto.code}" already exists`,
      );

    const labelExists = await this.prisma.financialYear.findUnique({
      where: {
        companyId_label: { companyId: dto.companyId, label: dto.label },
      },
    });
    if (labelExists)
      throw new ConflictException(
        `Financial year "${dto.label}" already exists for this company`,
      );

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end)
      throw new BadRequestException('startDate must be before endDate');

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

  async findAllFinancialYears(companyId?: string) {
    return this.prisma.financialYear.findMany({
      where: companyId ? { companyId } : {},
      include: { company: { select: { id: true, name: true, code: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOneFinancialYear(id: string) {
    const fy = await this.prisma.financialYear.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true } } },
    });
    if (!fy) throw new NotFoundException(`Financial year not found`);
    return fy;
  }

  async getCurrentFinancialYear(companyId: string) {
    const fy = await this.prisma.financialYear.findFirst({
      where: { companyId, status: 'CURRENT' },
    });
    if (!fy)
      throw new NotFoundException(
        `No current financial year set for this company`,
      );
    return fy;
  }

  async setCurrentFinancialYear(id: string, userId: string) {
    const fy = await this.prisma.financialYear.findUnique({ where: { id } });
    if (!fy) throw new NotFoundException(`Financial year not found`);
    if (fy.status === 'CLOSED')
      throw new BadRequestException(
        'Cannot set a closed financial year as current',
      );

    // Remove CURRENT from all other FYs of same company
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

  async closeFinancialYear(id: string, userId: string) {
    const fy = await this.prisma.financialYear.findUnique({ where: { id } });
    if (!fy) throw new NotFoundException(`Financial year not found`);
    if (fy.status === 'CLOSED')
      throw new BadRequestException('Financial year is already closed');

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
}
