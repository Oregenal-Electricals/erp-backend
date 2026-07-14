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
exports.CustomerPoController = void 0;
const common_1 = require("@nestjs/common");
const customer_po_service_1 = require("./customer-po.service");
const customer_po_dto_1 = require("./dto/customer-po.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let CustomerPoController = class CustomerPoController {
    constructor(cpoService) {
        this.cpoService = cpoService;
    }
    getStats(req) { return this.cpoService.getStats(req.user); }
    findAll(req, query) { return this.cpoService.findAll(req.user, query); }
    findOne(id, req) { return this.cpoService.findOne(id, req.user); }
    getShortages(id, req) { return this.cpoService.getShortages(id, req.user); }
    create(dto, req) { return this.cpoService.create(dto, req.user); }
    update(id, dto, req) { return this.cpoService.update(id, dto, req.user); }
    acknowledge(id, req) { return this.cpoService.acknowledge(id, req.user); }
    createQuantityIncrease(id, dto, req) { return this.cpoService.createQuantityIncrease(id, dto, req.user); }
    cancel(id, dto, req) { return this.cpoService.cancel(id, dto, req.user); }
    runShortageCheck(id, req) { return this.cpoService.runShortageCheck(id, req.user); }
};
exports.CustomerPoController = CustomerPoController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomerPoController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.CUSTOMER_PO_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CustomerPoController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerPoController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/shortages'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerPoController.prototype, "getShortages", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_po_dto_1.CreateCpoDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerPoController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_po_dto_1.UpdateCpoDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerPoController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/acknowledge'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerPoController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Post)(':id/increase-quantity'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_po_dto_1.CreateQuantityIncreaseDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerPoController.prototype, "createQuantityIncrease", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_po_dto_1.CancelCpoDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerPoController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/run-shortage-check'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerPoController.prototype, "runShortageCheck", null);
exports.CustomerPoController = CustomerPoController = __decorate([
    (0, common_1.Controller)('customer-po'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [customer_po_service_1.CustomerPoService])
], CustomerPoController);
//# sourceMappingURL=customer-po.controller.js.map