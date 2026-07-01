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
exports.SupplierQualityController = void 0;
const common_1 = require("@nestjs/common");
const supplier_quality_service_1 = require("./supplier-quality.service");
const supplier_quality_dto_1 = require("./dto/supplier-quality.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let SupplierQualityController = class SupplierQualityController {
    constructor(sqService) {
        this.sqService = sqService;
    }
    getStats(req) { return this.sqService.getStats(req.user); }
    getRatings(req, query) { return this.sqService.getRatings(req.user, query); }
    getScorecard(vendorId, req) { return this.sqService.getVendorScorecard(vendorId, req.user); }
    generateRating(dto, req) { return this.sqService.generateRating(dto, req.user); }
    getCars(req, query) { return this.sqService.getCars(req.user, query); }
    createCar(dto, req) { return this.sqService.createCar(dto, req.user); }
    respondCar(id, dto, req) { return this.sqService.respondCar(id, dto, req.user); }
    verifyCar(id, dto, req) { return this.sqService.verifyCar(id, dto, req.user); }
    closeCar(id, req) { return this.sqService.closeCar(id, req.user); }
};
exports.SupplierQualityController = SupplierQualityController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SupplierQualityController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('ratings'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SupplierQualityController.prototype, "getRatings", null);
__decorate([
    (0, common_1.Get)('scorecard/:vendorId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('vendorId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SupplierQualityController.prototype, "getScorecard", null);
__decorate([
    (0, common_1.Post)('ratings'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [supplier_quality_dto_1.CreateSupplierRatingDto, Object]),
    __metadata("design:returntype", void 0)
], SupplierQualityController.prototype, "generateRating", null);
__decorate([
    (0, common_1.Get)('cars'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SupplierQualityController.prototype, "getCars", null);
__decorate([
    (0, common_1.Post)('cars'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [supplier_quality_dto_1.CreateCarDto, Object]),
    __metadata("design:returntype", void 0)
], SupplierQualityController.prototype, "createCar", null);
__decorate([
    (0, common_1.Post)('cars/:id/respond'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, supplier_quality_dto_1.RespondCarDto, Object]),
    __metadata("design:returntype", void 0)
], SupplierQualityController.prototype, "respondCar", null);
__decorate([
    (0, common_1.Post)('cars/:id/verify'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, supplier_quality_dto_1.VerifyCarDto, Object]),
    __metadata("design:returntype", void 0)
], SupplierQualityController.prototype, "verifyCar", null);
__decorate([
    (0, common_1.Post)('cars/:id/close'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SupplierQualityController.prototype, "closeCar", null);
exports.SupplierQualityController = SupplierQualityController = __decorate([
    (0, common_1.Controller)('supplier-quality'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [supplier_quality_service_1.SupplierQualityService])
], SupplierQualityController);
//# sourceMappingURL=supplier-quality.controller.js.map