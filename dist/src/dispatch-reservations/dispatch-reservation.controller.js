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
exports.DispatchReservationController = void 0;
const common_1 = require("@nestjs/common");
const dispatch_reservation_service_1 = require("./dispatch-reservation.service");
const dispatch_reservation_dto_1 = require("./dto/dispatch-reservation.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let DispatchReservationController = class DispatchReservationController {
    constructor(drService) {
        this.drService = drService;
    }
    findByPlanItem(dispatchPlanItemId, req) {
        return this.drService.findByPlanItem(dispatchPlanItemId, req.user);
    }
    findOne(reservationNumber, req) {
        return this.drService.findOne(reservationNumber, req.user);
    }
    reserve(dto, req) {
        return this.drService.reserve(dto.dispatchPlanItemId, dto.requestedQty, req.user);
    }
    release(reservationNumber, dto, req) {
        return this.drService.release(reservationNumber, dto.releaseQty, dto.reason, req.user);
    }
};
exports.DispatchReservationController = DispatchReservationController;
__decorate([
    (0, common_1.Get)('by-plan-item/:dispatchPlanItemId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_RESERVATION_VIEW),
    __param(0, (0, common_1.Param)('dispatchPlanItemId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchReservationController.prototype, "findByPlanItem", null);
__decorate([
    (0, common_1.Get)(':reservationNumber'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_RESERVATION_VIEW),
    __param(0, (0, common_1.Param)('reservationNumber')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchReservationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_RESERVATION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dispatch_reservation_dto_1.CreateReservationDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchReservationController.prototype, "reserve", null);
__decorate([
    (0, common_1.Post)(':reservationNumber/release'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_RESERVATION_RELEASE),
    __param(0, (0, common_1.Param)('reservationNumber')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_reservation_dto_1.ReleaseReservationDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchReservationController.prototype, "release", null);
exports.DispatchReservationController = DispatchReservationController = __decorate([
    (0, common_1.Controller)('dispatch-reservations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [dispatch_reservation_service_1.DispatchReservationService])
], DispatchReservationController);
//# sourceMappingURL=dispatch-reservation.controller.js.map