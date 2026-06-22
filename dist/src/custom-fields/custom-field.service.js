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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomFieldService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let CustomFieldService = class CustomFieldService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createDefinition(dto, user) {
        const exists = await this.prisma.customFieldDefinition.findUnique({
            where: { companyId_module_fieldKey: { companyId: user.companyId, module: dto.module, fieldKey: dto.fieldKey } },
        });
        if (exists)
            throw new common_1.ConflictException(`Field key "${dto.fieldKey}" already exists for module ${dto.module}`);
        const def = await this.prisma.customFieldDefinition.create({
            data: Object.assign(Object.assign({}, dto), { options: dto.options ? dto.options : undefined, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'custom_field_definitions', recordId: def.id, action: 'CREATE', newValues: def, changedBy: user.id });
        return def;
    }
    async getDefinitions(module, user) {
        const where = { companyId: user.companyId, isActive: true };
        if (module)
            where.module = module;
        return this.prisma.customFieldDefinition.findMany({
            where, orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
        });
    }
    async getAllDefinitions(user) {
        return this.prisma.customFieldDefinition.findMany({
            where: { companyId: user.companyId },
            orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
        });
    }
    async updateDefinition(id, dto, user) {
        const def = await this.prisma.customFieldDefinition.findFirst({ where: { id, companyId: user.companyId } });
        if (!def)
            throw new common_1.NotFoundException('Custom field definition not found');
        const updated = await this.prisma.customFieldDefinition.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { options: dto.options ? dto.options : undefined, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'custom_field_definitions', recordId: id, action: 'UPDATE', oldValues: def, newValues: updated, changedBy: user.id });
        return updated;
    }
    async deleteDefinition(id, user) {
        const def = await this.prisma.customFieldDefinition.findFirst({ where: { id, companyId: user.companyId } });
        if (!def)
            throw new common_1.NotFoundException('Custom field definition not found');
        const updated = await this.prisma.customFieldDefinition.update({
            where: { id }, data: { isActive: false, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'custom_field_definitions', recordId: id, action: 'DELETE', oldValues: def, newValues: updated, changedBy: user.id });
        return { message: 'Custom field deactivated' };
    }
    async getValues(module, recordId, user) {
        const [definitions, values] = await Promise.all([
            this.prisma.customFieldDefinition.findMany({
                where: { companyId: user.companyId, module, isActive: true },
                orderBy: [{ sortOrder: 'asc' }],
            }),
            this.prisma.customFieldValue.findMany({
                where: { companyId: user.companyId, module, recordId },
            }),
        ]);
        const valueMap = Object.fromEntries(values.map(v => [v.fieldKey, v.value]));
        return definitions.map(def => {
            var _a, _b;
            return (Object.assign(Object.assign({}, def), { value: (_b = (_a = valueMap[def.fieldKey]) !== null && _a !== void 0 ? _a : def.defaultValue) !== null && _b !== void 0 ? _b : null }));
        });
    }
    async saveValues(module, recordId, dto, user) {
        const results = [];
        const valuesMap = dto.values || dto;
        for (const [fieldKey, value] of Object.entries(valuesMap)) {
            const result = await this.prisma.customFieldValue.upsert({
                where: { companyId_module_recordId_fieldKey: { companyId: user.companyId, module, recordId, fieldKey } },
                create: { companyId: user.companyId, module, recordId, fieldKey, value: String(value), createdBy: user.id, updatedBy: user.id },
                update: { value: String(value), updatedBy: user.id },
            });
            results.push(result);
        }
        return results;
    }
    async getStats(user) {
        const defs = await this.prisma.customFieldDefinition.findMany({
            where: { companyId: user.companyId },
        });
        const byModule = {};
        defs.forEach(d => { byModule[d.module] = (byModule[d.module] || 0) + 1; });
        const totalValues = await this.prisma.customFieldValue.count({ where: { companyId: user.companyId } });
        return { totalFields: defs.length, activeFields: defs.filter(d => d.isActive).length, byModule, totalValues };
    }
};
exports.CustomFieldService = CustomFieldService;
exports.CustomFieldService = CustomFieldService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], CustomFieldService);
//# sourceMappingURL=custom-field.service.js.map