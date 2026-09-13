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
exports.StockLocationTransferController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const stock_location_transfer_service_1 = require("./stock-location-transfer.service");
const stock_location_transfer_dto_1 = require("./dto/stock-location-transfer.dto");
let StockLocationTransferController = class StockLocationTransferController {
    constructor(service) {
        this.service = service;
    }
    findHistory(itemCode, req) {
        return this.service.findHistory(req.user, itemCode);
    }
    getBinContents(binId, req) {
        return this.service.getBinContents(binId, req.user);
    }
    getItemLocations(itemCode, req) {
        return this.service.getItemLocations(itemCode, req.user);
    }
    transfer(dto, req) {
        return this.service.transfer(dto, req.user);
    }
};
exports.StockLocationTransferController = StockLocationTransferController;
__decorate([
    (0, common_1.Get)('history'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STORE_LOCATION_TRANSFER_VIEW),
    __param(0, (0, common_1.Query)('itemCode')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockLocationTransferController.prototype, "findHistory", null);
__decorate([
    (0, common_1.Get)('bin/:binId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STORE_LOCATION_TRANSFER_VIEW),
    __param(0, (0, common_1.Param)('binId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockLocationTransferController.prototype, "getBinContents", null);
__decorate([
    (0, common_1.Get)('item/:itemCode'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STORE_LOCATION_TRANSFER_VIEW),
    __param(0, (0, common_1.Param)('itemCode')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockLocationTransferController.prototype, "getItemLocations", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STORE_LOCATION_TRANSFER_EXECUTE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_location_transfer_dto_1.TransferLocationDto, Object]),
    __metadata("design:returntype", void 0)
], StockLocationTransferController.prototype, "transfer", null);
exports.StockLocationTransferController = StockLocationTransferController = __decorate([
    (0, common_1.Controller)('stock-location-transfer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [stock_location_transfer_service_1.StockLocationTransferService])
], StockLocationTransferController);
//# sourceMappingURL=stock-location-transfer.controller.js.map