import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Task #59 decision: HourlyProductionReport was defined in schema.prisma
// (with FKs to Company/User/WorkOrder) but had zero service, controller,
// module, DTO or test consumers anywhere in the codebase - the hour-by-hour
// target-vs-actual capture it was meant for is done outside the ERP today
// (the separate Google Sheets hourly production board). It was removed
// cleanly (model dropped from schema.prisma, table dropped by
// 164_product_hourly_daily_targets.sql) rather than left half-wired
// against the new Product.hourlyTarget/dailyTarget fields. These tests
// guard against it (or a stray reference to it) silently reappearing.

const REPO_ROOT = join(__dirname, '..', '..');

function collectFiles(dir: string, exts: string[], acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, exts, acc);
    } else if (exts.some((ext) => entry.endsWith(ext))) {
      acc.push(full);
    }
  }
  return acc;
}

describe('HourlyProductionReport removal (dead code, no live usage)', () => {
  it('is no longer defined in prisma/schema.prisma', () => {
    const schema = readFileSync(join(REPO_ROOT, 'prisma', 'schema.prisma'), 'utf8');
    expect(schema).not.toContain('HourlyProductionReport');
    expect(schema).not.toContain('hourly_production_reports');
  });

  it('has no remaining references anywhere under src/ (excluding this guard test itself)', () => {
    const files = collectFiles(join(REPO_ROOT, 'src'), ['.ts']).filter(
      (f) => f !== __filename,
    );
    const offenders = files.filter((f) => readFileSync(f, 'utf8').includes('HourlyProductionReport'));
    expect(offenders).toEqual([]);
  });
});
