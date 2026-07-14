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
exports.LeaveManagementController = void 0;
const common_1 = require("@nestjs/common");
const leave_management_service_1 = require("./leave-management.service");
const leave_dto_1 = require("./dto/leave.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let LeaveManagementController = class LeaveManagementController {
    constructor(leaveService) {
        this.leaveService = leaveService;
    }
    getStats(req) { return this.leaveService.getStats(req.user); }
    getTypes(req) { return this.leaveService.findAllLeaveTypes(req.user); }
    createType(dto, req) { return this.leaveService.createLeaveType(dto, req.user); }
    updateType(id, dto, req) { return this.leaveService.updateLeaveType(id, dto, req.user); }
    allocate(dto, req) { return this.leaveService.allocateLeave(dto, req.user); }
    bulkAllocate(body, req) { return this.leaveService.bulkAllocate(body.leaveTypeId, body.year, req.user); }
    getBalance(empId, year, req) { return this.leaveService.getEmployeeBalances(empId, Number(year) || new Date().getFullYear(), req.user); }
    findAll(req, query) { return this.leaveService.findAllApplications(req.user, query); }
    apply(dto, req) { return this.leaveService.applyLeave(dto, req.user); }
    approve(id, dto, req) { return this.leaveService.approveLeave(id, dto, req.user); }
    cancel(id, req) { return this.leaveService.cancelLeave(id, req.user); }
};
exports.LeaveManagementController = LeaveManagementController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('types'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "getTypes", null);
__decorate([
    (0, common_1.Post)('types'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leave_dto_1.CreateLeaveTypeDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "createType", null);
__decorate([
    (0, common_1.Put)('types/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "updateType", null);
__decorate([
    (0, common_1.Post)('allocate'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leave_dto_1.AllocateLeaveDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "allocate", null);
__decorate([
    (0, common_1.Post)('bulk-allocate'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "bulkAllocate", null);
__decorate([
    (0, common_1.Get)('balance/:employeeId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.LEAVE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('apply'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leave_dto_1.ApplyLeaveDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "apply", null);
__decorate([
    (0, common_1.Put)(':id/approve'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_APPROVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, leave_dto_1.ApproveLeaveDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "approve", null);
__decorate([
    (0, common_1.Put)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveManagementController.prototype, "cancel", null);
exports.LeaveManagementController = LeaveManagementController = __decorate([
    (0, common_1.Controller)('leave'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [leave_management_service_1.LeaveManagementService])
], LeaveManagementController);
//# sourceMappingURL=leave-management.controller.js.map