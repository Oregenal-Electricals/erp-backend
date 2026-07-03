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
exports.PdfEngineController = void 0;
const common_1 = require("@nestjs/common");
const pdf_engine_service_1 = require("./pdf-engine.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let PdfEngineController = class PdfEngineController {
    constructor(pdfService) {
        this.pdfService = pdfService;
    }
    async poPdf(id, req, res) {
        const pdf = await this.pdfService.generatePurchaseOrderPdf(id, req.user.companyId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="PO-${id}.pdf"`);
        res.send(pdf);
    }
    async invoicePdf(id, req, res) {
        const pdf = await this.pdfService.generateArInvoicePdf(id, req.user.companyId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="INV-${id}.pdf"`);
        res.send(pdf);
    }
    async dispatchPdf(id, req, res) {
        const pdf = await this.pdfService.generateDispatchPdf(id, req.user.companyId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="CHALLAN-${id}.pdf"`);
        res.send(pdf);
    }
    async ncrPdf(id, req, res) {
        const pdf = await this.pdfService.generateNcrPdf(id, req.user.companyId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="NCR-${id}.pdf"`);
        res.send(pdf);
    }
};
exports.PdfEngineController = PdfEngineController;
__decorate([
    (0, common_1.Get)('purchase-order/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PdfEngineController.prototype, "poPdf", null);
__decorate([
    (0, common_1.Get)('invoice/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PdfEngineController.prototype, "invoicePdf", null);
__decorate([
    (0, common_1.Get)('dispatch/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PdfEngineController.prototype, "dispatchPdf", null);
__decorate([
    (0, common_1.Get)('ncr/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PdfEngineController.prototype, "ncrPdf", null);
exports.PdfEngineController = PdfEngineController = __decorate([
    (0, common_1.Controller)('pdf'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [pdf_engine_service_1.PdfEngineService])
], PdfEngineController);
//# sourceMappingURL=pdf-engine.controller.js.map