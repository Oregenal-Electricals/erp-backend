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
exports.IqcController = void 0;
const common_1 = require("@nestjs/common");
const iqc_service_1 = require("./iqc.service");
const iqc_escalation_service_1 = require("./iqc-escalation.service");
const iqc_dto_1 = require("./dto/iqc.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let IqcController = class IqcController {
    constructor(iqcService, escalation) {
        this.iqcService = iqcService;
        this.escalation = escalation;
    }
    getStats(req) { return this.iqcService.getStats(req.user); }
    findAllTemplates(req, query) { return this.escalation.findAllTemplates(req.user, query); }
    findOneTemplate(id, req) { return this.escalation.findOneTemplate(id, req.user); }
    createTemplate(dto, req) { return this.escalation.createTemplate(dto, req.user); }
    updateTemplate(id, dto, req) { return this.escalation.updateTemplate(id, dto, req.user); }
    cloneTemplate(id, name, req) { return this.escalation.cloneTemplate(id, name, req.user); }
    findAll(req, query) { return this.iqcService.findAll(req.user, query); }
    findByGrn(grnId, req) { return this.iqcService.findByGrn(grnId, req.user); }
    findOne(id, req) { return this.iqcService.findOne(id, req.user); }
    getEscalationDetail(id, req) { return this.escalation.getEscalationDetail(id, req.user); }
    create(dto, req) { return this.iqcService.create(dto, req.user); }
    updateItems(id, dto, req) { return this.iqcService.updateItems(id, dto, req.user); }
    approve(id, req) { return this.iqcService.approve(id, req.user); }
    attachTemplate(id, dto, req) { return this.escalation.attachTemplate(id, dto, req.user); }
    submitStageResult(id, dto, req) { return this.escalation.submitStageResult(id, dto, req.user); }
};
exports.IqcController = IqcController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "findAllTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "findOneTemplate", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [iqc_dto_1.CreateIqcCheckTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Put)('templates/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, iqc_dto_1.UpdateIqcCheckTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Post)('templates/:id/clone'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('name')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "cloneTemplate", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.IQC_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('grn/:grnId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_VIEW),
    __param(0, (0, common_1.Param)('grnId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "findByGrn", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/escalation'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "getEscalationDetail", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [iqc_dto_1.CreateIqcDto, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id/items'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, iqc_dto_1.UpdateIqcItemsDto, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "updateItems", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/attach-template'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, iqc_dto_1.AttachTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "attachTemplate", null);
__decorate([
    (0, common_1.Post)(':id/stage-result'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.QUALITY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, iqc_dto_1.SubmitIqcStageResultDto, Object]),
    __metadata("design:returntype", void 0)
], IqcController.prototype, "submitStageResult", null);
exports.IqcController = IqcController = __decorate([
    (0, common_1.Controller)('iqc'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [iqc_service_1.IqcService, iqc_escalation_service_1.IqcEscalationService])
], IqcController);
//# sourceMappingURL=iqc.controller.js.map