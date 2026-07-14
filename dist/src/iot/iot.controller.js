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
exports.IotController = void 0;
const common_1 = require("@nestjs/common");
const iot_service_1 = require("./iot.service");
const iot_dto_1 = require("./dto/iot.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let IotController = class IotController {
    constructor(iotService) {
        this.iotService = iotService;
    }
    getDashboard(req) { return this.iotService.getDashboard(req.user); }
    getAiInsights(req) { return this.iotService.getAiInsights(req.user); }
    getPredictive(req) { return this.iotService.getPredictiveInsights(req.user); }
    getMachines(req, query) { return this.iotService.findAllMachines(req.user, query); }
    getMachine(id, req) { return this.iotService.getMachine(id, req.user); }
    createMachine(dto, req) { return this.iotService.createMachine(dto, req.user); }
    updateMachine(id, dto, req) { return this.iotService.updateMachine(id, dto, req.user); }
    updateStatus(id, status, req) { return this.iotService.updateMachineStatus(id, status, req.user); }
    postReading(dto, req) { return this.iotService.postReading(dto, req.user); }
    bulkReadings(dto, req) { return this.iotService.bulkPostReadings(dto, req.user); }
    getReadings(id, query, req) { return this.iotService.getReadings(id, req.user, query); }
    getAlerts(req, query) { return this.iotService.getAlerts(req.user, query); }
    updateAlert(id, dto, req) { return this.iotService.updateAlert(id, dto, req.user); }
};
exports.IotController = IotController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.IOT_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('ai-insights'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.IOT_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "getAiInsights", null);
__decorate([
    (0, common_1.Get)('predictive'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.IOT_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "getPredictive", null);
__decorate([
    (0, common_1.Get)('machines'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.IOT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "getMachines", null);
__decorate([
    (0, common_1.Get)('machines/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.IOT_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "getMachine", null);
__decorate([
    (0, common_1.Post)('machines'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [iot_dto_1.CreateMachineDto, Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "createMachine", null);
__decorate([
    (0, common_1.Put)('machines/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "updateMachine", null);
__decorate([
    (0, common_1.Put)('machines/:id/status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('readings'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [iot_dto_1.PostReadingDto, Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "postReading", null);
__decorate([
    (0, common_1.Post)('readings/bulk'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [iot_dto_1.BulkReadingDto, Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "bulkReadings", null);
__decorate([
    (0, common_1.Get)('readings/:machineId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.IOT_VIEW),
    __param(0, (0, common_1.Param)('machineId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "getReadings", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.IOT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Put)('alerts/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, iot_dto_1.UpdateAlertDto, Object]),
    __metadata("design:returntype", void 0)
], IotController.prototype, "updateAlert", null);
exports.IotController = IotController = __decorate([
    (0, common_1.Controller)('iot'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [iot_service_1.IotService])
], IotController);
//# sourceMappingURL=iot.controller.js.map