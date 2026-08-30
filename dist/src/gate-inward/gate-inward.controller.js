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
exports.GateInwardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const gate_inward_service_1 = require("./gate-inward.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const gate_inward_dto_1 = require("./dto/gate-inward.dto");
let GateInwardController = class GateInwardController {
    constructor(service) {
        this.service = service;
    }
    create(dto, user) {
        return this.service.create(dto, user);
    }
    findAll(user, status, plantId, date, search) {
        return this.service.findAll(user, { status, plantId, date, search });
    }
    getStats(user) {
        return this.service.getStats(user);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, dto, user) {
        return this.service.update(id, dto, user);
    }
    verify(id, dto, user) {
        return this.service.verify(id, dto, user);
    }
    gateIn(id, dto, user) {
        return this.service.gateIn(id, dto, user);
    }
    sendToStores(id, user) {
        return this.service.sendToStores(id, user);
    }
    complete(id, user) {
        return this.service.complete(id, user);
    }
    reject(id, dto, user) {
        return this.service.reject(id, dto, user);
    }
    resolveHoldWithPo(id, dto, user) {
        return this.service.resolveHoldWithPo(id, dto.poId, dto.remarks, user);
    }
    resolveHoldAsNonPo(id, dto, user) {
        return this.service.resolveHoldAsNonPo(id, dto.remarks, user);
    }
    resolveHoldAsRejected(id, dto, user) {
        return this.service.resolveHoldAsRejected(id, dto.rejectionReason, user);
    }
    resolveReturnMaterial(id, dto, user) {
        return this.service.resolveReturnMaterial(id, dto.reason, user);
    }
    resolveApprovedException(id, dto, user) {
        return this.service.resolveApprovedException(id, dto.reason, user);
    }
    resolveCorrectPoReference(id, dto, user) {
        return this.service.resolveCorrectPoReference(id, dto.poId, dto.reason, user);
    }
    flagMismatch(id, dto, user) {
        return this.service.flagMismatch(id, dto.mismatchType, dto.expectedValue, dto.actualValue, dto.remarks, user);
    }
    resolveMismatchCorrectReference(id, dto, user) {
        return this.service.resolveMismatchCorrectReference(id, dto.correctedValue, dto.reason, user);
    }
    resolveMismatchApprovedException(id, dto, user) {
        return this.service.resolveMismatchApprovedException(id, dto.reason, user);
    }
    resolveMismatchRejected(id, dto, user) {
        return this.service.resolveMismatchRejected(id, dto.reason, user);
    }
    flagDamage(id, dto, user) {
        return this.service.flagDamage(id, dto.damageType, dto.description, dto.affectedPackages, dto.gateRecommendation, user);
    }
    resolveDamageReject(id, dto, user) {
        return this.service.resolveDamageReject(id, dto.reason, user);
    }
    resolveDamageAcceptException(id, dto, user) {
        return this.service.resolveDamageAcceptException(id, dto.reason, user);
    }
    recordReturnGateOut(id, dto, user) {
        return this.service.recordReturnGateOut(id, dto.remarks, user);
    }
    verifyPackageCount(id, dto, user) {
        return this.service.verifyPackageCount(id, dto.actualPackageCount, user);
    }
    resolvePackageCountRecount(id, dto, user) {
        return this.service.resolvePackageCountRecount(id, dto.newActualCount, dto.remarks, user);
    }
    resolvePackageCountEscalate(id, dto, user) {
        return this.service.resolvePackageCountEscalate(id, dto.remarks, user);
    }
    resolvePackageCountApprovedInward(id, dto, user) {
        return this.service.resolvePackageCountApprovedInward(id, dto.reason, user);
    }
    resolvePackageCountRejected(id, dto, user) {
        return this.service.resolvePackageCountRejected(id, dto.reason, user);
    }
    flagDocumentMissing(id, dto, user) {
        return this.service.flagDocumentMissing(id, dto.documentType, dto.reason, user);
    }
    resolveDocumentMissingException(id, dto, user) {
        return this.service.resolveDocumentMissingException(id, dto.reason, user);
    }
    resolveDocumentMissingReject(id, dto, user) {
        return this.service.resolveDocumentMissingReject(id, dto.reason, user);
    }
};
exports.GateInwardController = GateInwardController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create Gate Inward Entry' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gate_inward_dto_1.CreateGateInwardDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List all Gate Inward Entries' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.GateInwardStatus }),
    (0, swagger_1.ApiQuery)({ name: 'plantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('plantId')),
    __param(3, (0, common_1.Query)('date')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get Gate Inward statistics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get Gate Inward Entry by ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update Gate Inward Entry (PENDING only)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.UpdateGateInwardDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/verify'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'Verify Gate Inward Entry' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.VerifyGateInwardDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "verify", null);
__decorate([
    (0, common_1.Patch)(':id/gate-in'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'Let the vehicle in at the gate after verification' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.GateInDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "gateIn", null);
__decorate([
    (0, common_1.Patch)(':id/send-to-stores'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'Send to Stores department' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "sendToStores", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'Mark as Completed' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'Reject Gate Inward Entry' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.RejectGateInwardDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-hold/identify-po'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-003: Purchase identifies the correct PO for a held entry' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolveHoldWithPoDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveHoldWithPo", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-hold/authorize-non-po'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-003: Purchase authorizes a non-PO receipt exception for a held entry' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolveHoldAsNonPoDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveHoldAsNonPo", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-hold/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-003: Purchase rejects the material for a held entry' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolveHoldAsRejectedDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveHoldAsRejected", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-status-hold/return-material'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-004/005: Purchase returns the material for a Cancelled/Closed PO hold' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ReturnMaterialDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveReturnMaterial", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-status-hold/approved-exception'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-004/005: Purchase approves an exception to receive despite Cancelled/Closed PO' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ApprovedExceptionDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveApprovedException", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-status-hold/correct-po'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-004/005: Purchase corrects the PO reference for a Cancelled/Closed PO hold' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.CorrectPoReferenceDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveCorrectPoReference", null);
__decorate([
    (0, common_1.Patch)(':id/flag-mismatch'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-006/007: Gate flags a vendor or material mismatch, stopping normal Gate-In' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.FlagMismatchDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "flagMismatch", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-mismatch/correct-reference'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-006/007: correct the declared vendor/material and return to normal flow' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolveMismatchCorrectReferenceDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveMismatchCorrectReference", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-mismatch/approved-exception'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-006/007: approve an exception to receive despite the mismatch' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolveMismatchApprovedExceptionDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveMismatchApprovedException", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-mismatch/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-006/007: reject the material at the gate' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolveMismatchRejectedDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveMismatchRejected", null);
__decorate([
    (0, common_1.Patch)(':id/flag-damage'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-008/009: Gate flags visible material/packaging damage, stopping normal Gate-In' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.FlagDamageDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "flagDamage", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-damage/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-008/009: reject the damaged material at the gate' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolveDamageRejectDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveDamageReject", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-damage/accept-exception'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-008/009: accept under exception for detailed Store/QC inspection' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolveDamageAcceptExceptionDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveDamageAcceptException", null);
__decorate([
    (0, common_1.Patch)(':id/record-return-gate-out'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-008/009: record that rejected damaged material has physically left the gate' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.RecordReturnGateOutDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "recordReturnGateOut", null);
__decorate([
    (0, common_1.Patch)(':id/verify-package-count'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-010: Gate compares physical package count against the declared figure' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.VerifyPackageCountDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "verifyPackageCount", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-package-count/recount'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-010: Gate recounts - resolves automatically if it now matches' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolvePackageCountRecountDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolvePackageCountRecount", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-package-count/escalate'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-010: escalate to Purchase/Store verification - hold stays open' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolvePackageCountEscalateDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolvePackageCountEscalate", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-package-count/approved-inward'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-010: approve inward despite the count mismatch' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolvePackageCountApprovedInwardDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolvePackageCountApprovedInward", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-package-count/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-010: reject the material over the count mismatch' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolvePackageCountRejectedDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolvePackageCountRejected", null);
__decorate([
    (0, common_1.Patch)(':id/flag-document-missing'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_VERIFY),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-012: Gate flags that the vehicle arrived without a physical challan/invoice document' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.FlagDocumentMissingDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "flagDocumentMissing", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-document-missing/exception'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-012: accept the material on undertaking the document will follow' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolveDocumentMissingExceptionDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveDocumentMissingException", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-document-missing/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_INWARD_RESOLVE_HOLD),
    (0, swagger_1.ApiOperation)({ summary: 'GATE-012: reject the material over the missing document' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gate_inward_dto_1.ResolveDocumentMissingRejectDto, Object]),
    __metadata("design:returntype", void 0)
], GateInwardController.prototype, "resolveDocumentMissingReject", null);
exports.GateInwardController = GateInwardController = __decorate([
    (0, swagger_1.ApiTags)('Gate Inward'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('gate-inward'),
    __metadata("design:paramtypes", [gate_inward_service_1.GateInwardService])
], GateInwardController);
//# sourceMappingURL=gate-inward.controller.js.map