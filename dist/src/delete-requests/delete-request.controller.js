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
exports.DeleteRequestController = void 0;
const common_1 = require("@nestjs/common");
const delete_request_service_1 = require("./delete-request.service");
const delete_request_dto_1 = require("./dto/delete-request.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let DeleteRequestController = class DeleteRequestController {
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        return this.service.create(dto.tableName, dto.recordId, dto.reason, req.user);
    }
    listPending(req) {
        return this.service.listPending(req.user);
    }
    listMine(req) {
        return this.service.listMine(req.user);
    }
    approve(id, req) {
        return this.service.approve(id, req.user);
    }
    reject(id, dto, req) {
        return this.service.reject(id, req.user, dto.comments);
    }
};
exports.DeleteRequestController = DeleteRequestController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delete_request_dto_1.CreateDeleteRequestDto, Object]),
    __metadata("design:returntype", void 0)
], DeleteRequestController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DELETE_APPROVE),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeleteRequestController.prototype, "listPending", null);
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeleteRequestController.prototype, "listMine", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DELETE_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DeleteRequestController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DELETE_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, delete_request_dto_1.RejectDeleteRequestDto, Object]),
    __metadata("design:returntype", void 0)
], DeleteRequestController.prototype, "reject", null);
exports.DeleteRequestController = DeleteRequestController = __decorate([
    (0, common_1.Controller)('delete-requests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [delete_request_service_1.DeleteRequestService])
], DeleteRequestController);
//# sourceMappingURL=delete-request.controller.js.map