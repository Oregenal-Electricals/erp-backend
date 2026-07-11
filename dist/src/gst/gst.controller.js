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
exports.GstController = void 0;
const common_1 = require("@nestjs/common");
const gst_service_1 = require("./gst.service");
const gst_dto_1 = require("./dto/gst.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let GstController = class GstController {
    constructor(gstService) {
        this.gstService = gstService;
    }
    getDashboard(req, period) { return this.gstService.getDashboard(req.user, period); }
    getGstr1(req, period) { return this.gstService.getGstr1(req.user, period); }
    getGstr3b(req, period) { return this.gstService.getGstr3b(req.user, period); }
    findAll(req) { return this.gstService.findAll(req.user); }
    generate(dto, req) { return this.gstService.generateReturn(dto, req.user); }
    file(id, dto, req) { return this.gstService.fileReturn(id, dto, req.user); }
};
exports.GstController = GstController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('gstr1'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "getGstr1", null);
__decorate([
    (0, common_1.Get)('gstr3b'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "getGstr3b", null);
__decorate([
    (0, common_1.Get)('returns'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('returns/generate'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gst_dto_1.GenerateGstReturnDto, Object]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "generate", null);
__decorate([
    (0, common_1.Post)('returns/:id/file'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gst_dto_1.FileGstReturnDto, Object]),
    __metadata("design:returntype", void 0)
], GstController.prototype, "file", null);
exports.GstController = GstController = __decorate([
    (0, common_1.Controller)('gst'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [gst_service_1.GstService])
], GstController);
//# sourceMappingURL=gst.controller.js.map