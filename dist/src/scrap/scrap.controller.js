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
exports.ScrapController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const scrap_service_1 = require("./scrap.service");
const scrap_dto_1 = require("./dto/scrap.dto");
let ScrapController = class ScrapController {
    constructor(scrapService) {
        this.scrapService = scrapService;
    }
    findAll(req, query) { return this.scrapService.findAll(req.user, query); }
    findOne(id, req) { return this.scrapService.findOne(id, req.user); }
    create(dto, req) { return this.scrapService.create(dto, req.user); }
    disposition(id, dto, req) { return this.scrapService.disposition(id, dto, req.user); }
};
exports.ScrapController = ScrapController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScrapController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ScrapController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [scrap_dto_1.CreateScrapDto, Object]),
    __metadata("design:returntype", void 0)
], ScrapController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/disposition'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, scrap_dto_1.DispositionScrapDto, Object]),
    __metadata("design:returntype", void 0)
], ScrapController.prototype, "disposition", null);
exports.ScrapController = ScrapController = __decorate([
    (0, common_1.Controller)('scrap'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [scrap_service_1.ScrapService])
], ScrapController);
//# sourceMappingURL=scrap.controller.js.map