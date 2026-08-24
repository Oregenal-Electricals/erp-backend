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
exports.GateMastersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const gate_masters_service_1 = require("./gate-masters.service");
const gate_masters_dto_1 = require("./dto/gate-masters.dto");
let GateMastersController = class GateMastersController {
    constructor(service) {
        this.service = service;
    }
    createGateType(dto, req) { return this.service.createGateType(dto, req.user); }
    findAllGateTypes(req) { return this.service.findAllGateTypes(req.user); }
    updateGateType(id, dto, req) { return this.service.updateGateType(id, dto, req.user); }
    createGate(dto, req) { return this.service.createGate(dto, req.user); }
    findAllGates(req, plantId) { return this.service.findAllGates(req.user, plantId); }
    updateGate(id, dto, req) { return this.service.updateGate(id, dto, req.user); }
    createParkingArea(dto, req) { return this.service.createParkingArea(dto, req.user); }
    findAllParkingAreas(req, plantId) { return this.service.findAllParkingAreas(req.user, plantId); }
    updateParkingArea(id, dto, req) { return this.service.updateParkingArea(id, dto, req.user); }
    createParkingSlot(dto, req) { return this.service.createParkingSlot(dto, req.user); }
    findAllParkingSlots(req, parkingAreaId) { return this.service.findAllParkingSlots(req.user, parkingAreaId); }
    updateParkingSlot(id, dto, req) { return this.service.updateParkingSlot(id, dto, req.user); }
    createVisitPurpose(dto, req) { return this.service.createVisitPurpose(dto, req.user); }
    findAllVisitPurposes(req) { return this.service.findAllVisitPurposes(req.user); }
    updateVisitPurpose(id, dto, req) { return this.service.updateVisitPurpose(id, dto, req.user); }
    createGatePassTypeMaster(dto, req) { return this.service.createGatePassTypeMaster(dto, req.user); }
    findAllGatePassTypeMasters(req) { return this.service.findAllGatePassTypeMasters(req.user); }
    updateGatePassTypeMaster(id, dto, req) { return this.service.updateGatePassTypeMaster(id, dto, req.user); }
    createSecurityReason(dto, req) { return this.service.createSecurityReason(dto, req.user); }
    findAllSecurityReasons(req) { return this.service.findAllSecurityReasons(req.user); }
    updateSecurityReason(id, dto, req) { return this.service.updateSecurityReason(id, dto, req.user); }
};
exports.GateMastersController = GateMastersController;
__decorate([
    (0, common_1.Post)('gate-types'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gate_masters_dto_1.CreateGateTypeDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "createGateType", null);
__decorate([
    (0, common_1.Get)('gate-types'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "findAllGateTypes", null);
__decorate([
    (0, common_1.Put)('gate-types/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_masters_dto_1.UpdateGateTypeDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "updateGateType", null);
__decorate([
    (0, common_1.Post)('gates'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gate_masters_dto_1.CreateGateDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "createGate", null);
__decorate([
    (0, common_1.Get)('gates'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('plantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "findAllGates", null);
__decorate([
    (0, common_1.Put)('gates/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_masters_dto_1.UpdateGateDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "updateGate", null);
__decorate([
    (0, common_1.Post)('parking-areas'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PARKING_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gate_masters_dto_1.CreateParkingAreaDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "createParkingArea", null);
__decorate([
    (0, common_1.Get)('parking-areas'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('plantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "findAllParkingAreas", null);
__decorate([
    (0, common_1.Put)('parking-areas/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PARKING_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_masters_dto_1.UpdateParkingAreaDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "updateParkingArea", null);
__decorate([
    (0, common_1.Post)('parking-slots'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PARKING_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gate_masters_dto_1.CreateParkingSlotDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "createParkingSlot", null);
__decorate([
    (0, common_1.Get)('parking-slots'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('parkingAreaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "findAllParkingSlots", null);
__decorate([
    (0, common_1.Put)('parking-slots/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PARKING_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_masters_dto_1.UpdateParkingSlotDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "updateParkingSlot", null);
__decorate([
    (0, common_1.Post)('visit-purposes'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gate_masters_dto_1.CreateVisitPurposeDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "createVisitPurpose", null);
__decorate([
    (0, common_1.Get)('visit-purposes'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "findAllVisitPurposes", null);
__decorate([
    (0, common_1.Put)('visit-purposes/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_masters_dto_1.UpdateVisitPurposeDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "updateVisitPurpose", null);
__decorate([
    (0, common_1.Post)('pass-types'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gate_masters_dto_1.CreateGatePassTypeMasterDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "createGatePassTypeMaster", null);
__decorate([
    (0, common_1.Get)('pass-types'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "findAllGatePassTypeMasters", null);
__decorate([
    (0, common_1.Put)('pass-types/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_masters_dto_1.UpdateGatePassTypeMasterDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "updateGatePassTypeMaster", null);
__decorate([
    (0, common_1.Post)('security-reasons'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gate_masters_dto_1.CreateSecurityReasonDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "createSecurityReason", null);
__decorate([
    (0, common_1.Get)('security-reasons'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "findAllSecurityReasons", null);
__decorate([
    (0, common_1.Put)('security-reasons/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_MASTER_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_masters_dto_1.UpdateSecurityReasonDto, Object]),
    __metadata("design:returntype", void 0)
], GateMastersController.prototype, "updateSecurityReason", null);
exports.GateMastersController = GateMastersController = __decorate([
    (0, common_1.Controller)('gate-masters'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [gate_masters_service_1.GateMastersService])
], GateMastersController);
//# sourceMappingURL=gate-masters.controller.js.map