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
exports.ChangeRequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const change_requests_service_1 = require("./change-requests.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const change_request_dto_1 = require("./dto/change-request.dto");
let ChangeRequestsController = class ChangeRequestsController {
    constructor(service) {
        this.service = service;
    }
    create(dto, user) {
        return this.service.create(dto, user);
    }
    findAll(user, status, type, myRequests, pendingApproval) {
        return this.service.findAll(user, {
            status,
            type,
            myRequests: myRequests === 'true',
            pendingApproval: pendingApproval === 'true',
        });
    }
    getStats(user) {
        return this.service.getStats(user);
    }
    findOne(id, user) {
        return this.service.findOne(id, user);
    }
    update(id, dto, user) {
        return this.service.update(id, dto, user);
    }
    submit(id, user) {
        return this.service.submit(id, user);
    }
    approve(id, dto, user) {
        return this.service.approve(id, dto, user);
    }
    reject(id, dto, user) {
        return this.service.reject(id, dto, user);
    }
    cancel(id, user) {
        return this.service.cancel(id, user);
    }
    addComment(id, dto, user) {
        return this.service.addComment(id, dto, user);
    }
};
exports.ChangeRequestsController = ChangeRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new change request (any user)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [change_request_dto_1.CreateChangeRequestDto, Object]),
    __metadata("design:returntype", void 0)
], ChangeRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List change requests (filtered by role)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.ChangeRequestStatus }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: client_1.ChangeRequestType }),
    (0, swagger_1.ApiQuery)({ name: 'myRequests', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'pendingApproval', required: false, type: Boolean }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('myRequests')),
    __param(4, (0, common_1.Query)('pendingApproval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ChangeRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get change request statistics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChangeRequestsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get change request by ID with comments' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChangeRequestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update change request (DRAFT only, own request)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_request_dto_1.UpdateChangeRequestDto, Object]),
    __metadata("design:returntype", void 0)
], ChangeRequestsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit request for approval' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChangeRequestsController.prototype, "submit", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a change request (approvers only)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_request_dto_1.ReviewChangeRequestDto, Object]),
    __metadata("design:returntype", void 0)
], ChangeRequestsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a change request (approvers only)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_request_dto_1.ReviewChangeRequestDto, Object]),
    __metadata("design:returntype", void 0)
], ChangeRequestsController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a change request' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChangeRequestsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a comment to a change request' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_request_dto_1.AddCommentDto, Object]),
    __metadata("design:returntype", void 0)
], ChangeRequestsController.prototype, "addComment", null);
exports.ChangeRequestsController = ChangeRequestsController = __decorate([
    (0, swagger_1.ApiTags)('Change Requests'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('change-requests'),
    __metadata("design:paramtypes", [change_requests_service_1.ChangeRequestsService])
], ChangeRequestsController);
//# sourceMappingURL=change-requests.controller.js.map