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
exports.DispatchDocumentReadinessController = void 0;
const common_1 = require("@nestjs/common");
const dispatch_document_readiness_service_1 = require("./dispatch-document-readiness.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let DispatchDocumentReadinessController = class DispatchDocumentReadinessController {
    constructor(readinessService) {
        this.readinessService = readinessService;
    }
    checkReadiness(id, req) {
        return this.readinessService.checkReadiness(id, req.user);
    }
};
exports.DispatchDocumentReadinessController = DispatchDocumentReadinessController;
__decorate([
    (0, common_1.Get)(':id/document-readiness'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_DOCUMENT_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchDocumentReadinessController.prototype, "checkReadiness", null);
exports.DispatchDocumentReadinessController = DispatchDocumentReadinessController = __decorate([
    (0, common_1.Controller)('dispatch-plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [dispatch_document_readiness_service_1.DispatchDocumentReadinessService])
], DispatchDocumentReadinessController);
//# sourceMappingURL=dispatch-document-readiness.controller.js.map