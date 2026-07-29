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
exports.GatePassController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const gate_pass_service_1 = require("./gate-pass.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const gate_pass_dto_1 = require("./dto/gate-pass.dto");
let GatePassController = class GatePassController {
    constructor(service) {
        this.service = service;
    }
    create(dto, user) {
        return this.service.create(dto, user);
    }
    findAll(user, status, type, plantId, search) {
        return this.service.findAll(user, { status, type, plantId, search });
    }
    getStats(user) {
        return this.service.getStats(user);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    approve(id, dto, user) {
        return this.service.approve(id, dto, user);
    }
    issue(id, user) {
        return this.service.issue(id, user);
    }
    markReturned(id, dto, user) {
        return this.service.markReturned(id, dto, user);
    }
    close(id, user) {
        return this.service.close(id, user);
    }
    cancel(id, dto, user) {
        return this.service.cancel(id, dto, user);
    }
};
exports.GatePassController = GatePassController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create Gate Pass request' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gate_pass_dto_1.CreateGatePassDto, Object]),
    __metadata("design:returntype", void 0)
], GatePassController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_PASS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List all Gate Passes' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.GatePassStatus }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: client_1.GatePassType }),
    (0, swagger_1.ApiQuery)({ name: 'plantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('plantId')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], GatePassController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_PASS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get Gate Pass statistics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GatePassController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_PASS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get Gate Pass by ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GatePassController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_EDIT),
    (0, swagger_1.ApiOperation)({ summary: 'Approve Gate Pass' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_pass_dto_1.ApproveGatePassDto, Object]),
    __metadata("design:returntype", void 0)
], GatePassController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/issue'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_EDIT),
    (0, swagger_1.ApiOperation)({ summary: 'Issue Gate Pass (security)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GatePassController.prototype, "issue", null);
__decorate([
    (0, common_1.Patch)(':id/return'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_EDIT),
    (0, swagger_1.ApiOperation)({ summary: 'Mark items returned (RETURNABLE only)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_pass_dto_1.ReturnGatePassDto, Object]),
    __metadata("design:returntype", void 0)
], GatePassController.prototype, "markReturned", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_EDIT),
    (0, swagger_1.ApiOperation)({ summary: 'Close Gate Pass' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GatePassController.prototype, "close", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_EDIT),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel Gate Pass' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_pass_dto_1.CancelGatePassDto, Object]),
    __metadata("design:returntype", void 0)
], GatePassController.prototype, "cancel", null);
exports.GatePassController = GatePassController = __decorate([
    (0, swagger_1.ApiTags)('Gate Pass'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('gate-passes'),
    __metadata("design:paramtypes", [gate_pass_service_1.GatePassService])
], GatePassController);
//# sourceMappingURL=gate-pass.controller.js.map