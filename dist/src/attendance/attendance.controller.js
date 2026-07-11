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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const attendance_dto_1 = require("./dto/attendance.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let AttendanceController = class AttendanceController {
    constructor(attService) {
        this.attService = attService;
    }
    getShifts(req) { return this.attService.findAllShifts(req.user); }
    createShift(dto, req) { return this.attService.createShift(dto, req.user); }
    updateShift(id, dto, req) { return this.attService.updateShift(id, dto, req.user); }
    getStats(req, query) { return this.attService.getStats(req.user, query); }
    findAll(req, query) { return this.attService.findAll(req.user, query); }
    getMonthlySummary(empId, query, req) {
        return this.attService.getMonthlySummary(empId, Number(query.month), Number(query.year), req.user);
    }
    mark(dto, req) { return this.attService.markAttendance(dto, req.user); }
    bulkMark(dto, req) { return this.attService.bulkMarkAttendance(dto, req.user); }
    update(id, dto, req) { return this.attService.updateAttendance(id, dto, req.user); }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Get)('shifts'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getShifts", null);
__decorate([
    (0, common_1.Post)('shifts'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.CreateShiftDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "createShift", null);
__decorate([
    (0, common_1.Put)('shifts/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "updateShift", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary/:employeeId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getMonthlySummary", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.MarkAttendanceDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "mark", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.BulkAttendanceDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "bulkMark", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, attendance_dto_1.UpdateAttendanceDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "update", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map