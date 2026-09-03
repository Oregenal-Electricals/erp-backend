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
exports.DowntimeController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const downtime_service_1 = require("./downtime.service");
const downtime_dto_1 = require("./dto/downtime.dto");
let DowntimeController = class DowntimeController {
    constructor(downtimeService) {
        this.downtimeService = downtimeService;
    }
    findAll(req, query) { return this.downtimeService.findAll(req.user, query); }
    getCumulative(workOrderId, req) { return this.downtimeService.getCumulativeDowntime(workOrderId, req.user); }
    pause(dto, req) { return this.downtimeService.pause(dto, req.user); }
    resume(id, dto, req) { return this.downtimeService.resume(id, dto, req.user); }
};
exports.DowntimeController = DowntimeController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DowntimeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('work-order/:workOrderId/cumulative'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Param)('workOrderId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DowntimeController.prototype, "getCumulative", null);
__decorate([
    (0, common_1.Post)('pause'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [downtime_dto_1.PauseDto, Object]),
    __metadata("design:returntype", void 0)
], DowntimeController.prototype, "pause", null);
__decorate([
    (0, common_1.Post)(':id/resume'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, downtime_dto_1.ResumeDto, Object]),
    __metadata("design:returntype", void 0)
], DowntimeController.prototype, "resume", null);
exports.DowntimeController = DowntimeController = __decorate([
    (0, common_1.Controller)('downtimes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [downtime_service_1.DowntimeService])
], DowntimeController);
//# sourceMappingURL=downtime.controller.js.map