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
exports.VehicleLogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const vehicle_management_service_1 = require("./vehicle-management.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const vehicle_dto_1 = require("./dto/vehicle.dto");
let VehicleLogController = class VehicleLogController {
    constructor(service) {
        this.service = service;
    }
    logEntry(dto, user) {
        return this.service.logEntry(dto, user);
    }
    findAllLogs(user, plantId, status, purpose, date) {
        return this.service.findAllLogs(user, { plantId, status, purpose, date });
    }
    getActiveVehicles(user) {
        return this.service.getActiveVehicles(user);
    }
    logExit(id, dto, user) {
        return this.service.logExit(id, dto, user);
    }
};
exports.VehicleLogController = VehicleLogController;
__decorate([
    (0, common_1.Post)('entry'),
    (0, swagger_1.ApiOperation)({ summary: 'Log vehicle entry' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [vehicle_dto_1.LogVehicleEntryDto, Object]),
    __metadata("design:returntype", void 0)
], VehicleLogController.prototype, "logEntry", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all vehicle logs' }),
    (0, swagger_1.ApiQuery)({ name: 'plantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.VehicleLogStatus }),
    (0, swagger_1.ApiQuery)({ name: 'purpose', required: false, enum: client_1.VehiclePurpose }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('plantId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('purpose')),
    __param(4, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], VehicleLogController.prototype, "findAllLogs", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vehicles currently inside' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VehicleLogController.prototype, "getActiveVehicles", null);
__decorate([
    (0, common_1.Patch)(':id/exit'),
    (0, swagger_1.ApiOperation)({ summary: 'Log vehicle exit with out weight' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, vehicle_dto_1.LogVehicleExitDto, Object]),
    __metadata("design:returntype", void 0)
], VehicleLogController.prototype, "logExit", null);
exports.VehicleLogController = VehicleLogController = __decorate([
    (0, swagger_1.ApiTags)('Vehicle Logs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('vehicle-logs'),
    __metadata("design:paramtypes", [vehicle_management_service_1.VehicleManagementService])
], VehicleLogController);
//# sourceMappingURL=vehicle-log.controller.js.map