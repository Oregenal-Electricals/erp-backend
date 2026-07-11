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
exports.CustomsEntryController = void 0;
const common_1 = require("@nestjs/common");
const customs_entry_service_1 = require("./customs-entry.service");
const customs_entry_dto_1 = require("./dto/customs-entry.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let CustomsEntryController = class CustomsEntryController {
    constructor(ceService) {
        this.ceService = ceService;
    }
    getStats(req) { return this.ceService.getStats(req.user); }
    findAll(req, query) { return this.ceService.findAll(req.user, query); }
    findByIpo(ipoId, req) { return this.ceService.findByIpo(ipoId, req.user); }
    findOne(id, req) { return this.ceService.findOne(id, req.user); }
    create(dto, req) { return this.ceService.create(dto, req.user); }
    update(id, dto, req) { return this.ceService.update(id, dto, req.user); }
    file(id, req) { return this.ceService.file(id, req.user); }
    assess(id, dto, req) { return this.ceService.assess(id, dto, req.user); }
    payDuty(id, req) { return this.ceService.payDuty(id, req.user); }
    outOfCharge(id, req) { return this.ceService.outOfCharge(id, req.user); }
};
exports.CustomsEntryController = CustomsEntryController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomsEntryController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CustomsEntryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('ipo/:ipoId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Param)('ipoId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomsEntryController.prototype, "findByIpo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomsEntryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customs_entry_dto_1.CreateCustomsEntryDto, Object]),
    __metadata("design:returntype", void 0)
], CustomsEntryController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customs_entry_dto_1.UpdateCustomsEntryDto, Object]),
    __metadata("design:returntype", void 0)
], CustomsEntryController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/file'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomsEntryController.prototype, "file", null);
__decorate([
    (0, common_1.Post)(':id/assess'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customs_entry_dto_1.AssessCustomsEntryDto, Object]),
    __metadata("design:returntype", void 0)
], CustomsEntryController.prototype, "assess", null);
__decorate([
    (0, common_1.Post)(':id/pay-duty'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomsEntryController.prototype, "payDuty", null);
__decorate([
    (0, common_1.Post)(':id/out-of-charge'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomsEntryController.prototype, "outOfCharge", null);
exports.CustomsEntryController = CustomsEntryController = __decorate([
    (0, common_1.Controller)('customs-entries'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [customs_entry_service_1.CustomsEntryService])
], CustomsEntryController);
//# sourceMappingURL=customs-entry.controller.js.map