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
exports.MrpController = void 0;
const common_1 = require("@nestjs/common");
const mrp_service_1 = require("./mrp.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let MrpController = class MrpController {
    constructor(mrpService) {
        this.mrpService = mrpService;
    }
    calculate(woId, req) { return this.mrpService.calculateMrp(woId, req.user); }
    shortageReport(req) { return this.mrpService.getShortageReport(req.user); }
    materialPlan(req, query) { return this.mrpService.getMaterialPlan(req.user, query); }
};
exports.MrpController = MrpController;
__decorate([
    (0, common_1.Get)('calculate/:woId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MRP_VIEW),
    __param(0, (0, common_1.Param)('woId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MrpController.prototype, "calculate", null);
__decorate([
    (0, common_1.Get)('shortage-report'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MRP_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MrpController.prototype, "shortageReport", null);
__decorate([
    (0, common_1.Get)('material-plan'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MRP_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MrpController.prototype, "materialPlan", null);
exports.MrpController = MrpController = __decorate([
    (0, common_1.Controller)('mrp'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [mrp_service_1.MrpService])
], MrpController);
//# sourceMappingURL=mrp.controller.js.map