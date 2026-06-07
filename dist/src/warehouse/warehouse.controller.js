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
exports.WarehouseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const warehouse_service_1 = require("./warehouse.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const warehouse_dto_1 = require("./dto/warehouse.dto");
let WarehouseController = class WarehouseController {
    constructor(service) {
        this.service = service;
    }
    create(dto, user) {
        return this.service.createWarehouse(dto, user);
    }
    findAll(user, plantId) {
        return this.service.findAllWarehouses(user, plantId);
    }
    getStats(user) {
        return this.service.getStats(user);
    }
    findOne(id) {
        return this.service.findOneWarehouse(id);
    }
    update(id, dto, user) {
        return this.service.updateWarehouse(id, dto, user);
    }
    createZone(dto, user) {
        return this.service.createZone(dto, user);
    }
    findZones(warehouseId) {
        return this.service.findZonesByWarehouse(warehouseId);
    }
    createRack(dto, user) {
        return this.service.createRack(dto, user);
    }
    findRacks(zoneId) {
        return this.service.findRacksByZone(zoneId);
    }
    createBin(dto, user) {
        return this.service.createBin(dto, user);
    }
    findBins(rackId) {
        return this.service.findBinsByRack(rackId);
    }
};
exports.WarehouseController = WarehouseController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [warehouse_dto_1.CreateWarehouseDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiQuery)({ name: 'plantId', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('plantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, warehouse_dto_1.UpdateWarehouseDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('zones'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [warehouse_dto_1.CreateZoneDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "createZone", null);
__decorate([
    (0, common_1.Get)(':warehouseId/zones'),
    __param(0, (0, common_1.Param)('warehouseId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findZones", null);
__decorate([
    (0, common_1.Post)('racks'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [warehouse_dto_1.CreateRackDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "createRack", null);
__decorate([
    (0, common_1.Get)('zones/:zoneId/racks'),
    __param(0, (0, common_1.Param)('zoneId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findRacks", null);
__decorate([
    (0, common_1.Post)('bins'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [warehouse_dto_1.CreateBinDto, Object]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "createBin", null);
__decorate([
    (0, common_1.Get)('racks/:rackId/bins'),
    __param(0, (0, common_1.Param)('rackId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findBins", null);
exports.WarehouseController = WarehouseController = __decorate([
    (0, swagger_1.ApiTags)('Warehouse'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('warehouses'),
    __metadata("design:paramtypes", [warehouse_service_1.WarehouseService])
], WarehouseController);
//# sourceMappingURL=warehouse.controller.js.map