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
exports.QuotationComparisonController = void 0;
const common_1 = require("@nestjs/common");
const quotation_comparison_service_1 = require("./quotation-comparison.service");
const comparison_dto_1 = require("./dto/comparison.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let QuotationComparisonController = class QuotationComparisonController {
    constructor(compService) {
        this.compService = compService;
    }
    getStats(req) { return this.compService.getStats(req.user); }
    getMatrix(rfqId, req) { return this.compService.getMatrix(rfqId, req.user); }
    getSummary(rfqId, req) { return this.compService.getSummary(rfqId, req.user); }
    selectVendors(rfqId, dto, req) { return this.compService.selectVendors(rfqId, dto, req.user); }
};
exports.QuotationComparisonController = QuotationComparisonController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuotationComparisonController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':rfqId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Param)('rfqId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuotationComparisonController.prototype, "getMatrix", null);
__decorate([
    (0, common_1.Get)(':rfqId/summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Param)('rfqId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuotationComparisonController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)(':rfqId/select'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_EDIT),
    __param(0, (0, common_1.Param)('rfqId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, comparison_dto_1.SelectVendorsDto, Object]),
    __metadata("design:returntype", void 0)
], QuotationComparisonController.prototype, "selectVendors", null);
exports.QuotationComparisonController = QuotationComparisonController = __decorate([
    (0, common_1.Controller)('quotation-comparison'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [quotation_comparison_service_1.QuotationComparisonService])
], QuotationComparisonController);
//# sourceMappingURL=quotation-comparison.controller.js.map