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
exports.TrainingController = void 0;
const common_1 = require("@nestjs/common");
const training_service_1 = require("./training.service");
const training_dto_1 = require("./dto/training.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let TrainingController = class TrainingController {
    constructor(trainingService) {
        this.trainingService = trainingService;
    }
    getStats(req) { return this.trainingService.getStats(req.user); }
    getPrograms(req, query) { return this.trainingService.findAllPrograms(req.user, query); }
    createProgram(dto, req) { return this.trainingService.createProgram(dto, req.user); }
    updateProgram(id, dto, req) { return this.trainingService.updateProgram(id, dto, req.user); }
    getSessions(req, query) { return this.trainingService.findAllSessions(req.user, query); }
    getSession(id, req) { return this.trainingService.getSession(id, req.user); }
    createSession(dto, req) { return this.trainingService.createSession(dto, req.user); }
    updateSession(id, dto, req) { return this.trainingService.updateSession(id, dto, req.user); }
    completeSession(id, req) { return this.trainingService.completeSession(id, req.user); }
    enroll(dto, req) { return this.trainingService.enrollEmployees(dto, req.user); }
    markAttendance(id, dto, req) { return this.trainingService.markAttendance(id, dto, req.user); }
    completeEnrollment(id, dto, req) { return this.trainingService.completeEnrollment(id, dto, req.user); }
    getEmployeeHistory(empId, req) { return this.trainingService.getEmployeeTrainingHistory(empId, req.user); }
};
exports.TrainingController = TrainingController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('programs'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "getPrograms", null);
__decorate([
    (0, common_1.Post)('programs'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_dto_1.CreateProgramDto, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "createProgram", null);
__decorate([
    (0, common_1.Put)('programs/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "updateProgram", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('sessions'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_dto_1.CreateSessionDto, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "createSession", null);
__decorate([
    (0, common_1.Put)('sessions/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Put)('sessions/:id/complete'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "completeSession", null);
__decorate([
    (0, common_1.Post)('enroll'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_dto_1.EnrollDto, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "enroll", null);
__decorate([
    (0, common_1.Post)('sessions/:id/attendance'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, training_dto_1.MarkAttendanceDto, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "markAttendance", null);
__decorate([
    (0, common_1.Put)('enrollments/:id/complete'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, training_dto_1.UpdateEnrollmentDto, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "completeEnrollment", null);
__decorate([
    (0, common_1.Get)('employee/:employeeId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "getEmployeeHistory", null);
exports.TrainingController = TrainingController = __decorate([
    (0, common_1.Controller)('training'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [training_service_1.TrainingService])
], TrainingController);
//# sourceMappingURL=training.controller.js.map