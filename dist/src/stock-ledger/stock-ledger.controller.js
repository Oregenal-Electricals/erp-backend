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
exports.StockLedgerController = void 0;
const common_1 = require("@nestjs/common");
const stock_ledger_service_1 = require("./stock-ledger.service");
const stock_ledger_dto_1 = require("./dto/stock-ledger.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let StockLedgerController = class StockLedgerController {
    constructor(slService) {
        this.slService = slService;
    }
    getStats(req) { return this.slService.getStats(req.user); }
    findBalance(req, query) { return this.slService.findBalance(req.user, query); }
    getItemLedger(code, req) { return this.slService.getItemLedger(code, req.user); }
    findLedger(req, query) { return this.slService.findLedger(req.user, query); }
    receiveFromIqc(iqcId, req) { return this.slService.receiveFromIqc(iqcId, req.user); }
    adjust(dto, req) { return this.slService.adjust(dto, req.user); }
};
exports.StockLedgerController = StockLedgerController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StockLedgerController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('balance'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StockLedgerController.prototype, "findBalance", null);
__decorate([
    (0, common_1.Get)('item/:code'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockLedgerController.prototype, "getItemLedger", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StockLedgerController.prototype, "findLedger", null);
__decorate([
    (0, common_1.Post)('receive/:iqcId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Param)('iqcId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockLedgerController.prototype, "receiveFromIqc", null);
__decorate([
    (0, common_1.Post)('adjust'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_ledger_dto_1.AdjustStockDto, Object]),
    __metadata("design:returntype", void 0)
], StockLedgerController.prototype, "adjust", null);
exports.StockLedgerController = StockLedgerController = __decorate([
    (0, common_1.Controller)('stock-ledger'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [stock_ledger_service_1.StockLedgerService])
], StockLedgerController);
//# sourceMappingURL=stock-ledger.controller.js.map