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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiControlService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UiControlService = class UiControlService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async syncElements(companyId, elements, userId) {
        var _a, _b, _c, _d;
        const results = [];
        for (const el of elements) {
            const row = await this.prisma.uiControlElement.upsert({
                where: { companyId_key: { companyId, key: el.key } },
                update: {
                    elementType: el.elementType, module: el.module, page: el.page, label: el.label,
                    icon: el.icon, parentKey: el.parentKey, sortOrder: (_a = el.sortOrder) !== null && _a !== void 0 ? _a : 0,
                    defaultVisible: (_b = el.defaultVisible) !== null && _b !== void 0 ? _b : true, updatedBy: userId,
                },
                create: {
                    companyId, key: el.key, elementType: el.elementType, module: el.module, page: el.page,
                    label: el.label, icon: el.icon, parentKey: el.parentKey, sortOrder: (_c = el.sortOrder) !== null && _c !== void 0 ? _c : 0,
                    defaultVisible: (_d = el.defaultVisible) !== null && _d !== void 0 ? _d : true, createdBy: userId, updatedBy: userId,
                },
            });
            results.push(row);
        }
        return { synced: results.length, elements: results };
    }
    async createElement(companyId, dto, userId) {
        const existing = await this.prisma.uiControlElement.findUnique({
            where: { companyId_key: { companyId, key: dto.key } },
        });
        if (existing)
            throw new common_1.BadRequestException(`Key "${dto.key}" already exists`);
        return this.prisma.uiControlElement.create({
            data: Object.assign(Object.assign({ companyId }, dto), { createdBy: userId, updatedBy: userId }),
        });
    }
    async updateElement(id, dto, userId) {
        const el = await this.prisma.uiControlElement.findUnique({ where: { id } });
        if (!el)
            throw new common_1.NotFoundException('Element not found');
        return this.prisma.uiControlElement.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: userId }) });
    }
    async reorderElements(items, userId) {
        const ops = items.map((it) => this.prisma.uiControlElement.update({
            where: { id: it.id },
            data: Object.assign(Object.assign({ sortOrder: it.sortOrder }, (it.parentKey !== undefined ? { parentKey: it.parentKey } : {})), { updatedBy: userId }),
        }));
        await this.prisma.$transaction(ops);
        return { reordered: items.length };
    }
    async deleteElement(id) {
        const el = await this.prisma.uiControlElement.findUnique({ where: { id } });
        if (!el)
            throw new common_1.NotFoundException('Element not found');
        const childCount = await this.prisma.uiControlElement.count({
            where: { parentKey: el.key, isActive: true },
        });
        if (childCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete "${el.label}" — it still has ${childCount} item(s) under it. Move or delete those first.`);
        }
        return this.prisma.uiControlElement.update({ where: { id }, data: { isActive: false } });
    }
    async listElements(companyId, module) {
        return this.prisma.uiControlElement.findMany({
            where: Object.assign({ companyId, isActive: true }, (module ? { module } : {})),
            include: { overrides: { where: { isActive: true } } },
            orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
        });
    }
    async getStructureTree(companyId) {
        const elements = await this.prisma.uiControlElement.findMany({
            where: { companyId, isActive: true, elementType: { in: ['SIDEBAR_SECTION', 'SIDEBAR_ITEM'] } },
            include: { overrides: { where: { isActive: true } } },
            orderBy: [{ sortOrder: 'asc' }],
        });
        const sections = elements.filter((e) => e.elementType === 'SIDEBAR_SECTION');
        const nestedItems = elements.filter((e) => e.elementType === 'SIDEBAR_ITEM' && e.parentKey);
        const standaloneItems = elements.filter((e) => e.elementType === 'SIDEBAR_ITEM' && !e.parentKey);
        const sectionNodes = sections.map((s) => (Object.assign(Object.assign({}, s), { items: nestedItems.filter((i) => i.parentKey === s.key).sort((a, b) => a.sortOrder - b.sortOrder) })));
        const standaloneNodes = standaloneItems.map((i) => (Object.assign(Object.assign({}, i), { items: [] })));
        return [...sectionNodes, ...standaloneNodes].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    async getPageElements(companyId) {
        const elements = await this.prisma.uiControlElement.findMany({
            where: { companyId, isActive: true, elementType: { in: ['FIELD', 'COLUMN', 'BUTTON', 'TAB', 'SECTION', 'STAT_CARD'] } },
            include: { overrides: { where: { isActive: true } } },
            orderBy: [{ module: 'asc' }, { page: 'asc' }, { sortOrder: 'asc' }],
        });
        const grouped = {};
        for (const el of elements) {
            const groupKey = `${el.module} — ${el.page || 'general'}`;
            if (!grouped[groupKey])
                grouped[groupKey] = [];
            grouped[groupKey].push(el);
        }
        return grouped;
    }
    buildRoleAwareSidebar(elements, effectiveFn) {
        const sections = elements.filter((e) => e.elementType === 'SIDEBAR_SECTION');
        const items = elements.filter((e) => e.elementType === 'SIDEBAR_ITEM');
        const effectiveParent = (item) => {
            var _a;
            const override = (_a = effectiveFn(item.key)) === null || _a === void 0 ? void 0 : _a.parentKeyOverride;
            if (override === '__ROOT__')
                return null;
            if (override)
                return override;
            return item.parentKey || null;
        };
        const sectionNodes = sections
            .filter((s) => { var _a; return ((_a = effectiveFn(s.key)) === null || _a === void 0 ? void 0 : _a.visible) !== false; })
            .map((s) => {
            var _a, _b, _c;
            return ({
                key: s.key, label: ((_a = effectiveFn(s.key)) === null || _a === void 0 ? void 0 : _a.label) || s.label, icon: s.icon, page: s.page,
                sortOrder: (_c = (_b = effectiveFn(s.key)) === null || _b === void 0 ? void 0 : _b.sortOrder) !== null && _c !== void 0 ? _c : s.sortOrder,
                items: items
                    .filter((i) => { var _a; return effectiveParent(i) === s.key && ((_a = effectiveFn(i.key)) === null || _a === void 0 ? void 0 : _a.visible) !== false; })
                    .sort((a, b) => { var _a, _b, _c, _d; return ((_b = (_a = effectiveFn(a.key)) === null || _a === void 0 ? void 0 : _a.sortOrder) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = effectiveFn(b.key)) === null || _c === void 0 ? void 0 : _c.sortOrder) !== null && _d !== void 0 ? _d : 0); })
                    .map((i) => { var _a; return ({ key: i.key, label: ((_a = effectiveFn(i.key)) === null || _a === void 0 ? void 0 : _a.label) || i.label, icon: i.icon, page: i.page }); }),
            });
        })
            .filter((s) => s.items.length > 0 || s.page);
        const standaloneNodes = items
            .filter((i) => { var _a; return effectiveParent(i) === null && ((_a = effectiveFn(i.key)) === null || _a === void 0 ? void 0 : _a.visible) !== false; })
            .map((i) => {
            var _a, _b, _c;
            return ({
                key: i.key, label: ((_a = effectiveFn(i.key)) === null || _a === void 0 ? void 0 : _a.label) || i.label, icon: i.icon, page: i.page,
                sortOrder: (_c = (_b = effectiveFn(i.key)) === null || _b === void 0 ? void 0 : _b.sortOrder) !== null && _c !== void 0 ? _c : i.sortOrder,
                items: [],
            });
        });
        return [...sectionNodes, ...standaloneNodes]
            .sort((a, b) => { var _a, _b; return ((_a = a.sortOrder) !== null && _a !== void 0 ? _a : 0) - ((_b = b.sortOrder) !== null && _b !== void 0 ? _b : 0); })
            .map((_a) => {
            var { sortOrder } = _a, rest = __rest(_a, ["sortOrder"]);
            return rest;
        });
    }
    async getMySidebar(companyId, userId, allRoles) {
        const elements = await this.prisma.uiControlElement.findMany({
            where: { companyId, isActive: true, elementType: { in: ['SIDEBAR_SECTION', 'SIDEBAR_ITEM'] } },
        });
        if (allRoles.includes('SUPER_ADMIN')) {
            return this.buildRoleAwareSidebar(elements, () => ({ visible: true }));
        }
        const visMap = await this.getEffectiveVisibility(companyId, userId, allRoles);
        return this.buildRoleAwareSidebar(elements, (key) => visMap[key]);
    }
    async upsertOverride(companyId, dto, userId) {
        var _a, _b;
        const existing = await this.prisma.uiControlOverride.findFirst({
            where: {
                elementId: dto.elementId,
                scopeType: dto.scopeType,
                roleName: dto.scopeType === 'ROLE' ? (_a = dto.roleName) !== null && _a !== void 0 ? _a : null : null,
                userId: dto.scopeType === 'USER' ? (_b = dto.userId) !== null && _b !== void 0 ? _b : null : null,
            },
        });
        if (existing) {
            return this.prisma.uiControlOverride.update({
                where: { id: existing.id },
                data: {
                    isVisible: dto.isVisible,
                    sortOrderOverride: dto.sortOrderOverride,
                    customLabel: dto.customLabel !== undefined ? (dto.customLabel || null) : existing.customLabel,
                    parentKeyOverride: dto.parentKeyOverride !== undefined ? (dto.parentKeyOverride || null) : existing.parentKeyOverride,
                    updatedBy: userId,
                },
            });
        }
        const element = await this.prisma.uiControlElement.findUnique({ where: { id: dto.elementId } });
        if (!element)
            throw new common_1.NotFoundException('UI element not found');
        return this.prisma.uiControlOverride.create({
            data: {
                companyId, elementId: dto.elementId, scopeType: dto.scopeType,
                roleName: dto.scopeType === 'ROLE' ? dto.roleName : null,
                userId: dto.scopeType === 'USER' ? dto.userId : null,
                isVisible: dto.isVisible, sortOrderOverride: dto.sortOrderOverride,
                customLabel: dto.customLabel || null,
                parentKeyOverride: dto.parentKeyOverride || null,
                createdBy: userId, updatedBy: userId,
            },
        });
    }
    async bulkUpsertOverrides(companyId, overrides, userId) {
        const results = [];
        for (const o of overrides)
            results.push(await this.upsertOverride(companyId, o, userId));
        return { updated: results.length };
    }
    async deleteOverride(id) {
        return this.prisma.uiControlOverride.update({ where: { id }, data: { isActive: false } });
    }
    async getEffectiveVisibility(companyId, userId, allRoles) {
        const elements = await this.prisma.uiControlElement.findMany({
            where: { companyId, isActive: true },
            include: {
                overrides: {
                    where: {
                        isActive: true,
                        OR: [{ scopeType: 'USER', userId }, { scopeType: 'ROLE', roleName: { in: allRoles } }],
                    },
                },
            },
        });
        const map = {};
        for (const el of elements) {
            let visible = el.defaultVisible;
            let sortOrder = el.sortOrder;
            let label = el.label;
            let parentKeyOverride = undefined;
            const roleOverrides = el.overrides.filter((o) => o.scopeType === 'ROLE');
            if (roleOverrides.length > 0) {
                visible = roleOverrides.every((o) => o.isVisible);
                const withSort = roleOverrides.find((o) => o.sortOrderOverride != null);
                if (withSort)
                    sortOrder = withSort.sortOrderOverride;
                const withLabel = roleOverrides.find((o) => o.customLabel);
                if (withLabel)
                    label = withLabel.customLabel;
                const withParent = roleOverrides.find((o) => o.parentKeyOverride);
                if (withParent)
                    parentKeyOverride = withParent.parentKeyOverride;
            }
            const userOverride = el.overrides.find((o) => o.scopeType === 'USER' && o.userId === userId);
            if (userOverride) {
                visible = userOverride.isVisible;
                if (userOverride.sortOrderOverride != null)
                    sortOrder = userOverride.sortOrderOverride;
                if (userOverride.customLabel)
                    label = userOverride.customLabel;
                if (userOverride.parentKeyOverride)
                    parentKeyOverride = userOverride.parentKeyOverride;
            }
            map[el.key] = { visible, sortOrder, label, parentKeyOverride };
        }
        return map;
    }
    async getSidebarForRole(companyId, roleName) {
        var _a;
        const elements = await this.prisma.uiControlElement.findMany({
            where: { companyId, isActive: true, elementType: { in: ['SIDEBAR_SECTION', 'SIDEBAR_ITEM'] } },
            include: { overrides: { where: { isActive: true, scopeType: 'ROLE', roleName } } },
        });
        if (roleName === 'SUPER_ADMIN') {
            return this.buildRoleAwareSidebar(elements, () => ({ visible: true }));
        }
        const effectiveByKey = {};
        for (const el of elements) {
            const ov = el.overrides[0];
            effectiveByKey[el.key] = {
                visible: ov ? ov.isVisible : el.defaultVisible,
                label: (ov === null || ov === void 0 ? void 0 : ov.customLabel) || el.label,
                sortOrder: (_a = ov === null || ov === void 0 ? void 0 : ov.sortOrderOverride) !== null && _a !== void 0 ? _a : el.sortOrder,
                parentKeyOverride: ov === null || ov === void 0 ? void 0 : ov.parentKeyOverride,
            };
        }
        return this.buildRoleAwareSidebar(elements, (key) => effectiveByKey[key]);
    }
};
exports.UiControlService = UiControlService;
exports.UiControlService = UiControlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UiControlService);
//# sourceMappingURL=ui-control.service.js.map