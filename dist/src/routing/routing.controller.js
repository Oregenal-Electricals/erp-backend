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
exports.RoutingController = void 0;
const common_1 = require("@nestjs/common");
const routing_service_1 = require("./routing.service");
const routing_dto_1 = require("./dto/routing.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let RoutingController = class RoutingController {
    constructor(routingService) {
        this.routingService = routingService;
    }
    findAll(req) { return this.routingService.findAll(req.user); }
    findOne(id, req) { return this.routingService.findOne(id, req.user); }
    getChain(routingGroupId, req) { return this.routingService.getChain(routingGroupId, req.user); }
    create(dto, req) { return this.routingService.createRouting(dto, req.user); }
    startProduction(dto, req) { return this.routingService.startProduction(dto, req.user); }
};
exports.RoutingController = RoutingController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RoutingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoutingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('chain/:routingGroupId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_VIEW),
    __param(0, (0, common_1.Param)('routingGroupId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoutingController.prototype, "getChain", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [routing_dto_1.CreateRoutingDto, Object]),
    __metadata("design:returntype", void 0)
], RoutingController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('start-production'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [routing_dto_1.StartProductionDto, Object]),
    __metadata("design:returntype", void 0)
], RoutingController.prototype, "startProduction", null);
exports.RoutingController = RoutingController = __decorate([
    (0, common_1.Controller)('routing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [routing_service_1.RoutingService])
], RoutingController);
//# sourceMappingURL=routing.controller.js.map