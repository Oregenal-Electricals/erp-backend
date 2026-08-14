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
exports.UiControlController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const ui_control_service_1 = require("./ui-control.service");
const ui_control_dto_1 = require("./dto/ui-control.dto");
function rolesOf(user) {
    return user.allRoles || [user.role, ...(user.additionalRoles || [])].filter((v, i, a) => a.indexOf(v) === i);
}
let UiControlController = class UiControlController {
    constructor(service) {
        this.service = service;
    }
    async myVisibility(user) {
        return this.service.getEffectiveVisibility(user.companyId, user.id, rolesOf(user));
    }
    async mySidebar(user) {
        return this.service.getMySidebar(user.companyId, user.id, rolesOf(user));
    }
    async listElements(user, module) {
        return this.service.listElements(user.companyId, module);
    }
    async structure(user) {
        return this.service.getStructureTree(user.companyId);
    }
    async pageElements(user) {
        return this.service.getPageElements(user.companyId);
    }
    async sync(user, dto) {
        return this.service.syncElements(user.companyId, dto.elements, user.id);
    }
    async create(user, dto) {
        return this.service.createElement(user.companyId, dto, user.id);
    }
    async reorder(user, dto) {
        return this.service.reorderElements(dto.items, user.id);
    }
    async update(user, id, dto) {
        return this.service.updateElement(id, dto, user.id);
    }
    async remove(id) {
        return this.service.deleteElement(id);
    }
    async bulkUpsert(user, dto) {
        return this.service.bulkUpsertOverrides(user.companyId, dto.overrides, user.id);
    }
    async removeOverride(id) {
        return this.service.deleteOverride(id);
    }
};
exports.UiControlController = UiControlController;
__decorate([
    (0, common_1.Get)('my-visibility'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "myVisibility", null);
__decorate([
    (0, common_1.Get)('my-sidebar'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "mySidebar", null);
__decorate([
    (0, common_1.Get)('elements'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UI_CONTROL_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('module')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "listElements", null);
__decorate([
    (0, common_1.Get)('structure'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UI_CONTROL_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "structure", null);
__decorate([
    (0, common_1.Get)('page-elements'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UI_CONTROL_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "pageElements", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UI_CONTROL_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ui_control_dto_1.SyncElementsDto]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "sync", null);
__decorate([
    (0, common_1.Post)('elements'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UI_CONTROL_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ui_control_dto_1.CreateElementDto]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "create", null);
__decorate([
    (0, common_1.Put)('elements/reorder'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UI_CONTROL_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ui_control_dto_1.ReorderElementsDto]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "reorder", null);
__decorate([
    (0, common_1.Put)('elements/:id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UI_CONTROL_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ui_control_dto_1.UpdateElementDto]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('elements/:id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UI_CONTROL_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)('overrides'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UI_CONTROL_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ui_control_dto_1.BulkUpsertOverridesDto]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "bulkUpsert", null);
__decorate([
    (0, common_1.Delete)('overrides/:id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UI_CONTROL_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UiControlController.prototype, "removeOverride", null);
exports.UiControlController = UiControlController = __decorate([
    (0, common_1.Controller)('ui-control'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ui_control_service_1.UiControlService])
], UiControlController);
//# sourceMappingURL=ui-control.controller.js.map