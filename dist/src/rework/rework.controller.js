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
exports.ReworkController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const rework_service_1 = require("./rework.service");
const rework_dto_1 = require("./dto/rework.dto");
let ReworkController = class ReworkController {
    constructor(reworkService) {
        this.reworkService = reworkService;
    }
    findAll(req, query) { return this.reworkService.findAll(req.user, query); }
    findOne(id, req) { return this.reworkService.findOne(id, req.user); }
    create(dto, req) { return this.reworkService.create(dto, req.user); }
    start(id, dto, req) { return this.reworkService.start(id, dto, req.user); }
    complete(id, dto, req) { return this.reworkService.complete(id, dto, req.user); }
};
exports.ReworkController = ReworkController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReworkController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReworkController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rework_dto_1.CreateReworkDto, Object]),
    __metadata("design:returntype", void 0)
], ReworkController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rework_dto_1.StartReworkDto, Object]),
    __metadata("design:returntype", void 0)
], ReworkController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rework_dto_1.CompleteReworkDto, Object]),
    __metadata("design:returntype", void 0)
], ReworkController.prototype, "complete", null);
exports.ReworkController = ReworkController = __decorate([
    (0, common_1.Controller)('rework'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [rework_service_1.ReworkService])
], ReworkController);
//# sourceMappingURL=rework.controller.js.map