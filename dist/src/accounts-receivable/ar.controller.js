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
exports.ArController = void 0;
const common_1 = require("@nestjs/common");
const ar_service_1 = require("./ar.service");
const ar_dto_1 = require("./dto/ar.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let ArController = class ArController {
    constructor(arService) {
        this.arService = arService;
    }
    getStats(req) { return this.arService.getStats(req.user); }
    getAging(req) { return this.arService.getAgingReport(req.user); }
    findAll(req, query) { return this.arService.findAll(req.user, query); }
    findOne(id, req) { return this.arService.findOne(id, req.user); }
    create(dto, req) { return this.arService.create(dto, req.user); }
    createFromDispatch(dispatchId, req) { return this.arService.createFromDispatch(dispatchId, req.user); }
    recordPayment(dto, req) { return this.arService.recordPayment(dto, req.user); }
};
exports.ArController = ArController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ArController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('aging'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ArController.prototype, "getAging", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.AR_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ArController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ArController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ar_dto_1.CreateArInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], ArController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('from-dispatch/:dispatchId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_CREATE),
    __param(0, (0, common_1.Param)('dispatchId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ArController.prototype, "createFromDispatch", null);
__decorate([
    (0, common_1.Post)('payments'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ar_dto_1.CreateArPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], ArController.prototype, "recordPayment", null);
exports.ArController = ArController = __decorate([
    (0, common_1.Controller)('ar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [ar_service_1.ArService])
], ArController);
//# sourceMappingURL=ar.controller.js.map