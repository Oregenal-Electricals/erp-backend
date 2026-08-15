// erp-backend/src/ui-control/ui-control.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SyncElementDto,
  CreateElementDto,
  UpdateElementDto,
  ReorderItemDto,
  UpsertOverrideDto,
} from './dto/ui-control.dto';

@Injectable()
export class UiControlService {
  constructor(private prisma: PrismaService) {}

  async syncElements(companyId: string, elements: SyncElementDto[], userId: string) {
    const results = [];
    for (const el of elements) {
      const row = await this.prisma.uiControlElement.upsert({
        where: { companyId_key: { companyId, key: el.key } },
        update: {
          elementType: el.elementType, module: el.module, page: el.page, label: el.label,
          icon: el.icon, parentKey: el.parentKey, sortOrder: el.sortOrder ?? 0,
          defaultVisible: el.defaultVisible ?? true, updatedBy: userId,
        },
        create: {
          companyId, key: el.key, elementType: el.elementType, module: el.module, page: el.page,
          label: el.label, icon: el.icon, parentKey: el.parentKey, sortOrder: el.sortOrder ?? 0,
          defaultVisible: el.defaultVisible ?? true, createdBy: userId, updatedBy: userId,
        },
      });
      results.push(row);
    }
    return { synced: results.length, elements: results };
  }

  async createElement(companyId: string, dto: CreateElementDto, userId: string) {
    const existing = await this.prisma.uiControlElement.findUnique({
      where: { companyId_key: { companyId, key: dto.key } },
    });
    if (existing) throw new BadRequestException(`Key "${dto.key}" already exists`);
    return this.prisma.uiControlElement.create({
      data: { companyId, ...dto, createdBy: userId, updatedBy: userId },
    });
  }

  async updateElement(id: string, dto: UpdateElementDto, userId: string) {
    const el = await this.prisma.uiControlElement.findUnique({ where: { id } });
    if (!el) throw new NotFoundException('Element not found');
    return this.prisma.uiControlElement.update({ where: { id }, data: { ...dto, updatedBy: userId } });
  }

  async reorderElements(items: ReorderItemDto[], userId: string) {
    const ops = items.map((it) =>
      this.prisma.uiControlElement.update({
        where: { id: it.id },
        data: {
          sortOrder: it.sortOrder,
          ...(it.parentKey !== undefined ? { parentKey: it.parentKey } : {}),
          updatedBy: userId,
        },
      }),
    );
    await this.prisma.$transaction(ops);
    return { reordered: items.length };
  }

