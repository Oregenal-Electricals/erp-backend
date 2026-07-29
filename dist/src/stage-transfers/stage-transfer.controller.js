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
exports.StageTransferController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const stage_transfer_service_1 = require("./stage-transfer.service");
const stage_transfer_dto_1 = require("./dto/stage-transfer.dto");
let StageTransferController = class StageTransferController {
    constructor(stageTransferService) {
        this.stageTransferService = stageTransferService;
    }
    findAll(req, query) { return this.stageTransferService.findAll(req.user, query); }
    give(dto, req) { return this.stageTransferService.give(dto, req.user); }
    receive(id, req) { return this.stageTransferService.receive(id, req.user); }
};
exports.StageTransferController = StageTransferController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STAGE_TRANSFER_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StageTransferController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('give'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STAGE_TRANSFER_GIVE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stage_transfer_dto_1.GiveTransferDto, Object]),
    __metadata("design:returntype", void 0)
], StageTransferController.prototype, "give", null);
__decorate([
    (0, common_1.Post)(':id/receive'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STAGE_TRANSFER_RECEIVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StageTransferController.prototype, "receive", null);
exports.StageTransferController = StageTransferController = __decorate([
    (0, common_1.Controller)('stage-transfers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [stage_transfer_service_1.StageTransferService])
], StageTransferController);
//# sourceMappingURL=stage-transfer.controller.js.map