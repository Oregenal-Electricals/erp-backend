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
exports.WorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const workflows_service_1 = require("./workflows.service");
const workflow_dto_1 = require("./dto/workflow.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let WorkflowsController = class WorkflowsController {
    constructor(wfService) {
        this.wfService = wfService;
    }
    getStats(req) { return this.wfService.getStats(req.user); }
    findAllWorkflows(req) { return this.wfService.findAllWorkflows(req.user); }
    findAllRequests(req, query) { return this.wfService.findAllRequests(req.user, query); }
    findOneRequest(id, req) { return this.wfService.findOneRequest(id, req.user); }
    seed(req) { return this.wfService.seedDefaults(req.user.companyId, req.user.id); }
    create(dto, req) { return this.wfService.create(dto, req.user); }
    submit(dto, req) { return this.wfService.submit(dto, req.user); }
    act(id, dto, req) { return this.wfService.act(id, dto, req.user); }
    cancel(id, req) { return this.wfService.cancel(id, req.user); }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('definitions'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "findAllWorkflows", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "findAllRequests", null);
__decorate([
    (0, common_1.Get)('requests/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "findOneRequest", null);
__decorate([
    (0, common_1.Post)('seed'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_CREATE),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "seed", null);
__decorate([
    (0, common_1.Post)('definitions'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workflow_dto_1.CreateWorkflowDto, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('submit'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workflow_dto_1.SubmitForApprovalDto, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)('requests/:id/action'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workflow_dto_1.ApproveRejectDto, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "act", null);
__decorate([
    (0, common_1.Post)('requests/:id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SYSTEM_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "cancel", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, common_1.Controller)('workflows'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], WorkflowsController);
//# sourceMappingURL=workflows.controller.js.map