import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCustomFieldDefinitionDto, UpdateCustomFieldDefinitionDto, SaveCustomFieldValuesDto } from './dto/custom-field.dto';

@Injectable()
export class CustomFieldService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ── DEFINITIONS ──────────────────────────────────────────────
  async createDefinition(dto: CreateCustomFieldDefinitionDto, user: any) {
    const exists = await this.prisma.customFieldDefinition.findUnique({
      where: { companyId_module_fieldKey: { companyId: user.companyId, module: dto.module, fieldKey: dto.fieldKey } },
    });
    if (exists) throw new ConflictException(`Field key "${dto.fieldKey}" already exists for module ${dto.module}`);

    const def = await this.prisma.customFieldDefinition.create({
      data: {
        ...dto,
        options: dto.options ? dto.options : undefined,
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'custom_field_definitions', recordId: def.id, action: 'CREATE', newValues: def, changedBy: user.id });
    return def;
  }

  async getDefinitions(module: string, user: any) {
    const where: any = { companyId: user.companyId, isActive: true };
    if (module) where.module = module;
    return this.prisma.customFieldDefinition.findMany({
      where, orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async getAllDefinitions(user: any) {
    return this.prisma.customFieldDefinition.findMany({
      where: { companyId: user.companyId },
      orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async updateDefinition(id: string, dto: UpdateCustomFieldDefinitionDto, user: any) {
    const def = await this.prisma.customFieldDefinition.findFirst({ where: { id, companyId: user.companyId } });
    if (!def) throw new NotFoundException('Custom field definition not found');
    const updated = await this.prisma.customFieldDefinition.update({
      where: { id },
      data: { ...dto, options: dto.options ? dto.options : undefined, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'custom_field_definitions', recordId: id, action: 'UPDATE', oldValues: def, newValues: updated, changedBy: user.id });
    return updated;
  }

  async deleteDefinition(id: string, user: any) {
    const def = await this.prisma.customFieldDefinition.findFirst({ where: { id, companyId: user.companyId } });
    if (!def) throw new NotFoundException('Custom field definition not found');
    const updated = await this.prisma.customFieldDefinition.update({
      where: { id }, data: { isActive: false, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'custom_field_definitions', recordId: id, action: 'DELETE', oldValues: def, newValues: updated, changedBy: user.id });
    return { message: 'Custom field deactivated' };
  }

  // ── VALUES ────────────────────────────────────────────────────
  async getValues(module: string, recordId: string, user: any) {
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
    return definitions.map(def => ({
      ...def,
      value: valueMap[def.fieldKey] ?? def.defaultValue ?? null,
    }));
  }

  async saveValues(module: string, recordId: string, dto: any, user: any) {
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

  async getStats(user: any) {
    const defs = await this.prisma.customFieldDefinition.findMany({
      where: { companyId: user.companyId },
    });
    const byModule: Record<string, number> = {};
    defs.forEach(d => { byModule[d.module] = (byModule[d.module] || 0) + 1; });
    const totalValues = await this.prisma.customFieldValue.count({ where: { companyId: user.companyId } });
    return { totalFields: defs.length, activeFields: defs.filter(d => d.isActive).length, byModule, totalValues };
  }
}
