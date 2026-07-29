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
exports.ProformaInvoiceController = void 0;
const common_1 = require("@nestjs/common");
const proforma_invoice_service_1 = require("./proforma-invoice.service");
const proforma_invoice_dto_1 = require("./dto/proforma-invoice.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let ProformaInvoiceController = class ProformaInvoiceController {
    constructor(piService) {
        this.piService = piService;
    }
    getStats(req) { return this.piService.getStats(req.user); }
    findAll(req, query) { return this.piService.findAll(req.user, query); }
    findByIpo(ipoId, req) { return this.piService.findByIpo(ipoId, req.user); }
    findOne(id, req) { return this.piService.findOne(id, req.user); }
    create(dto, req) { return this.piService.create(dto, req.user); }
    update(id, dto, req) { return this.piService.update(id, dto, req.user); }
    accept(id, req) { return this.piService.accept(id, req.user); }
    reject(id, dto, req) { return this.piService.reject(id, dto, req.user); }
};
exports.ProformaInvoiceController = ProformaInvoiceController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProformaInvoiceController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PROFORMA_INVOICE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProformaInvoiceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('ipo/:ipoId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Param)('ipoId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProformaInvoiceController.prototype, "findByIpo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProformaInvoiceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [proforma_invoice_dto_1.CreateProformaInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], ProformaInvoiceController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, proforma_invoice_dto_1.UpdateProformaInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], ProformaInvoiceController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProformaInvoiceController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, proforma_invoice_dto_1.RejectPiDto, Object]),
    __metadata("design:returntype", void 0)
], ProformaInvoiceController.prototype, "reject", null);
exports.ProformaInvoiceController = ProformaInvoiceController = __decorate([
    (0, common_1.Controller)('proforma-invoices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [proforma_invoice_service_1.ProformaInvoiceService])
], ProformaInvoiceController);
//# sourceMappingURL=proforma-invoice.controller.js.map