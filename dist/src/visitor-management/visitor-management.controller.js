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
exports.VisitorManagementController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const visitor_management_service_1 = require("./visitor-management.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const visitor_dto_1 = require("./dto/visitor.dto");
let VisitorManagementController = class VisitorManagementController {
    constructor(service) {
        this.service = service;
    }
    createVisitor(dto, user) {
        return this.service.createVisitor(dto, user);
    }
    findAllVisitors(user, search) {
        return this.service.findAllVisitors(user, search);
    }
    getStats(user) {
        return this.service.getStats(user);
    }
    findOneVisitor(id) {
        return this.service.findOneVisitor(id);
    }
    updateVisitor(id, dto, user) {
        return this.service.updateVisitor(id, dto, user);
    }
    blacklistVisitor(id, reason, user) {
        return this.service.blacklistVisitor(id, reason, user);
    }
};
exports.VisitorManagementController = VisitorManagementController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new visitor' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [visitor_dto_1.CreateVisitorDto, Object]),
    __metadata("design:returntype", void 0)
], VisitorManagementController.prototype, "createVisitor", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all visitors' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VisitorManagementController.prototype, "findAllVisitors", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get visitor statistics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VisitorManagementController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get visitor by ID with visit history' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VisitorManagementController.prototype, "findOneVisitor", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update visitor details' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, visitor_dto_1.UpdateVisitorDto, Object]),
    __metadata("design:returntype", void 0)
], VisitorManagementController.prototype, "updateVisitor", null);
__decorate([
    (0, common_1.Patch)(':id/blacklist'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle visitor blacklist status' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], VisitorManagementController.prototype, "blacklistVisitor", null);
exports.VisitorManagementController = VisitorManagementController = __decorate([
    (0, swagger_1.ApiTags)('Visitor Management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('visitors'),
    __metadata("design:paramtypes", [visitor_management_service_1.VisitorManagementService])
], VisitorManagementController);
//# sourceMappingURL=visitor-management.controller.js.map