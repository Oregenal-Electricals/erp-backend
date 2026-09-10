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
exports.GrnDiscrepancyController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const grn_discrepancy_service_1 = require("./grn-discrepancy.service");
const grn_discrepancy_dto_1 = require("./dto/grn-discrepancy.dto");
let GrnDiscrepancyController = class GrnDiscrepancyController {
    constructor(service) {
        this.service = service;
    }
    findAll(req, query) {
        return this.service.findAll(req.user, query);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user);
    }
    raise(grnItemId, dto, req) {
        return this.service.raise(grnItemId, dto, req.user);
    }
    correct(id, dto, req) {
        return this.service.correct(id, dto, req.user);
    }
};
exports.GrnDiscrepancyController = GrnDiscrepancyController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GRN_DISCREPANCY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], GrnDiscrepancyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GRN_DISCREPANCY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GrnDiscrepancyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('grn-item/:grnItemId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GRN_DISCREPANCY_CREATE),
    __param(0, (0, common_1.Param)('grnItemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, grn_discrepancy_dto_1.RaiseDiscrepancyDto, Object]),
    __metadata("design:returntype", void 0)
], GrnDiscrepancyController.prototype, "raise", null);
__decorate([
    (0, common_1.Post)(':id/correct'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GRN_DISCREPANCY_CORRECT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, grn_discrepancy_dto_1.CorrectDiscrepancyDto, Object]),
    __metadata("design:returntype", void 0)
], GrnDiscrepancyController.prototype, "correct", null);
exports.GrnDiscrepancyController = GrnDiscrepancyController = __decorate([
    (0, common_1.Controller)('grn-discrepancies'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [grn_discrepancy_service_1.GrnDiscrepancyService])
], GrnDiscrepancyController);
//# sourceMappingURL=grn-discrepancy.controller.js.map