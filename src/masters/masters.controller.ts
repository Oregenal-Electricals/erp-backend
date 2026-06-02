import {
  Controller, Get, Post, Put, Patch, Body,
  Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { MastersService } from './masters.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { CreatePlantDto, UpdatePlantDto } from './dto/plant.dto';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { CreateFinancialYearDto, UpdateFinancialYearDto } from './dto/financial-year.dto';

@ApiTags('Masters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('masters')
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

  // ── COMPANY ──────────────────────────────────

  @Post('companies')
  @RequirePermissions(Permission.COMPANY_CREATE)
  @ApiOperation({ summary: 'Create a new company' })
  createCompany(@Body() dto: CreateCompanyDto, @CurrentUser() user: any) {
    return this.mastersService.createCompany(dto, user.id);
  }

  @Get('companies')
  @RequirePermissions(Permission.COMPANY_VIEW)
  @ApiOperation({ summary: 'List companies' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllCompanies(
    @Query('includeInactive') includeInactive?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllCompanies(includeInactive === 'true', user);
  }

  @Get('companies/:id')
  @RequirePermissions(Permission.COMPANY_VIEW)
  findOneCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneCompany(id);
  }

  @Put('companies/:id')
  @RequirePermissions(Permission.COMPANY_EDIT)
  updateCompany(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto, @CurrentUser() user: any) {
    return this.mastersService.updateCompany(id, dto, user.id);
  }

  @Patch('companies/:id/toggle-status')
  @RequirePermissions(Permission.COMPANY_EDIT)
  toggleCompanyStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.mastersService.toggleCompanyStatus(id, user.id);
  }

  // ── PLANT ────────────────────────────────────

  @Post('plants')
  @RequirePermissions(Permission.PLANT_CREATE)
  createPlant(@Body() dto: CreatePlantDto, @CurrentUser() user: any) {
    return this.mastersService.createPlant(dto, user.id);
  }

  @Get('plants')
  @RequirePermissions(Permission.PLANT_VIEW)
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllPlants(
    @Query('companyId') companyId?: string,
    @Query('includeInactive') includeInactive?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllPlants(companyId, includeInactive === 'true', user);
  }

  @Get('plants/:id')
  @RequirePermissions(Permission.PLANT_VIEW)
  findOnePlant(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOnePlant(id);
  }

  @Put('plants/:id')
  @RequirePermissions(Permission.PLANT_EDIT)
  updatePlant(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlantDto, @CurrentUser() user: any) {
    return this.mastersService.updatePlant(id, dto, user.id);
  }

  @Patch('plants/:id/toggle-status')
  @RequirePermissions(Permission.PLANT_EDIT)
  togglePlantStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.mastersService.togglePlantStatus(id, user.id);
  }

  // ── UNIT ─────────────────────────────────────

  @Post('units')
  @RequirePermissions(Permission.UNIT_CREATE)
  createUnit(@Body() dto: CreateUnitDto, @CurrentUser() user: any) {
    return this.mastersService.createUnit(dto, user.id);
  }

  @Get('units')
  @RequirePermissions(Permission.UNIT_VIEW)
  @ApiQuery({ name: 'plantId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllUnits(
    @Query('plantId') plantId?: string,
    @Query('includeInactive') includeInactive?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllUnits(plantId, includeInactive === 'true', user);
  }

  @Get('units/:id')
  @RequirePermissions(Permission.UNIT_VIEW)
  findOneUnit(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneUnit(id);
  }

  @Put('units/:id')
  @RequirePermissions(Permission.UNIT_EDIT)
  updateUnit(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUnitDto, @CurrentUser() user: any) {
    return this.mastersService.updateUnit(id, dto, user.id);
  }

  @Patch('units/:id/toggle-status')
  @RequirePermissions(Permission.UNIT_EDIT)
  toggleUnitStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.mastersService.toggleUnitStatus(id, user.id);
  }

  // ── DEPARTMENT ───────────────────────────────

  @Post('departments')
  @RequirePermissions(Permission.DEPARTMENT_CREATE)
  createDepartment(@Body() dto: CreateDepartmentDto, @CurrentUser() user: any) {
    return this.mastersService.createDepartment(dto, user.id);
  }

  @Get('departments')
  @RequirePermissions(Permission.DEPARTMENT_VIEW)
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllDepartments(
    @Query('companyId') companyId?: string,
    @Query('includeInactive') includeInactive?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllDepartments(companyId, includeInactive === 'true', user);
  }

  @Get('departments/:id')
  @RequirePermissions(Permission.DEPARTMENT_VIEW)
  findOneDepartment(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneDepartment(id);
  }

  @Put('departments/:id')
  @RequirePermissions(Permission.DEPARTMENT_EDIT)
  updateDepartment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDepartmentDto, @CurrentUser() user: any) {
    return this.mastersService.updateDepartment(id, dto, user.id);
  }

  @Patch('departments/:id/toggle-status')
  @RequirePermissions(Permission.DEPARTMENT_EDIT)
  toggleDepartmentStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.mastersService.toggleDepartmentStatus(id, user.id);
  }

  // ── BRANCH ───────────────────────────────────

  @Post('branches')
  @RequirePermissions(Permission.BRANCH_CREATE)
  createBranch(@Body() dto: CreateBranchDto, @CurrentUser() user: any) {
    return this.mastersService.createBranch(dto, user.id);
  }

  @Get('branches')
  @RequirePermissions(Permission.BRANCH_VIEW)
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllBranches(
    @Query('companyId') companyId?: string,
    @Query('includeInactive') includeInactive?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllBranches(companyId, includeInactive === 'true', user);
  }

  @Get('branches/:id')
  @RequirePermissions(Permission.BRANCH_VIEW)
  findOneBranch(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneBranch(id);
  }

  @Put('branches/:id')
  @RequirePermissions(Permission.BRANCH_EDIT)
  updateBranch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBranchDto, @CurrentUser() user: any) {
    return this.mastersService.updateBranch(id, dto, user.id);
  }

  @Patch('branches/:id/toggle-status')
  @RequirePermissions(Permission.BRANCH_EDIT)
  toggleBranchStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.mastersService.toggleBranchStatus(id, user.id);
  }

  // ── FINANCIAL YEAR ───────────────────────────

  @Post('financial-years')
  @RequirePermissions(Permission.FINANCIAL_YEAR_CREATE)
  createFinancialYear(@Body() dto: CreateFinancialYearDto, @CurrentUser() user: any) {
    return this.mastersService.createFinancialYear(dto, user.id);
  }

  @Get('financial-years')
  @RequirePermissions(Permission.FINANCIAL_YEAR_VIEW)
  @ApiQuery({ name: 'companyId', required: false })
  findAllFinancialYears(
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.mastersService.findAllFinancialYears(companyId, user);
  }

  @Get('financial-years/current/:companyId')
  @RequirePermissions(Permission.FINANCIAL_YEAR_VIEW)
  getCurrentFinancialYear(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.mastersService.getCurrentFinancialYear(companyId);
  }

  @Get('financial-years/:id')
  @RequirePermissions(Permission.FINANCIAL_YEAR_VIEW)
  findOneFinancialYear(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneFinancialYear(id);
  }

  @Patch('financial-years/:id/set-current')
  @RequirePermissions(Permission.FINANCIAL_YEAR_MANAGE)
  setCurrentFinancialYear(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.mastersService.setCurrentFinancialYear(id, user.id);
  }

  @Patch('financial-years/:id/close')
  @RequirePermissions(Permission.FINANCIAL_YEAR_MANAGE)
  closeFinancialYear(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.mastersService.closeFinancialYear(id, user.id);
  }
}
