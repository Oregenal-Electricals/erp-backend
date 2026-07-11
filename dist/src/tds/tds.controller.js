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
exports.TdsController = void 0;
const common_1 = require("@nestjs/common");
const tds_service_1 = require("./tds.service");
const tds_dto_1 = require("./dto/tds.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let TdsController = class TdsController {
    constructor(tdsService) {
        this.tdsService = tdsService;
    }
    getAll(req, query) { return this.tdsService.getAllDeclarations(req.user, query); }
    getChallan(month, year, req) {
        return this.tdsService.getTdsChallan(Number(month), Number(year), req.user);
    }
    getRegister(fy, req) {
        return this.tdsService.getTdsRegister(req.user.companyId, fy || `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`);
    }
    getForm16(empId, fy, req) {
        return this.tdsService.getForm16Summary(empId, fy, req.user);
    }
    getDeclaration(empId, fy, req) {
        return this.tdsService.getDeclaration(empId, fy, req.user);
    }
    saveDeclaration(dto, req) { return this.tdsService.saveDeclaration(dto, req.user); }
};
exports.TdsController = TdsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TdsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('challan'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TdsController.prototype, "getChallan", null);
__decorate([
    (0, common_1.Get)('register'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Query)('financialYear')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TdsController.prototype, "getRegister", null);
__decorate([
    (0, common_1.Get)('form16/:employeeId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('financialYear')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TdsController.prototype, "getForm16", null);
__decorate([
    (0, common_1.Get)(':employeeId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('financialYear')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TdsController.prototype, "getDeclaration", null);
__decorate([
    (0, common_1.Post)('declaration'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tds_dto_1.SaveDeclarationDto, Object]),
    __metadata("design:returntype", void 0)
], TdsController.prototype, "saveDeclaration", null);
exports.TdsController = TdsController = __decorate([
    (0, common_1.Controller)('tds'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [tds_service_1.TdsService])
], TdsController);
//# sourceMappingURL=tds.controller.js.map