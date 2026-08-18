import { Prisma } from '@prisma/client';

// Real database column name per table for a given Prisma field name - most
// models use plain camelCase columns (no @map on the field itself), but a
// few older ones (e.g. UiControlElement/UiControlOverride) map every field
// individually to snake_case. Hardcoding field names as literal column
// names breaks silently on exactly those tables (raw SQL throws "column
// does not exist"). Resolved from Prisma's own DMMF field metadata instead.
// See dummy-data.service.ts for the original bug this was extracted from.
export function buildColumnMap(fieldName: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const model of Prisma.dmmf.datamodel.models) {
    const field = model.fields.find((f) => f.name === fieldName);
    if (field) map.set(model.dbName || model.name, (field as any).dbName || field.name);
  }
  return map;
}

export function getTableNamesWithField(fieldName: string, excludeModelNames: string[] = []): string[] {
  return Prisma.dmmf.datamodel.models
    .filter((m) => m.fields.some((f) => f.name === fieldName) && !excludeModelNames.includes(m.name))
    .map((m) => m.dbName || m.name);
}

export const ALL_TABLE_NAMES: Set<string> = new Set(
  Prisma.dmmf.datamodel.models.map((m) => m.dbName || m.name),
);

export const IS_TEST_DATA_COLUMN = buildColumnMap('isTestData');
export const COMPANY_ID_COLUMN = buildColumnMap('companyId');
export const IS_ACTIVE_COLUMN = buildColumnMap('isActive');

export const HAS_COMPANY_ID: Set<string> = new Set(getTableNamesWithField('companyId'));
export const HAS_IS_ACTIVE: Set<string> = new Set(getTableNamesWithField('isActive'));
