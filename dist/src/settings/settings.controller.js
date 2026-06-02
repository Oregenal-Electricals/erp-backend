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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const settings_service_1 = require("./settings.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const settings_dto_1 = require("./dto/settings.dto");
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    initializeSettings(user) {
        return this.settingsService.initializeDefaultSettings(user.id);
    }
    getAllSettings(category) {
        return this.settingsService.getAllSettings(category);
    }
    getSetting(key) {
        return this.settingsService.getSetting(key);
    }
    updateSetting(key, dto, user) {
        return this.settingsService.updateSetting(key, dto, user.id);
    }
    bulkUpdateSettings(dto, user) {
        return this.settingsService.bulkUpdateSettings(dto, user.id);
    }
    initializeSeries(companyId, user) {
        return this.settingsService.initializeDefaultSeries(companyId, user.id);
    }
    getAllSeries(companyId) {
        return this.settingsService.getAllSeries(companyId);
    }
    getNextNumber(companyId, documentType) {
        return this.settingsService
            .getNextNumber(companyId, documentType)
            .then((number) => ({ number, documentType, companyId }));
    }
    previewNextNumber(companyId, documentType) {
        return this.settingsService
            .previewNextNumber(companyId, documentType)
            .then((number) => ({
            preview: number,
            documentType,
            note: 'This number will be used on next generation',
        }));
    }
    getOneSeries(id) {
        return this.settingsService.getOneSeries(id);
    }
    createSeries(dto, user) {
        return this.settingsService.createSeries(dto, user.id);
    }
    updateSeries(id, dto, user) {
        return this.settingsService.updateSeries(id, dto, user.id);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Post)('system/initialize'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize default system settings' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "initializeSettings", null);
__decorate([
    (0, common_1.Get)('system'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get all system settings' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getAllSettings", null);
__decorate([
    (0, common_1.Get)('system/:key'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific setting by key' }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getSetting", null);
__decorate([
    (0, common_1.Put)('system/:key'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Update a specific setting' }),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, settings_dto_1.UpdateSystemSettingDto, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "updateSetting", null);
__decorate([
    (0, common_1.Put)('system'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk update multiple settings at once' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.BulkUpdateSettingsDto, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "bulkUpdateSettings", null);
__decorate([
    (0, common_1.Post)('numbering/initialize/:companyId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Initialize default numbering series for a company',
    }),
    __param(0, (0, common_1.Param)('companyId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "initializeSeries", null);
__decorate([
    (0, common_1.Get)('numbering'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List all numbering series' }),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: false }),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getAllSeries", null);
__decorate([
    (0, common_1.Get)('numbering/next'),
    (0, swagger_1.ApiOperation)({ summary: 'Get next document number (used by all modules)' }),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'documentType', required: true }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('documentType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getNextNumber", null);
__decorate([
    (0, common_1.Get)('numbering/preview'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Preview next number without incrementing' }),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'documentType', required: true }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('documentType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "previewNextNumber", null);
__decorate([
    (0, common_1.Get)('numbering/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get numbering series by ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getOneSeries", null);
__decorate([
    (0, common_1.Post)('numbering'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new numbering series' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.CreateNumberingSeriesDto, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "createSeries", null);
__decorate([
    (0, common_1.Put)('numbering/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Update numbering series config' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, settings_dto_1.UpdateNumberingSeriesDto, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "updateSeries", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('Settings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map