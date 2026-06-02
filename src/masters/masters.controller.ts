import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { MastersService } from './masters.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { CreatePlantDto, UpdatePlantDto } from './dto/plant.dto';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import {
  CreateFinancialYearDto,
  UpdateFinancialYearDto,
} from './dto/financial-year.dto';

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.CORPORATE_ADMIN];

@ApiTags('Masters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('masters')
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

  // ─────────────────────────────────────────────────────────
  // COMPANY
  // ─────────────────────────────────────────────────────────

  @Post('companies')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a new company' })
  createCompany(@Body() dto: CreateCompanyDto, @CurrentUser() user: any) {
    return this.mastersService.createCompany(dto, user.id);
  }

  @Get('companies')
  @ApiOperation({ summary: 'List all companies' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllCompanies(@Query('includeInactive') includeInactive?: string) {
    return this.mastersService.findAllCompanies(includeInactive === 'true');
  }

  @Get('companies/:id')
  @ApiOperation({
    summary: 'Get company by ID (includes plants, branches, departments)',
  })
  findOneCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneCompany(id);
  }

  @Put('companies/:id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update company' })
  updateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.updateCompany(id, dto, user.id);
  }

  @Patch('companies/:id/toggle-status')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate company' })
  toggleCompanyStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.toggleCompanyStatus(id, user.id);
  }

  // ─────────────────────────────────────────────────────────
  // PLANT
  // ─────────────────────────────────────────────────────────

  @Post('plants')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a new plant' })
  createPlant(@Body() dto: CreatePlantDto, @CurrentUser() user: any) {
    return this.mastersService.createPlant(dto, user.id);
  }

  @Get('plants')
  @ApiOperation({ summary: 'List all plants' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllPlants(
    @Query('companyId') companyId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.mastersService.findAllPlants(
      companyId,
      includeInactive === 'true',
    );
  }

  @Get('plants/:id')
  @ApiOperation({ summary: 'Get plant by ID (includes units)' })
  findOnePlant(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOnePlant(id);
  }

  @Put('plants/:id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update plant' })
  updatePlant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlantDto,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.updatePlant(id, dto, user.id);
  }

  @Patch('plants/:id/toggle-status')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Activate or deactivate plant' })
  togglePlantStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.togglePlantStatus(id, user.id);
  }

  // ─────────────────────────────────────────────────────────
  // UNIT
  // ─────────────────────────────────────────────────────────

  @Post('units')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a new unit' })
  createUnit(@Body() dto: CreateUnitDto, @CurrentUser() user: any) {
    return this.mastersService.createUnit(dto, user.id);
  }

  @Get('units')
  @ApiOperation({ summary: 'List all units' })
  @ApiQuery({ name: 'plantId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllUnits(
    @Query('plantId') plantId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.mastersService.findAllUnits(
      plantId,
      includeInactive === 'true',
    );
  }

  @Get('units/:id')
  @ApiOperation({ summary: 'Get unit by ID' })
  findOneUnit(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneUnit(id);
  }

  @Put('units/:id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update unit' })
  updateUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitDto,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.updateUnit(id, dto, user.id);
  }

  @Patch('units/:id/toggle-status')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Activate or deactivate unit' })
  toggleUnitStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.toggleUnitStatus(id, user.id);
  }

  // ─────────────────────────────────────────────────────────
  // DEPARTMENT
  // ─────────────────────────────────────────────────────────

  @Post('departments')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a new department' })
  createDepartment(@Body() dto: CreateDepartmentDto, @CurrentUser() user: any) {
    return this.mastersService.createDepartment(dto, user.id);
  }

  @Get('departments')
  @ApiOperation({ summary: 'List all departments' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllDepartments(
    @Query('companyId') companyId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.mastersService.findAllDepartments(
      companyId,
      includeInactive === 'true',
    );
  }

  @Get('departments/:id')
  @ApiOperation({ summary: 'Get department by ID' })
  findOneDepartment(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneDepartment(id);
  }

  @Put('departments/:id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update department' })
  updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.updateDepartment(id, dto, user.id);
  }

  @Patch('departments/:id/toggle-status')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Activate or deactivate department' })
  toggleDepartmentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.toggleDepartmentStatus(id, user.id);
  }

  // ─────────────────────────────────────────────────────────
  // BRANCH
  // ─────────────────────────────────────────────────────────

  @Post('branches')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a new branch' })
  createBranch(@Body() dto: CreateBranchDto, @CurrentUser() user: any) {
    return this.mastersService.createBranch(dto, user.id);
  }

  @Get('branches')
  @ApiOperation({ summary: 'List all branches' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllBranches(
    @Query('companyId') companyId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.mastersService.findAllBranches(
      companyId,
      includeInactive === 'true',
    );
  }

  @Get('branches/:id')
  @ApiOperation({ summary: 'Get branch by ID' })
  findOneBranch(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneBranch(id);
  }

  @Put('branches/:id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update branch' })
  updateBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.updateBranch(id, dto, user.id);
  }

  @Patch('branches/:id/toggle-status')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Activate or deactivate branch' })
  toggleBranchStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.toggleBranchStatus(id, user.id);
  }

  // ─────────────────────────────────────────────────────────
  // FINANCIAL YEAR
  // ─────────────────────────────────────────────────────────

  @Post('financial-years')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a new financial year' })
  createFinancialYear(
    @Body() dto: CreateFinancialYearDto,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.createFinancialYear(dto, user.id);
  }

  @Get('financial-years')
  @ApiOperation({ summary: 'List all financial years' })
  @ApiQuery({ name: 'companyId', required: false })
  findAllFinancialYears(@Query('companyId') companyId?: string) {
    return this.mastersService.findAllFinancialYears(companyId);
  }

  @Get('financial-years/current/:companyId')
  @ApiOperation({ summary: 'Get current financial year for a company' })
  getCurrentFinancialYear(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    return this.mastersService.getCurrentFinancialYear(companyId);
  }

  @Get('financial-years/:id')
  @ApiOperation({ summary: 'Get financial year by ID' })
  findOneFinancialYear(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneFinancialYear(id);
  }

  @Patch('financial-years/:id/set-current')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({
    summary:
      'Set financial year as current (only one can be current per company)',
  })
  setCurrentFinancialYear(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.setCurrentFinancialYear(id, user.id);
  }

  @Patch('financial-years/:id/close')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Close a financial year permanently' })
  closeFinancialYear(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.mastersService.closeFinancialYear(id, user.id);
  }
}
