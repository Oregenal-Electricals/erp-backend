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
exports.PriceHistoryController = void 0;
const common_1 = require("@nestjs/common");
const price_history_service_1 = require("./price-history.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let PriceHistoryController = class PriceHistoryController {
    constructor(priceHistoryService) {
        this.priceHistoryService = priceHistoryService;
    }
    getStats(req) { return this.priceHistoryService.getStats(req.user); }
    search(req, query) { return this.priceHistoryService.search(req.user, query); }
    getItemHistory(itemCode, req) { return this.priceHistoryService.getItemHistory(itemCode, req.user); }
    getEffectivePrice(itemCode, req) { return this.priceHistoryService.getEffectivePrice(itemCode, req.user); }
    getListHistory(priceListId, req) { return this.priceHistoryService.getListHistory(priceListId, req.user); }
};
exports.PriceHistoryController = PriceHistoryController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PriceHistoryController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PriceHistoryController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('item/:itemCode'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('itemCode')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PriceHistoryController.prototype, "getItemHistory", null);
__decorate([
    (0, common_1.Get)('effective/:itemCode'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('itemCode')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PriceHistoryController.prototype, "getEffectivePrice", null);
__decorate([
    (0, common_1.Get)('list/:priceListId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('priceListId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PriceHistoryController.prototype, "getListHistory", null);
exports.PriceHistoryController = PriceHistoryController = __decorate([
    (0, common_1.Controller)('price-history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [price_history_service_1.PriceHistoryService])
], PriceHistoryController);
//# sourceMappingURL=price-history.controller.js.map