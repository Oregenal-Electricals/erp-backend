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
exports.BomImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const bom_import_service_1 = require("./bom-import.service");
const bom_import_dto_1 = require("./dto/bom-import.dto");
let BomImportController = class BomImportController {
    constructor(service) {
        this.service = service;
    }
    async parse(file, user) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        return this.service.parseFile(file, user.companyId);
    }
    async confirm(dto, user) {
        return this.service.confirmImport(dto, user);
    }
};
exports.BomImportController = BomImportController;
__decorate([
    (0, common_1.Post)('parse'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.BOM_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Parse an uploaded BOM file (xlsx/csv/pdf) into a preview - does not write to the database' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BomImportController.prototype, "parse", null);
__decorate([
    (0, common_1.Post)('confirm'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create the Product (if new), any missing Raw Materials, the BOM, and all line items from a previously-parsed preview' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bom_import_dto_1.ConfirmBomImportDto, Object]),
    __metadata("design:returntype", Promise)
], BomImportController.prototype, "confirm", null);
exports.BomImportController = BomImportController = __decorate([
    (0, swagger_1.ApiTags)('BOM Import'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('bom-import'),
    __metadata("design:paramtypes", [bom_import_service_1.BomImportService])
], BomImportController);
//# sourceMappingURL=bom-import.controller.js.map