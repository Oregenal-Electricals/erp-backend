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
exports.VisitorLogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const visitor_management_service_1 = require("./visitor-management.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const visitor_dto_1 = require("./dto/visitor.dto");
let VisitorLogController = class VisitorLogController {
    constructor(service) {
        this.service = service;
    }
    checkIn(dto, user) {
        return this.service.checkIn(dto, user);
    }
    findAllLogs(user, plantId, status, date) {
        return this.service.findAllLogs(user, { plantId, status, date });
    }
    getActiveVisitors(user) {
        return this.service.getActiveVisitors(user);
    }
    checkOut(id, dto, user) {
        return this.service.checkOut(id, dto, user);
    }
};
exports.VisitorLogController = VisitorLogController;
__decorate([
    (0, common_1.Post)('check-in'),
    (0, swagger_1.ApiOperation)({ summary: 'Check in a visitor' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [visitor_dto_1.CheckInVisitorDto, Object]),
    __metadata("design:returntype", void 0)
], VisitorLogController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all visitor logs' }),
    (0, swagger_1.ApiQuery)({ name: 'plantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.VisitorStatus }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('plantId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], VisitorLogController.prototype, "findAllLogs", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get currently checked-in visitors' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VisitorLogController.prototype, "getActiveVisitors", null);
__decorate([
    (0, common_1.Patch)(':id/checkout'),
    (0, swagger_1.ApiOperation)({ summary: 'Check out a visitor' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, visitor_dto_1.CheckOutVisitorDto, Object]),
    __metadata("design:returntype", void 0)
], VisitorLogController.prototype, "checkOut", null);
exports.VisitorLogController = VisitorLogController = __decorate([
    (0, swagger_1.ApiTags)('Visitor Logs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('visitor-logs'),
    __metadata("design:paramtypes", [visitor_management_service_1.VisitorManagementService])
], VisitorLogController);
//# sourceMappingURL=visitor-log.controller.js.map