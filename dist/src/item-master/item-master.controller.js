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
exports.ItemMasterController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const item_master_service_1 = require("./item-master.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const item_master_dto_1 = require("./dto/item-master.dto");
let ItemMasterController = class ItemMasterController {
    constructor(service) {
        this.service = service;
    }
    createUom(dto, user) {
        return this.service.createUom(dto, user);
    }
    findAllUoms(user) {
        return this.service.findAllUoms(user);
    }
    updateUom(id, dto, user) {
        return this.service.updateUom(id, dto, user);
    }
    toggleUom(id, user) {
        return this.service.toggleUomStatus(id, user);
    }
    createCategory(dto, user) {
        return this.service.createCategory(dto, user);
    }
    findAllCategories(user) {
        return this.service.findAllCategories(user);
    }
    updateCategory(id, dto, user) {
        return this.service.updateCategory(id, dto, user);
    }
    createItem(dto, user) {
        return this.service.createItem(dto, user);
    }
    findAllItems(user, itemType, categoryId, status, search) {
        return this.service.findAllItems(user, { itemType, categoryId, search, status });
    }
    getStats(user) {
        return this.service.getStats(user);
    }
    findOneItem(id) {
        return this.service.findOneItem(id);
    }
    updateItem(id, dto, user) {
        return this.service.updateItem(id, dto, user);
    }
    toggleItem(id, user) {
        return this.service.toggleItemStatus(id, user);
    }
};
exports.ItemMasterController = ItemMasterController;
__decorate([
    (0, common_1.Post)('uom'),
    (0, swagger_1.ApiOperation)({ summary: 'Create Unit of Measure' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [item_master_dto_1.CreateUomDto, Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "createUom", null);
__decorate([
    (0, common_1.Get)('uom'),
    (0, swagger_1.ApiOperation)({ summary: 'List all UOMs' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "findAllUoms", null);
__decorate([
    (0, common_1.Put)('uom/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update UOM' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, item_master_dto_1.UpdateUomDto, Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "updateUom", null);
__decorate([
    (0, common_1.Patch)('uom/:id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle UOM active status' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "toggleUom", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Create Item Category' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [item_master_dto_1.CreateCategoryDto, Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'List all categories' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "findAllCategories", null);
__decorate([
    (0, common_1.Put)('categories/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update category' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, item_master_dto_1.UpdateCategoryDto, Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create Item' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [item_master_dto_1.CreateItemDto, Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "createItem", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all items' }),
    (0, swagger_1.ApiQuery)({ name: 'itemType', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('itemType')),
    __param(2, (0, common_1.Query)('categoryId')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "findAllItems", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get item statistics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get item by ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "findOneItem", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update item' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, item_master_dto_1.UpdateItemDto, Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle item status' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ItemMasterController.prototype, "toggleItem", null);
exports.ItemMasterController = ItemMasterController = __decorate([
    (0, swagger_1.ApiTags)('Item Master'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('items'),
    __metadata("design:paramtypes", [item_master_service_1.ItemMasterService])
], ItemMasterController);
//# sourceMappingURL=item-master.controller.js.map