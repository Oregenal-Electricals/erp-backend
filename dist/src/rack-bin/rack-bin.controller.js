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
exports.RackBinController = void 0;
const common_1 = require("@nestjs/common");
const rack_bin_service_1 = require("./rack-bin.service");
const rack_bin_dto_1 = require("./dto/rack-bin.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let RackBinController = class RackBinController {
    constructor(rbService) {
        this.rbService = rbService;
    }
    getStats(wId, req) { return this.rbService.getWarehouseStats(wId, req.user); }
    findZones(wId, req) { return this.rbService.findZones(wId, req.user); }
    createZone(dto, req) { return this.rbService.createZone(dto, req.user); }
    findRacks(wId, req, zoneId) { return this.rbService.findRacks(wId, req.user, zoneId); }
    createRack(dto, req) { return this.rbService.createRack(dto, req.user); }
    findBins(rackId, req) { return this.rbService.findBins(rackId, req.user); }
    findEmptyBins(wId, req) { return this.rbService.findEmptyBins(wId, req.user); }
    createBin(dto, req) { return this.rbService.createBin(dto, req.user); }
    bulkCreate(dto, req) { return this.rbService.bulkCreateBins(dto, req.user); }
    updateStatus(id, dto, req) { return this.rbService.updateBinStatus(id, dto, req.user); }
};
exports.RackBinController = RackBinController;
__decorate([
    (0, common_1.Get)('stats/:warehouseId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RackBinController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('zones/:warehouseId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RackBinController.prototype, "findZones", null);
__decorate([
    (0, common_1.Post)('zones'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rack_bin_dto_1.CreateZoneDto, Object]),
    __metadata("design:returntype", void 0)
], RackBinController.prototype, "createZone", null);
__decorate([
    (0, common_1.Get)('racks/:warehouseId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('zoneId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], RackBinController.prototype, "findRacks", null);
__decorate([
    (0, common_1.Post)('racks'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rack_bin_dto_1.CreateRackDto, Object]),
    __metadata("design:returntype", void 0)
], RackBinController.prototype, "createRack", null);
__decorate([
    (0, common_1.Get)('bins/rack/:rackId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('rackId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RackBinController.prototype, "findBins", null);
__decorate([
    (0, common_1.Get)('bins/empty/:warehouseId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RackBinController.prototype, "findEmptyBins", null);
__decorate([
    (0, common_1.Post)('bins'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rack_bin_dto_1.CreateBinDto, Object]),
    __metadata("design:returntype", void 0)
], RackBinController.prototype, "createBin", null);
__decorate([
    (0, common_1.Post)('bins/bulk'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rack_bin_dto_1.BulkCreateBinsDto, Object]),
    __metadata("design:returntype", void 0)
], RackBinController.prototype, "bulkCreate", null);
__decorate([
    (0, common_1.Put)('bins/:id/status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rack_bin_dto_1.UpdateBinStatusDto, Object]),
    __metadata("design:returntype", void 0)
], RackBinController.prototype, "updateStatus", null);
exports.RackBinController = RackBinController = __decorate([
    (0, common_1.Controller)('rack-bin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [rack_bin_service_1.RackBinService])
], RackBinController);
//# sourceMappingURL=rack-bin.controller.js.map