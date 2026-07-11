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
exports.ShippingDocumentController = void 0;
const common_1 = require("@nestjs/common");
const shipping_document_service_1 = require("./shipping-document.service");
const shipping_document_dto_1 = require("./dto/shipping-document.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let ShippingDocumentController = class ShippingDocumentController {
    constructor(sdService) {
        this.sdService = sdService;
    }
    getStats(req) { return this.sdService.getStats(req.user); }
    findAll(req, query) { return this.sdService.findAll(req.user, query); }
    findByShipment(shipmentId, req) { return this.sdService.findByShipment(shipmentId, req.user); }
    findOne(id, req) { return this.sdService.findOne(id, req.user); }
    create(dto, req) { return this.sdService.create(dto, req.user); }
    update(id, dto, req) { return this.sdService.update(id, dto, req.user); }
    verify(id, req) { return this.sdService.verify(id, req.user); }
    surrender(id, req) { return this.sdService.surrender(id, req.user); }
};
exports.ShippingDocumentController = ShippingDocumentController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ShippingDocumentController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ShippingDocumentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('shipment/:shipmentId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Param)('shipmentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShippingDocumentController.prototype, "findByShipment", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShippingDocumentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shipping_document_dto_1.CreateShippingDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], ShippingDocumentController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shipping_document_dto_1.UpdateShippingDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], ShippingDocumentController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/verify'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShippingDocumentController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)(':id/surrender'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShippingDocumentController.prototype, "surrender", null);
exports.ShippingDocumentController = ShippingDocumentController = __decorate([
    (0, common_1.Controller)('shipping-documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [shipping_document_service_1.ShippingDocumentService])
], ShippingDocumentController);
//# sourceMappingURL=shipping-document.controller.js.map