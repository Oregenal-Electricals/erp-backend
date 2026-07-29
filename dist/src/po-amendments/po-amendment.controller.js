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
exports.PoAmendmentController = void 0;
const common_1 = require("@nestjs/common");
const po_amendment_service_1 = require("./po-amendment.service");
const po_amendment_dto_1 = require("./dto/po-amendment.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let PoAmendmentController = class PoAmendmentController {
    constructor(poAmendmentService) {
        this.poAmendmentService = poAmendmentService;
    }
    getStats(req) { return this.poAmendmentService.getStats(req.user); }
    findAll(req, query) { return this.poAmendmentService.findAll(req.user, query); }
    findByPo(poId, req) { return this.poAmendmentService.findByPo(poId, req.user); }
    findOne(id, req) { return this.poAmendmentService.findOne(id, req.user); }
    create(dto, req) { return this.poAmendmentService.create(dto, req.user); }
    submit(id, req) { return this.poAmendmentService.submit(id, req.user); }
    approve(id, req) { return this.poAmendmentService.approve(id, req.user); }
    reject(id, dto, req) { return this.poAmendmentService.reject(id, dto, req.user); }
};
exports.PoAmendmentController = PoAmendmentController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PoAmendmentController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PO_AMENDMENT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PoAmendmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('po/:poId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Param)('poId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PoAmendmentController.prototype, "findByPo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PoAmendmentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [po_amendment_dto_1.CreatePoAmendmentDto, Object]),
    __metadata("design:returntype", void 0)
], PoAmendmentController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PoAmendmentController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PoAmendmentController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, po_amendment_dto_1.RejectAmendmentDto, Object]),
    __metadata("design:returntype", void 0)
], PoAmendmentController.prototype, "reject", null);
exports.PoAmendmentController = PoAmendmentController = __decorate([
    (0, common_1.Controller)('po-amendments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [po_amendment_service_1.PoAmendmentService])
], PoAmendmentController);
//# sourceMappingURL=po-amendment.controller.js.map