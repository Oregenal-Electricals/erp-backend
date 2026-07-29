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
exports.CustomFieldController = void 0;
const common_1 = require("@nestjs/common");
const custom_field_service_1 = require("./custom-field.service");
const custom_field_dto_1 = require("./dto/custom-field.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let CustomFieldController = class CustomFieldController {
    constructor(customFieldService) {
        this.customFieldService = customFieldService;
    }
    getStats(req) { return this.customFieldService.getStats(req.user); }
    getDefinitions(req, module) {
        return this.customFieldService.getDefinitions(module, req.user);
    }
    getAllDefinitions(req) {
        return this.customFieldService.getAllDefinitions(req.user);
    }
    createDefinition(dto, req) {
        return this.customFieldService.createDefinition(dto, req.user);
    }
    updateDefinition(id, dto, req) {
        return this.customFieldService.updateDefinition(id, dto, req.user);
    }
    deleteDefinition(id, req) {
        return this.customFieldService.deleteDefinition(id, req.user);
    }
    getValues(module, recordId, req) {
        return this.customFieldService.getValues(module, recordId, req.user);
    }
    saveValues(module, recordId, body, req) {
        return this.customFieldService.saveValues(module, recordId, body, req.user);
    }
};
exports.CustomFieldController = CustomFieldController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomFieldController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('definitions'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('module')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CustomFieldController.prototype, "getDefinitions", null);
__decorate([
    (0, common_1.Get)('definitions/all'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomFieldController.prototype, "getAllDefinitions", null);
__decorate([
    (0, common_1.Post)('definitions'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [custom_field_dto_1.CreateCustomFieldDefinitionDto, Object]),
    __metadata("design:returntype", void 0)
], CustomFieldController.prototype, "createDefinition", null);
__decorate([
    (0, common_1.Put)('definitions/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, custom_field_dto_1.UpdateCustomFieldDefinitionDto, Object]),
    __metadata("design:returntype", void 0)
], CustomFieldController.prototype, "updateDefinition", null);
__decorate([
    (0, common_1.Delete)('definitions/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomFieldController.prototype, "deleteDefinition", null);
__decorate([
    (0, common_1.Get)('values/:module/:recordId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    __param(0, (0, common_1.Param)('module')),
    __param(1, (0, common_1.Param)('recordId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomFieldController.prototype, "getValues", null);
__decorate([
    (0, common_1.Post)('values/:module/:recordId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    __param(0, (0, common_1.Param)('module')),
    __param(1, (0, common_1.Param)('recordId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], CustomFieldController.prototype, "saveValues", null);
exports.CustomFieldController = CustomFieldController = __decorate([
    (0, common_1.Controller)('custom-fields'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [custom_field_service_1.CustomFieldService])
], CustomFieldController);
//# sourceMappingURL=custom-field.controller.js.map