  async deleteElement(id: string) {
    const el = await this.prisma.uiControlElement.findUnique({ where: { id } });
    if (!el) throw new NotFoundException('Element not found');
    const childCount = await this.prisma.uiControlElement.count({
      where: { parentKey: el.key, isActive: true },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete "${el.label}" — it still has ${childCount} item(s) under it. Move or delete those first.`,
      );
    }
    return this.prisma.uiControlElement.update({ where: { id }, data: { isActive: false } });
  }

  async listElements(companyId: string, module?: string) {
    return this.prisma.uiControlElement.findMany({
      where: { companyId, isActive: true, ...(module ? { module } : {}) },
      include: { overrides: { where: { isActive: true } } },
      orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async getStructureTree(companyId: string) {
    const elements = await this.prisma.uiControlElement.findMany({
      where: { companyId, isActive: true, elementType: { in: ['SIDEBAR_SECTION', 'SIDEBAR_ITEM'] } },
      include: { overrides: { where: { isActive: true } } },
      orderBy: [{ sortOrder: 'asc' }],
    });
    const sections = elements.filter((e) => e.elementType === 'SIDEBAR_SECTION');
    // Nested items live under a section (parentKey set). A SIDEBAR_ITEM with
    // NO parentKey is a standalone top-level link (e.g. Dashboard) — it must
    // appear in the same top-level list as sections, not get silently dropped.
    const nestedItems = elements.filter((e) => e.elementType === 'SIDEBAR_ITEM' && e.parentKey);
    const standaloneItems = elements.filter((e) => e.elementType === 'SIDEBAR_ITEM' && !e.parentKey);

    const sectionNodes = sections.map((s) => ({
      ...s,
      items: nestedItems.filter((i) => i.parentKey === s.key).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
    const standaloneNodes = standaloneItems.map((i) => ({ ...i, items: [] }));

    return [...sectionNodes, ...standaloneNodes].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getPageElements(companyId: string) {
    const elements = await this.prisma.uiControlElement.findMany({
      where: { companyId, isActive: true, elementType: { in: ['FIELD', 'COLUMN', 'BUTTON', 'TAB', 'SECTION', 'STAT_CARD'] } },
      include: { overrides: { where: { isActive: true } } },
      orderBy: [{ module: 'asc' }, { page: 'asc' }, { sortOrder: 'asc' }],
    });
    const grouped: Record<string, any[]> = {};
    for (const el of elements) {
      const groupKey = `${el.module} — ${el.page || 'general'}`;
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(el);
    }
    return grouped;
  }

  // The real, renderable sidebar for the logged-in user. SUPER_ADMIN mirrors the
  // hardcoded bypass already in PermissionsGuard — never locked out of their own nav.
  async getMySidebar(companyId: string, userId: string, allRoles: string[]) {
    const tree = await this.getStructureTree(companyId);
    if (allRoles.includes('SUPER_ADMIN')) {
      return tree.map((s) => ({
        key: s.key, label: s.label, icon: s.icon, page: s.page,
        items: s.items.map((i) => ({ key: i.key, label: i.label, icon: i.icon, page: i.page })),
      }));
    }

    const visMap = await this.getEffectiveVisibility(companyId, userId, allRoles);
    return tree
      .filter((s) => visMap[s.key]?.visible !== false)
      .sort((a, b) => (visMap[a.key]?.sortOrder ?? 0) - (visMap[b.key]?.sortOrder ?? 0))
      .map((s) => ({
        key: s.key, label: visMap[s.key]?.label || s.label, icon: s.icon, page: s.page,
        items: s.items
          .filter((i) => visMap[i.key]?.visible !== false)
          .sort((a, b) => (visMap[a.key]?.sortOrder ?? 0) - (visMap[b.key]?.sortOrder ?? 0))
          .map((i) => ({ key: i.key, label: visMap[i.key]?.label || i.label, icon: i.icon, page: i.page })),
      }))
      .filter((s) => s.items.length > 0 || s.page);
  }

  async upsertOverride(companyId: string, dto: UpsertOverrideDto, userId: string) {
    const existing = await this.prisma.uiControlOverride.findFirst({
      where: {
        elementId: dto.elementId,
        scopeType: dto.scopeType,
        roleName: dto.scopeType === 'ROLE' ? dto.roleName ?? null : null,
        userId: dto.scopeType === 'USER' ? dto.userId ?? null : null,
      },
    });

    if (existing) {
      return this.prisma.uiControlOverride.update({
        where: { id: existing.id },
        data: {
          isVisible: dto.isVisible,
          sortOrderOverride: dto.sortOrderOverride,
          customLabel: dto.customLabel !== undefined ? (dto.customLabel || null) : existing.customLabel,
          updatedBy: userId,
        },
      });
    }

    const element = await this.prisma.uiControlElement.findUnique({ where: { id: dto.elementId } });
    if (!element) throw new NotFoundException('UI element not found');

    return this.prisma.uiControlOverride.create({
      data: {
        companyId, elementId: dto.elementId, scopeType: dto.scopeType,
        roleName: dto.scopeType === 'ROLE' ? dto.roleName : null,
        userId: dto.scopeType === 'USER' ? dto.userId : null,
        isVisible: dto.isVisible, sortOrderOverride: dto.sortOrderOverride,
        customLabel: dto.customLabel || null,
        createdBy: userId, updatedBy: userId,
      },
    });
  }

  async bulkUpsertOverrides(companyId: string, overrides: UpsertOverrideDto[], userId: string) {
    const results = [];
    for (const o of overrides) results.push(await this.upsertOverride(companyId, o, userId));
    return { updated: results.length };
  }

  async deleteOverride(id: string) {
    return this.prisma.uiControlOverride.update({ where: { id }, data: { isActive: false } });
  }

  // Merge order: defaultVisible -> ROLE override (any of the user's roles, most
  // restrictive wins if roles disagree) -> USER override (always wins).
  async getEffectiveVisibility(companyId: string, userId: string, allRoles: string[]) {
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

    const map: Record<string, { visible: boolean; sortOrder: number; label: string }> = {};
    for (const el of elements) {
      let visible = el.defaultVisible;
      let sortOrder = el.sortOrder;
      let label = el.label;

      const roleOverrides = el.overrides.filter((o) => o.scopeType === 'ROLE');
      if (roleOverrides.length > 0) {
        visible = roleOverrides.every((o) => o.isVisible);
        const withSort = roleOverrides.find((o) => o.sortOrderOverride != null);
        if (withSort) sortOrder = withSort.sortOrderOverride;
        const withLabel = roleOverrides.find((o) => o.customLabel);
        if (withLabel) label = withLabel.customLabel;
      }

      const userOverride = el.overrides.find((o) => o.scopeType === 'USER' && o.userId === userId);
      if (userOverride) {
        visible = userOverride.isVisible;
        if (userOverride.sortOrderOverride != null) sortOrder = userOverride.sortOrderOverride;
        if (userOverride.customLabel) label = userOverride.customLabel;
      }

      map[el.key] = { visible, sortOrder, label };
    }
    return map;
  }

  async getSidebarForRole(companyId: string, roleName: string) {
    const tree = await this.getStructureTree(companyId);
    if (roleName === 'SUPER_ADMIN') {
      return tree.map((s) => ({
        key: s.key, label: s.label, icon: s.icon, page: s.page,
        items: s.items.map((i) => ({ key: i.key, label: i.label, icon: i.icon, page: i.page })),
      }));
    }

    const elements = await this.prisma.uiControlElement.findMany({
      where: { companyId, isActive: true, elementType: { in: ['SIDEBAR_SECTION', 'SIDEBAR_ITEM'] } },
      include: { overrides: { where: { isActive: true, scopeType: 'ROLE', roleName } } },
    });
    const effectiveByKey: Record<string, { visible: boolean; label: string; sortOrder: number }> = {};
    for (const el of elements) {
      const ov = el.overrides[0];
      effectiveByKey[el.key] = {
        visible: ov ? ov.isVisible : el.defaultVisible,
        label: ov?.customLabel || el.label,
        sortOrder: ov?.sortOrderOverride ?? el.sortOrder,
      };
    }

    return tree
      .filter((s) => effectiveByKey[s.key]?.visible !== false)
      .sort((a, b) => (effectiveByKey[a.key]?.sortOrder ?? 0) - (effectiveByKey[b.key]?.sortOrder ?? 0))
      .map((s) => ({
        key: s.key, label: effectiveByKey[s.key]?.label || s.label, icon: s.icon, page: s.page,
        items: s.items
          .filter((i) => effectiveByKey[i.key]?.visible !== false)
          .sort((a, b) => (effectiveByKey[a.key]?.sortOrder ?? 0) - (effectiveByKey[b.key]?.sortOrder ?? 0))
          .map((i) => ({ key: i.key, label: effectiveByKey[i.key]?.label || i.label, icon: i.icon, page: i.page })),
      }))
      .filter((s) => s.items.length > 0 || s.page);
  }
}
