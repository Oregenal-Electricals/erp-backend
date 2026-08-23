import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

export interface ParsedTemplate {
  sheetName: string;
  name: string;
  docCode: string | null;
  parameters: { sNo: number; category: string; parameterName: string; specification: string }[];
  error: string | null;
}

const TITLE_ROW_INDEX = 1;
const DOC_CODE_COL_INDEX = 7;
const DATA_START_ROW_INDEX = 6;
const STOP_MARKERS = ['Final Status', 'Prepd. By', 'Prepared By', 'Checked By'];

@Injectable()
export class IqcTemplateImportService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  parseWorkbook(file: Express.Multer.File): ParsedTemplate[] {
    const ext = file.originalname.toLowerCase().split('.').pop();
    if (ext !== 'xlsx' && ext !== 'xls') {
      throw new BadRequestException(`Unsupported file type ".${ext}" - please upload .xlsx or .xls`);
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const results: ParsedTemplate[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
      try {
        results.push(this.parseSheet(sheetName, rows));
      } catch (e: any) {
        results.push({ sheetName, name: sheetName, docCode: null, parameters: [], error: e.message || 'Could not parse this sheet' });
      }
    }
    return results;
  }

  private parseSheet(sheetName: string, rows: any[][]): ParsedTemplate {
    const titleRow = rows[TITLE_ROW_INDEX];
    if (!titleRow) throw new Error('Sheet is empty or too short to be a check sheet');

    // The sheet tab name is the canonical template name - Excel
    // guarantees tab names are unique within a workbook, so this
    // avoids any name-collision handling entirely. The "IQC
    // INSPECTION OF ..." title text in the sheet itself is
    // display-only and not used for identity.
    const name = sheetName.trim();
    const docCode = titleRow[DOC_CODE_COL_INDEX] ? String(titleRow[DOC_CODE_COL_INDEX]).trim() : null;

    const parameters: ParsedTemplate['parameters'] = [];
    for (let r = DATA_START_ROW_INDEX; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const firstCellText = String(row[0] || '').trim();
      if (STOP_MARKERS.some(marker => firstCellText.toLowerCase().startsWith(marker.toLowerCase()))) break;

      const sNoRaw = row[1];
      const category = row[2] ? String(row[2]).trim() : null;
      const parameterName = row[3] ? String(row[3]).trim() : null;
      const specification = row[4] ? String(row[4]).trim() : null;
      if (sNoRaw == null && !category && !parameterName && !specification) continue;
      if (!parameterName || !specification) continue;

      parameters.push({ sNo: Number(sNoRaw) || parameters.length + 1, category: category || 'Major', parameterName, specification });
    }

    if (parameters.length === 0) throw new Error('No parameter rows found - check the sheet matches the expected format');
    return { sheetName, name, docCode, parameters, error: null };
  }

  async confirmImport(parsed: { sheetName: string; name: string; docCode?: string | null; parameters: { sNo: number; category: string; parameterName: string; specification: string }[]; error?: string | null }[], user: any) {
    const created: string[] = [];
    const skipped: { sheetName: string; reason: string }[] = [];

    for (const t of parsed) {
      if (t.error || t.parameters.length === 0) {
        skipped.push({ sheetName: t.sheetName, reason: t.error || 'No parameters' });
        continue;
      }

      // Sheet names are the canonical template name and Excel
      // guarantees they're unique within a workbook, so a real
      // collision here only means this exact template was already
      // imported before - skip it rather than create a confusing
      // duplicate under a modified name.
      const existing = await this.prisma.iqcCheckTemplate.findFirst({ where: { companyId: user.companyId, name: t.name, isActive: true, isCurrent: true } });
      if (existing) {
        skipped.push({ sheetName: t.sheetName, reason: `A template named "${t.name}" already exists` });
        continue;
      }

      const template = await this.prisma.iqcCheckTemplate.create({
        data: {
          companyId: user.companyId,
          name: t.name,
          reviewed: false,
          docCode: t.docCode,
          createdBy: user.id, updatedBy: user.id,
          parameters: {
            create: t.parameters.map((p, idx) => ({
              companyId: user.companyId,
              sNo: p.sNo,
              category: p.category,
              parameterName: p.parameterName,
              specification: p.specification,
              sortOrder: idx,
              createdBy: user.id, updatedBy: user.id,
            })),
          },
        },
      });
      created.push(template.name);
      await this.audit.log({ tableName: 'iqc_check_templates', recordId: template.id, action: 'CREATE', newValues: template, changedBy: user.id });
    }

    return { createdCount: created.length, created, skippedCount: skipped.length, skipped };
  }
}
