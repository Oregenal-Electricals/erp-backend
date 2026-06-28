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
exports.ProductionIssueController = void 0;
const common_1 = require("@nestjs/common");
const production_issue_service_1 = require("./production-issue.service");
const production_issue_dto_1 = require("./dto/production-issue.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let ProductionIssueController = class ProductionIssueController {
    constructor(piService) {
        this.piService = piService;
    }
    getStats(req) { return this.piService.getStats(req.user); }
    findAll(req, query) { return this.piService.findAll(req.user, query); }
    findOne(id, req) { return this.piService.findOne(id, req.user); }
    create(dto, req) { return this.piService.create(dto, req.user); }
    createFromMrp(woId, req) { return this.piService.createFromMrp(woId, req.user); }
    confirm(id, req) { return this.piService.confirm(id, req.user); }
};
exports.ProductionIssueController = ProductionIssueController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionIssueController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductionIssueController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductionIssueController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [production_issue_dto_1.CreateProductionIssueDto, Object]),
    __metadata("design:returntype", void 0)
], ProductionIssueController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('from-mrp/:woId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Param)('woId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductionIssueController.prototype, "createFromMrp", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductionIssueController.prototype, "confirm", null);
exports.ProductionIssueController = ProductionIssueController = __decorate([
    (0, common_1.Controller)('production-issues'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [production_issue_service_1.ProductionIssueService])
], ProductionIssueController);
//# sourceMappingURL=production-issue.controller.js.map