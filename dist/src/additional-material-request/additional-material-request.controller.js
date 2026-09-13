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
exports.AdditionalMaterialRequestController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const additional_material_request_service_1 = require("./additional-material-request.service");
const additional_material_request_dto_1 = require("./dto/additional-material-request.dto");
let AdditionalMaterialRequestController = class AdditionalMaterialRequestController {
    constructor(service) {
        this.service = service;
    }
    findPending(req) {
        return this.service.findPending(req.user);
    }
    findForWorkOrder(workOrderId, req) {
        return this.service.findForWorkOrder(workOrderId, req.user);
    }
    getOriginalRemaining(workOrderId, itemCode, req) {
        return this.service.getOriginalRemaining(workOrderId, itemCode, req.user);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user);
    }
    request(dto, req) {
        return this.service.request(dto, req.user);
    }
    decide(id, dto, req) {
        return this.service.decide(id, dto, req.user);
    }
    revoke(id, req) {
        return this.service.revoke(id, req.user);
    }
};
exports.AdditionalMaterialRequestController = AdditionalMaterialRequestController;
__decorate([
    (0, common_1.Get)('pending'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdditionalMaterialRequestController.prototype, "findPending", null);
__decorate([
    (0, common_1.Get)('work-order/:workOrderId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('workOrderId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdditionalMaterialRequestController.prototype, "findForWorkOrder", null);
__decorate([
    (0, common_1.Get)('remaining/:workOrderId/:itemCode'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('workOrderId')),
    __param(1, (0, common_1.Param)('itemCode')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AdditionalMaterialRequestController.prototype, "getOriginalRemaining", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdditionalMaterialRequestController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.ADDITIONAL_MATERIAL_REQUEST),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [additional_material_request_dto_1.RequestAdditionalMaterialDto, Object]),
    __metadata("design:returntype", void 0)
], AdditionalMaterialRequestController.prototype, "request", null);
__decorate([
    (0, common_1.Post)(':id/decide'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.ADDITIONAL_MATERIAL_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, additional_material_request_dto_1.DecideAdditionalMaterialDto, Object]),
    __metadata("design:returntype", void 0)
], AdditionalMaterialRequestController.prototype, "decide", null);
__decorate([
    (0, common_1.Post)(':id/revoke'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.ADDITIONAL_MATERIAL_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdditionalMaterialRequestController.prototype, "revoke", null);
exports.AdditionalMaterialRequestController = AdditionalMaterialRequestController = __decorate([
    (0, common_1.Controller)('production/additional-material-requests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [additional_material_request_service_1.AdditionalMaterialRequestService])
], AdditionalMaterialRequestController);
//# sourceMappingURL=additional-material-request.controller.js.map