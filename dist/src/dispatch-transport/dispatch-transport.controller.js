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
exports.DispatchTransportController = void 0;
const common_1 = require("@nestjs/common");
const dispatch_transport_service_1 = require("./dispatch-transport.service");
const dispatch_transport_dto_1 = require("./dto/dispatch-transport.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let DispatchTransportController = class DispatchTransportController {
    constructor(transportService) {
        this.transportService = transportService;
    }
    findOne(id, req) {
        return this.transportService.findOne(id, req.user);
    }
    checkReadyForLoading(id, req) {
        return this.transportService.checkReadyForLoading(id, req.user);
    }
    createAssignment(dto, req) {
        return this.transportService.createAssignment(dto, req.user);
    }
    assignPackage(id, dto, req) {
        return this.transportService.assignPackage(id, dto.packageId, req.user);
    }
    unassignPackage(id, packageId, req) {
        return this.transportService.unassignPackage(id, packageId, req.user);
    }
    confirmAssignment(id, req) {
        return this.transportService.confirmAssignment(id, req.user);
    }
    reassignVehicle(id, dto, req) {
        return this.transportService.reassignVehicle(id, dto, req.user);
    }
    cancelAssignment(id, dto, req) {
        return this.transportService.cancelAssignment(id, dto.reason, req.user);
    }
};
exports.DispatchTransportController = DispatchTransportController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_TRANSPORT_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchTransportController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/ready-for-loading'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_TRANSPORT_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchTransportController.prototype, "checkReadyForLoading", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_TRANSPORT_ASSIGN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dispatch_transport_dto_1.CreateTransportAssignmentDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchTransportController.prototype, "createAssignment", null);
__decorate([
    (0, common_1.Post)(':id/packages'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_TRANSPORT_ASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_transport_dto_1.AssignPackageDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchTransportController.prototype, "assignPackage", null);
__decorate([
    (0, common_1.Post)(':id/packages/:packageId/unassign'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_TRANSPORT_REASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('packageId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], DispatchTransportController.prototype, "unassignPackage", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_TRANSPORT_ASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchTransportController.prototype, "confirmAssignment", null);
__decorate([
    (0, common_1.Post)(':id/reassign-vehicle'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_TRANSPORT_REASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_transport_dto_1.ReassignVehicleDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchTransportController.prototype, "reassignVehicle", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_TRANSPORT_CANCEL),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_transport_dto_1.CancelAssignmentDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchTransportController.prototype, "cancelAssignment", null);
exports.DispatchTransportController = DispatchTransportController = __decorate([
    (0, common_1.Controller)('dispatch-transport'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [dispatch_transport_service_1.DispatchTransportService])
], DispatchTransportController);
//# sourceMappingURL=dispatch-transport.controller.js.map