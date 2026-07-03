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
exports.BankReconController = void 0;
const common_1 = require("@nestjs/common");
const bank_recon_service_1 = require("./bank-recon.service");
const bank_recon_dto_1 = require("./dto/bank-recon.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let BankReconController = class BankReconController {
    constructor(bankReconService) {
        this.bankReconService = bankReconService;
    }
    getStats(req) { return this.bankReconService.getStats(req.user); }
    getBankAccounts(req) { return this.bankReconService.getBankAccounts(req.user); }
    getSuggestions(lineId, req) { return this.bankReconService.getSuggestions(lineId, req.user); }
    findAll(req, query) { return this.bankReconService.findAll(req.user, query); }
    findOne(id, req) { return this.bankReconService.findOne(id, req.user); }
    create(dto, req) { return this.bankReconService.create(dto, req.user); }
    reconcile(dto, req) { return this.bankReconService.reconcileLine(dto, req.user); }
    unreconcile(lineId, req) { return this.bankReconService.unreconcileLine(lineId, req.user); }
};
exports.BankReconController = BankReconController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BankReconController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('bank-accounts'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BankReconController.prototype, "getBankAccounts", null);
__decorate([
    (0, common_1.Get)('suggestions/:lineId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('lineId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BankReconController.prototype, "getSuggestions", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BankReconController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BankReconController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bank_recon_dto_1.CreateBankStatementDto, Object]),
    __metadata("design:returntype", void 0)
], BankReconController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('reconcile'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bank_recon_dto_1.ReconcileLineDto, Object]),
    __metadata("design:returntype", void 0)
], BankReconController.prototype, "reconcile", null);
__decorate([
    (0, common_1.Post)('unreconcile/:lineId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('lineId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BankReconController.prototype, "unreconcile", null);
exports.BankReconController = BankReconController = __decorate([
    (0, common_1.Controller)('bank-reconciliation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [bank_recon_service_1.BankReconService])
], BankReconController);
//# sourceMappingURL=bank-recon.controller.js.map