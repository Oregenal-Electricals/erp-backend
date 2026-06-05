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
exports.DummyDataController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const dummy_data_service_1 = require("./dummy-data.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let DummyDataController = class DummyDataController {
    constructor(service) {
        this.service = service;
    }
    getStatus(user) {
        return this.service.getStatus(user.role === client_1.UserRole.SUPER_ADMIN ? undefined : user.companyId);
    }
    seedCompany(companyId, user) {
        return this.service.seedCompany(companyId, user.id);
    }
    purgeCompany(companyId) {
        return this.service.purgeCompany(companyId);
    }
    purgeAll() {
        return this.service.purgeAll();
    }
};
exports.DummyDataController = DummyDataController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get test data counts across all entities' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DummyDataController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('seed/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed test data for a specific company' }),
    __param(0, (0, common_1.Param)('companyId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DummyDataController.prototype, "seedCompany", null);
__decorate([
    (0, common_1.Delete)('purge/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Purge test data for a specific company' }),
    __param(0, (0, common_1.Param)('companyId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DummyDataController.prototype, "purgeCompany", null);
__decorate([
    (0, common_1.Delete)('purge-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Purge ALL test data (SUPER_ADMIN only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DummyDataController.prototype, "purgeAll", null);
exports.DummyDataController = DummyDataController = __decorate([
    (0, swagger_1.ApiTags)('Dummy Data'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, common_1.Controller)('dummy-data'),
    __metadata("design:paramtypes", [dummy_data_service_1.DummyDataService])
], DummyDataController);
//# sourceMappingURL=dummy-data.controller.js.map