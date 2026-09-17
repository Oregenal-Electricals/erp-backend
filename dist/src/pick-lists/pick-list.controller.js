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
exports.PickListController = void 0;
const common_1 = require("@nestjs/common");
const pick_list_service_1 = require("./pick-list.service");
const pick_list_dto_1 = require("./dto/pick-list.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let PickListController = class PickListController {
    constructor(plService) {
        this.plService = plService;
    }
    suggestBatches(dispatchReservationId, req) {
        return this.plService.suggestBatches(dispatchReservationId, req.user);
    }
    findOne(id, req) {
        return this.plService.findOne(id, req.user);
    }
    createPickList(dto, req) {
        return this.plService.createPickList(dto.dispatchPlanId, req.user);
    }
    pickItem(pickListId, dto, req) {
        return this.plService.pickItem(pickListId, dto.dispatchReservationId, dto.batchId, dto.pickQty, req.user);
    }
    reversePick(pickListItemId, dto, req) {
        return this.plService.reversePick(pickListItemId, dto.reverseQty, dto.reason, req.user);
    }
};
exports.PickListController = PickListController;
__decorate([
    (0, common_1.Get)('suggest-batches/:dispatchReservationId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_PICK_VIEW),
    __param(0, (0, common_1.Param)('dispatchReservationId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PickListController.prototype, "suggestBatches", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_PICK_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PickListController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_PICK_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pick_list_dto_1.CreatePickListDto, Object]),
    __metadata("design:returntype", void 0)
], PickListController.prototype, "createPickList", null);
__decorate([
    (0, common_1.Post)(':pickListId/pick'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_PICK_CONFIRM),
    __param(0, (0, common_1.Param)('pickListId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pick_list_dto_1.PickItemDto, Object]),
    __metadata("design:returntype", void 0)
], PickListController.prototype, "pickItem", null);
__decorate([
    (0, common_1.Post)('items/:pickListItemId/reverse'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_PICK_REVERSE),
    __param(0, (0, common_1.Param)('pickListItemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pick_list_dto_1.ReversePickDto, Object]),
    __metadata("design:returntype", void 0)
], PickListController.prototype, "reversePick", null);
exports.PickListController = PickListController = __decorate([
    (0, common_1.Controller)('pick-lists'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [pick_list_service_1.PickListService])
], PickListController);
//# sourceMappingURL=pick-list.controller.js.map