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
exports.DispatchGateOutController = void 0;
const common_1 = require("@nestjs/common");
const dispatch_gate_out_service_1 = require("./dispatch-gate-out.service");
const dispatch_gate_out_dto_1 = require("./dto/dispatch-gate-out.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let DispatchGateOutController = class DispatchGateOutController {
    constructor(gateOutService) {
        this.gateOutService = gateOutService;
    }
    findOne(id, req) {
        return this.gateOutService.findOne(id, req.user);
    }
    confirmGateOut(dto, req) {
        return this.gateOutService.confirmGateOut(dto.dispatchConfirmationId, dto.actualVehicleNumber, req.user);
    }
};
exports.DispatchGateOutController = DispatchGateOutController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_DISPATCH_OUT_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchGateOutController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_DISPATCH_OUT_CONFIRM),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dispatch_gate_out_dto_1.ConfirmGateOutDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchGateOutController.prototype, "confirmGateOut", null);
exports.DispatchGateOutController = DispatchGateOutController = __decorate([
    (0, common_1.Controller)('dispatch-gate-out'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [dispatch_gate_out_service_1.DispatchGateOutService])
], DispatchGateOutController);
//# sourceMappingURL=dispatch-gate-out.controller.js.map