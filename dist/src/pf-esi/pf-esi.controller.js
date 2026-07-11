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
exports.PfEsiController = void 0;
const common_1 = require("@nestjs/common");
const pf_esi_service_1 = require("./pf-esi.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let PfEsiController = class PfEsiController {
    constructor(pfEsiService) {
        this.pfEsiService = pfEsiService;
    }
    getRates() { return this.pfEsiService.getStatutoryRates(); }
    getPfChallan(month, year, req) {
        return this.pfEsiService.getPfChallan(Number(month), Number(year), req.user.companyId);
    }
    getEsiChallan(month, year, req) {
        return this.pfEsiService.getEsiChallan(Number(month), Number(year), req.user.companyId);
    }
    getPfRegister(year, req) {
        return this.pfEsiService.getPfRegister(req.user.companyId, Number(year) || new Date().getFullYear());
    }
    getEsiRegister(year, req) {
        return this.pfEsiService.getEsiRegister(req.user.companyId, Number(year) || new Date().getFullYear());
    }
};
exports.PfEsiController = PfEsiController;
__decorate([
    (0, common_1.Get)('rates'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PfEsiController.prototype, "getRates", null);
__decorate([
    (0, common_1.Get)('pf-challan'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PfEsiController.prototype, "getPfChallan", null);
__decorate([
    (0, common_1.Get)('esi-challan'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PfEsiController.prototype, "getEsiChallan", null);
__decorate([
    (0, common_1.Get)('pf-register'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PfEsiController.prototype, "getPfRegister", null);
__decorate([
    (0, common_1.Get)('esi-register'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PfEsiController.prototype, "getEsiRegister", null);
exports.PfEsiController = PfEsiController = __decorate([
    (0, common_1.Controller)('pf-esi'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [pf_esi_service_1.PfEsiService])
], PfEsiController);
//# sourceMappingURL=pf-esi.controller.js.map