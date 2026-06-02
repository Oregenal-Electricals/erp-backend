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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MastersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const masters_service_1 = require("./masters.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const company_dto_1 = require("./dto/company.dto");
const plant_dto_1 = require("./dto/plant.dto");
const unit_dto_1 = require("./dto/unit.dto");
const department_dto_1 = require("./dto/department.dto");
const branch_dto_1 = require("./dto/branch.dto");
const financial_year_dto_1 = require("./dto/financial-year.dto");
let MastersController = class MastersController {
    constructor(mastersService) {
        this.mastersService = mastersService;
    }
    createCompany(dto, user) {
        return this.mastersService.createCompany(dto, user.id);
    }
    findAllCompanies(includeInactive, user) {
        return this.mastersService.findAllCompanies(includeInactive === 'true', user);
    }
    findOneCompany(id) {
        return this.mastersService.findOneCompany(id);
    }
    updateCompany(id, dto, user) {
        return this.mastersService.updateCompany(id, dto, user.id);
    }
    toggleCompanyStatus(id, user) {
        return this.mastersService.toggleCompanyStatus(id, user.id);
    }
    createPlant(dto, user) {
        return this.mastersService.createPlant(dto, user.id);
    }
    findAllPlants(companyId, includeInactive, user) {
        return this.mastersService.findAllPlants(companyId, includeInactive === 'true', user);
    }
    findOnePlant(id) {
        return this.mastersService.findOnePlant(id);
    }
    updatePlant(id, dto, user) {
        return this.mastersService.updatePlant(id, dto, user.id);
    }
    togglePlantStatus(id, user) {
        return this.mastersService.togglePlantStatus(id, user.id);
    }
    createUnit(dto, user) {
        return this.mastersService.createUnit(dto, user.id);
    }
    findAllUnits(plantId, includeInactive, user) {
        return this.mastersService.findAllUnits(plantId, includeInactive === 'true', user);
    }
    findOneUnit(id) {
        return this.mastersService.findOneUnit(id);
    }
    updateUnit(id, dto, user) {
        return this.mastersService.updateUnit(id, dto, user.id);
    }
    toggleUnitStatus(id, user) {
        return this.mastersService.toggleUnitStatus(id, user.id);
    }
    createDepartment(dto, user) {
        return this.mastersService.createDepartment(dto, user.id);
    }
    findAllDepartments(companyId, includeInactive, user) {
        return this.mastersService.findAllDepartments(companyId, includeInactive === 'true', user);
    }
    findOneDepartment(id) {
        return this.mastersService.findOneDepartment(id);
    }
    updateDepartment(id, dto, user) {
        return this.mastersService.updateDepartment(id, dto, user.id);
    }
    toggleDepartmentStatus(id, user) {
        return this.mastersService.toggleDepartmentStatus(id, user.id);
    }
    createBranch(dto, user) {
        return this.mastersService.createBranch(dto, user.id);
    }
    findAllBranches(companyId, includeInactive, user) {
        return this.mastersService.findAllBranches(companyId, includeInactive === 'true', user);
    }
    findOneBranch(id) {
        return this.mastersService.findOneBranch(id);
    }
    updateBranch(id, dto, user) {
        return this.mastersService.updateBranch(id, dto, user.id);
    }
    toggleBranchStatus(id, user) {
        return this.mastersService.toggleBranchStatus(id, user.id);
    }
    createFinancialYear(dto, user) {
        return this.mastersService.createFinancialYear(dto, user.id);
    }
    findAllFinancialYears(companyId, user) {
        return this.mastersService.findAllFinancialYears(companyId, user);
    }
    getCurrentFinancialYear(companyId) {
        return this.mastersService.getCurrentFinancialYear(companyId);
    }
    findOneFinancialYear(id) {
        return this.mastersService.findOneFinancialYear(id);
    }
    setCurrentFinancialYear(id, user) {
        return this.mastersService.setCurrentFinancialYear(id, user.id);
    }
    closeFinancialYear(id, user) {
        return this.mastersService.closeFinancialYear(id, user.id);
    }
};
exports.MastersController = MastersController;
__decorate([
    (0, common_1.Post)('companies'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.COMPANY_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new company' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [company_dto_1.CreateCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "createCompany", null);
__decorate([
    (0, common_1.Get)('companies'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.COMPANY_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List companies' }),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('includeInactive')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findAllCompanies", null);
__decorate([
    (0, common_1.Get)('companies/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.COMPANY_VIEW),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findOneCompany", null);
__decorate([
    (0, common_1.Put)('companies/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.COMPANY_EDIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, company_dto_1.UpdateCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Patch)('companies/:id/toggle-status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.COMPANY_EDIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "toggleCompanyStatus", null);
__decorate([
    (0, common_1.Post)('plants'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PLANT_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [plant_dto_1.CreatePlantDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "createPlant", null);
__decorate([
    (0, common_1.Get)('plants'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PLANT_VIEW),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('includeInactive')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findAllPlants", null);
__decorate([
    (0, common_1.Get)('plants/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PLANT_VIEW),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findOnePlant", null);
__decorate([
    (0, common_1.Put)('plants/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PLANT_EDIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, plant_dto_1.UpdatePlantDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "updatePlant", null);
__decorate([
    (0, common_1.Patch)('plants/:id/toggle-status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PLANT_EDIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "togglePlantStatus", null);
__decorate([
    (0, common_1.Post)('units'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UNIT_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [unit_dto_1.CreateUnitDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "createUnit", null);
__decorate([
    (0, common_1.Get)('units'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UNIT_VIEW),
    (0, swagger_1.ApiQuery)({ name: 'plantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('plantId')),
    __param(1, (0, common_1.Query)('includeInactive')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findAllUnits", null);
__decorate([
    (0, common_1.Get)('units/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UNIT_VIEW),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findOneUnit", null);
__decorate([
    (0, common_1.Put)('units/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UNIT_EDIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, unit_dto_1.UpdateUnitDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "updateUnit", null);
__decorate([
    (0, common_1.Patch)('units/:id/toggle-status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UNIT_EDIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "toggleUnitStatus", null);
__decorate([
    (0, common_1.Post)('departments'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DEPARTMENT_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [department_dto_1.CreateDepartmentDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "createDepartment", null);
__decorate([
    (0, common_1.Get)('departments'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DEPARTMENT_VIEW),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('includeInactive')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findAllDepartments", null);
__decorate([
    (0, common_1.Get)('departments/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DEPARTMENT_VIEW),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findOneDepartment", null);
__decorate([
    (0, common_1.Put)('departments/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DEPARTMENT_EDIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, department_dto_1.UpdateDepartmentDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "updateDepartment", null);
__decorate([
    (0, common_1.Patch)('departments/:id/toggle-status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DEPARTMENT_EDIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "toggleDepartmentStatus", null);
__decorate([
    (0, common_1.Post)('branches'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.BRANCH_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [branch_dto_1.CreateBranchDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "createBranch", null);
__decorate([
    (0, common_1.Get)('branches'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.BRANCH_VIEW),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('includeInactive')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findAllBranches", null);
__decorate([
    (0, common_1.Get)('branches/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.BRANCH_VIEW),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findOneBranch", null);
__decorate([
    (0, common_1.Put)('branches/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.BRANCH_EDIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, branch_dto_1.UpdateBranchDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "updateBranch", null);
__decorate([
    (0, common_1.Patch)('branches/:id/toggle-status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.BRANCH_EDIT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "toggleBranchStatus", null);
__decorate([
    (0, common_1.Post)('financial-years'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCIAL_YEAR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [financial_year_dto_1.CreateFinancialYearDto, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "createFinancialYear", null);
__decorate([
    (0, common_1.Get)('financial-years'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCIAL_YEAR_VIEW),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: false }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findAllFinancialYears", null);
__decorate([
    (0, common_1.Get)('financial-years/current/:companyId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCIAL_YEAR_VIEW),
    __param(0, (0, common_1.Param)('companyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "getCurrentFinancialYear", null);
__decorate([
    (0, common_1.Get)('financial-years/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCIAL_YEAR_VIEW),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "findOneFinancialYear", null);
__decorate([
    (0, common_1.Patch)('financial-years/:id/set-current'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCIAL_YEAR_MANAGE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "setCurrentFinancialYear", null);
__decorate([
    (0, common_1.Patch)('financial-years/:id/close'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCIAL_YEAR_MANAGE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MastersController.prototype, "closeFinancialYear", null);
exports.MastersController = MastersController = __decorate([
    (0, swagger_1.ApiTags)('Masters'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('masters'),
    __metadata("design:paramtypes", [masters_service_1.MastersService])
], MastersController);
//# sourceMappingURL=masters.controller.js.map