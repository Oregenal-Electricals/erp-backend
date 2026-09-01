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
exports.ManpowerController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const manpower_service_1 = require("./manpower.service");
const manpower_dto_1 = require("./dto/manpower.dto");
let ManpowerController = class ManpowerController {
    constructor(manpowerService) {
        this.manpowerService = manpowerService;
    }
    findAll(req, query) { return this.manpowerService.findAll(req.user, query); }
    findOne(id, req) { return this.manpowerService.findOne(id, req.user); }
    getChain(id, req) { return this.manpowerService.getChain(id, req.user); }
    create(dto, req) { return this.manpowerService.create(dto, req.user); }
    accept(id, req) { return this.manpowerService.accept(id, req.user); }
    distribute(dto, req) { return this.manpowerService.distribute(dto, req.user); }
    raiseQuery(dto, req) { return this.manpowerService.raiseQuery(dto, req.user); }
    resolveQuery(id, dto, req) { return this.manpowerService.resolveQuery(id, dto, req.user); }
    adjust(dto, req) { return this.manpowerService.requestAdjust(dto, req.user); }
    transfer(dto, req) { return this.manpowerService.requestTransfer(dto, req.user); }
    approveRequest(requestId, req) { return this.manpowerService.approveManpowerRequest(requestId, req.user); }
    rejectRequest(requestId, dto, req) { return this.manpowerService.rejectManpowerRequest(requestId, req.user, dto === null || dto === void 0 ? void 0 : dto.comments); }
    assignEmployees(dto, req) { return this.manpowerService.assignEmployees(dto, req.user); }
    endAssignment(id, dto, req) { return this.manpowerService.endAssignment(id, dto, req.user); }
    getCurrentRoster(query, req) { return this.manpowerService.getCurrentRoster(query, req.user); }
    getManpowerAvailability(query, req) { return this.manpowerService.getManpowerAvailability(query, req.user); }
    getEmployeeTimeline(employeeId, date, req) { return this.manpowerService.getEmployeeTimeline(employeeId, date, req.user); }
    getReconciliation(date, req) { return this.manpowerService.getReconciliation(date, req.user); }
};
exports.ManpowerController = ManpowerController;
__decorate([
    (0, common_1.Get)('allocations'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('allocations/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('allocations/:id/chain'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "getChain", null);
__decorate([
    (0, common_1.Post)('allocations'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_ALLOCATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manpower_dto_1.CreateManpowerAllocationDto, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('allocations/:id/accept'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_ACCEPT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)('allocations/distribute'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_DISTRIBUTE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manpower_dto_1.DistributeManpowerDto, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "distribute", null);
__decorate([
    (0, common_1.Post)('queries'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_QUERY),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manpower_dto_1.RaiseManpowerQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "raiseQuery", null);
__decorate([
    (0, common_1.Post)('queries/:id/resolve'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_QUERY),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, manpower_dto_1.ResolveManpowerQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "resolveQuery", null);
__decorate([
    (0, common_1.Post)('allocations/adjust'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_ADJUST),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manpower_dto_1.AdjustManpowerDto, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "adjust", null);
__decorate([
    (0, common_1.Post)('allocations/transfer'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_ADJUST),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manpower_dto_1.TransferManpowerDto, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "transfer", null);
__decorate([
    (0, common_1.Post)('approvals/:requestId/approve'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.WORK_ORDER_APPROVE),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "approveRequest", null);
__decorate([
    (0, common_1.Post)('approvals/:requestId/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.WORK_ORDER_APPROVE),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "rejectRequest", null);
__decorate([
    (0, common_1.Post)('assignments'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_ASSIGN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manpower_dto_1.AssignEmployeesDto, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "assignEmployees", null);
__decorate([
    (0, common_1.Post)('assignments/:id/end'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_ASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, manpower_dto_1.EndAssignmentDto, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "endAssignment", null);
__decorate([
    (0, common_1.Get)('roster'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_VIEW),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "getCurrentRoster", null);
__decorate([
    (0, common_1.Get)('availability'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_VIEW),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "getManpowerAvailability", null);
__decorate([
    (0, common_1.Get)('employees/:employeeId/timeline'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_VIEW),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "getEmployeeTimeline", null);
__decorate([
    (0, common_1.Get)('reconciliation'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANPOWER_VIEW),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ManpowerController.prototype, "getReconciliation", null);
exports.ManpowerController = ManpowerController = __decorate([
    (0, common_1.Controller)('manpower'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [manpower_service_1.ManpowerService])
], ManpowerController);
//# sourceMappingURL=manpower.controller.js.map