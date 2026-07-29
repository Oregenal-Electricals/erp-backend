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
exports.FgReceiptController = void 0;
const common_1 = require("@nestjs/common");
const fg_receipt_service_1 = require("./fg-receipt.service");
const fg_receipt_dto_1 = require("./dto/fg-receipt.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let FgReceiptController = class FgReceiptController {
    constructor(fgrService) {
        this.fgrService = fgrService;
    }
    getStats(req) { return this.fgrService.getStats(req.user); }
    getPendingWos(req) { return this.fgrService.getCompletedWosWithoutFgr(req.user); }
    findAll(req, query) { return this.fgrService.findAll(req.user, query); }
    findOne(id, req) { return this.fgrService.findOne(id, req.user); }
    create(dto, req) { return this.fgrService.create(dto, req.user); }
    createFromWo(woId, req) { return this.fgrService.createFromWo(woId, req.user); }
    confirm(id, req) { return this.fgrService.confirm(id, req.user); }
};
exports.FgReceiptController = FgReceiptController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FgReceiptController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('pending-wos'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FgReceiptController.prototype, "getPendingWos", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FG_RECEIPT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FgReceiptController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FgReceiptController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fg_receipt_dto_1.CreateFgReceiptDto, Object]),
    __metadata("design:returntype", void 0)
], FgReceiptController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('from-wo/:woId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_CREATE),
    __param(0, (0, common_1.Param)('woId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FgReceiptController.prototype, "createFromWo", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FgReceiptController.prototype, "confirm", null);
exports.FgReceiptController = FgReceiptController = __decorate([
    (0, common_1.Controller)('fg-receipts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [fg_receipt_service_1.FgReceiptService])
], FgReceiptController);
//# sourceMappingURL=fg-receipt.controller.js.map