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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const user_dto_1 = require("./dto/user.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    createUser(dto, user) {
        return this.usersService.createUser(dto, user);
    }
    findAllUsers(companyId, role, isActive, search) {
        return this.usersService.findAllUsers({
            companyId, role,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            search,
        });
    }
    changePwdInfo() {
        return { message: 'Use PATCH /users/change-password' };
    }
    findOneUser(id) {
        return this.usersService.findOneUser(id);
    }
    updateUser(id, dto, user) {
        return this.usersService.updateUser(id, dto, user);
    }
    toggleUserStatus(id, user) {
        return this.usersService.toggleUserStatus(id, user);
    }
    unlockUser(id, user) {
        return this.usersService.unlockUser(id, user);
    }
    resetPassword(id, dto, user) {
        return this.usersService.resetPassword(id, dto, user);
    }
    changePassword(dto, user) {
        return this.usersService.changePassword(user.id, dto);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.USER_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.USER_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List all users with filters' }),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false, enum: client_1.UserRole }),
    (0, swagger_1.ApiQuery)({ name: 'isActive', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('role')),
    __param(2, (0, common_1.Query)('isActive')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAllUsers", null);
__decorate([
    (0, common_1.Get)('change-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Placeholder — use PATCH below' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changePwdInfo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.USER_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOneUser", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.USER_EDIT),
    (0, swagger_1.ApiOperation)({ summary: 'Update user profile and role' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.USER_TOGGLE_STATUS),
    (0, swagger_1.ApiOperation)({ summary: 'Activate or deactivate user' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "toggleUserStatus", null);
__decorate([
    (0, common_1.Patch)(':id/unlock'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.USER_UNLOCK),
    (0, swagger_1.ApiOperation)({ summary: 'Unlock a locked user account' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "unlockUser", null);
__decorate([
    (0, common_1.Patch)(':id/reset-password'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.USER_RESET_PASSWORD),
    (0, swagger_1.ApiOperation)({ summary: 'Admin resets password for a user' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.ResetPasswordDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Patch)('change-password'),
    (0, swagger_1.ApiOperation)({ summary: 'User changes own password' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changePassword", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map