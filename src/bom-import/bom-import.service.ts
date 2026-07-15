import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { BomService } from '../bom/bom.service';
import { ConfirmBomImportDto } from './dto/bom-import.dto';

interface ParsedItem {
  sNo: any;
  partCode: string;
  description: string;
  package: string | null;
  quantity: number | null;
  uom: string;
  location: string | null;
  preferredMake: string | null;
  alternateMakes: string | null;
}
interface ParsedSection {
  name: string;
  items: ParsedItem[];
}

const STOP_MARKERS = ['Prepared By', 'Checked By', 'Verified By', 'Approved By'];

function parseQtyUom(val: any): [number | null, string] {
  if (val === null || val === undefined || val === '') return [null, 'PCS'];
  if (typeof val === 'number') return [val, 'PCS'];
  const s = String(val).trim();
  const m = s.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
  if (m) {
    const qty = parseFloat(m[1]);
    const uom = m[2] ? m[2].toUpperCase() : 'PCS';
    return [qty, uom];
  }
  return [null, 'PCS'];
}

function cellStr(v: any): string | null {
  if (v === null || v === undefined || v === '') return null;
  return String(v).trim();
}

@Injectable()
export class BomImportService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private bomService: BomService,
  ) {}

  /**
   * Parses raw row data (already normalized to array-of-arrays, one row
   * per array, columns indexed 0-7 matching the real BOM sheet layout:
   * S.No | Part Code | Description | Package | Quantity | Location |
   * Preferred Make | Alternate Makes) into product info + sections.
   * Shared by both the Excel and CSV parsers since both produce the
   * same row-array shape.
   */
  private parseRows(rows: any[][]) {
    const product: any = {};
    const docInfo: any = {};

    for (let i = 0; i < Math.min(6, rows.length); i++) {
      const row = rows[i] || [];
      const label = cellStr(row[2]);
      const value = cellStr(row[3]);
      if (label === 'Brand') product.brand = value;
      if (label === 'ERP Description') product.description = value;
      if (label === 'ERP Code') product.code = value;
      const docCell = cellStr(row[7]);
      if (docCell?.includes('Doc No')) docInfo.docNo = docCell.split(':').slice(1).join(':').trim();
      if (docCell?.includes('Rev no')) docInfo.revNo = docCell.split(':').slice(1).join(':').trim();
      if (docCell?.includes('Issue Date')) docInfo.issueDate = docCell.split(':').slice(1).join(':').trim();
    }

    let headerRowIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      const rowVals = (rows[i] || []).map((x) => cellStr(x) || '');
      if (rowVals.includes('Part Code') || rowVals.includes('S.NO.')) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx === -1) {
      throw new BadRequestException("Could not find the header row (expected a 'Part Code' / 'S.NO.' column). Is this the right file/sheet?");
    }

    const sections: ParsedSection[] = [];
    let currentSection: ParsedSection | null = null;

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const firstCell = cellStr(row[0]) || '';
      if (STOP_MARKERS.some((m) => firstCell.includes(m))) break;

      const partCode = cellStr(row[1]) || '';
      const descriptionCell = cellStr(row[2]);

      if (firstCell && !partCode && !descriptionCell) {
        currentSection = { name: firstCell, items: [] };
        sections.push(currentSection);
        continue;
      }
      if (!partCode && !descriptionCell) continue;
      if (!currentSection) {
        currentSection = { name: 'General', items: [] };
        sections.push(currentSection);
      }

      const [qty, uom] = parseQtyUom(row[4]);
      currentSection.items.push({
        sNo: row[0],
        partCode,
        description: descriptionCell || '',
        package: cellStr(row[3]),
        quantity: qty,
        uom,
        location: cellStr(row[5]),
        preferredMake: cellStr(row[6]),
        alternateMakes: cellStr(row[7]),
      });
    }

    return { product, docInfo, sections };
  }

  private rowsFromExcelBuffer(buffer: Buffer): any[][] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];
  }

  private rowsFromCsvBuffer(buffer: Buffer): any[][] {
    return parseCsv(buffer, { skip_empty_lines: false, relax_column_count: true }) as any[][];
  }

  async parseFile(file: Express.Multer.File, companyId: string) {
    const ext = file.originalname.toLowerCase().split('.').pop();
    let rows: any[][];

    if (ext === 'xlsx' || ext === 'xls') {
      rows = this.rowsFromExcelBuffer(file.buffer);
    } else if (ext === 'csv') {
      rows = this.rowsFromCsvBuffer(file.buffer);
    } else {
      throw new BadRequestException(`Unsupported file type ".${ext}" - please upload .xlsx, .csv, or .pdf`);
    }

    const parsed = this.parseRows(rows);
    return this.buildPreview(parsed, companyId);
  }

  /**
   * Cross-references parsed data against the database (without writing
   * anything) so the frontend can show a clear preview: which raw
   * materials already exist vs. will be newly created, and whether the
   * product itself already exists.
   */
  private async buildPreview(parsed: { product: any; docInfo: any; sections: ParsedSection[] }, companyId: string) {
    const allPartCodes = parsed.sections.flatMap((s) => s.items.map((i) => i.partCode)).filter(Boolean);
    const existingMaterials = allPartCodes.length
      ? await this.prisma.rawMaterial.findMany({
          where: { companyId, code: { in: allPartCodes } },
          select: { id: true, code: true },
        })
      : [];
    const existingCodeSet = new Set(existingMaterials.map((m) => m.code));
    const existingIdByCode = new Map(existingMaterials.map((m) => [m.code, m.id]));

    let existingProduct: any = null;
    if (parsed.product.code) {
      existingProduct = await this.prisma.product.findFirst({
        where: { companyId, code: parsed.product.code },
        select: { id: true, code: true, name: true },
      });
    }

    let totalItems = 0;
    let newCount = 0;
    for (const section of parsed.sections) {
      for (const item of section.items) {
        totalItems++;
        const exists = existingCodeSet.has(item.partCode);
        (item as any).existsAsRawMaterial = exists;
        (item as any).rawMaterialId = exists ? existingIdByCode.get(item.partCode) : undefined;
        if (!exists) newCount++;
      }
    }

    return {
      product: parsed.product,
      docInfo: parsed.docInfo,
      sections: parsed.sections,
      productExists: !!existingProduct,
      existingProduct,
      totalItems,
      newRawMaterialsCount: newCount,
      existingRawMaterialsCount: totalItems - newCount,
    };
  }

  /**
   * Creates everything: the Product (if new), any missing RawMaterials,
   * the BOM header, and every line item - reusing BomService.addItem()
   * for each item so the auto-zero-stock-balance hook fires exactly as
   * it does for a manually-entered BOM. All wrapped in one transaction:
   * either the whole import succeeds, or none of it is left half-done.
   */
  async confirmImport(dto: ConfirmBomImportDto, user: any) {
    const flatItems = dto.sections.flatMap((s) => s.items);
    if (flatItems.length === 0) throw new BadRequestException('No items to import');

    return this.prisma.$transaction(async (tx) => {
      let productId: string;

      if (dto.useExistingProductId) {
        const existing = await tx.product.findFirst({ where: { id: dto.useExistingProductId, companyId: user.companyId } });
        if (!existing) throw new NotFoundException('Selected existing product not found');
        productId = existing.id;
      } else {
        if (!dto.product.code || !dto.product.name) {
          throw new BadRequestException('Product code and name are required to create a new product');
        }
        const newProduct = await tx.product.create({
          data: {
            companyId: user.companyId,
            code: dto.product.code,
            name: dto.product.name,
            brand: dto.product.brand,
            description: dto.product.description,
            createdBy: user.id,
            updatedBy: user.id,
          },
        });
        productId = newProduct.id;
      }

      const existingActiveBom = await tx.bom.findFirst({
        where: { companyId: user.companyId, productId, status: { not: 'OBSOLETE' }, isActive: true },
      });
      if (existingActiveBom) {
        throw new BadRequestException(
          `This product already has an active BOM (${existingActiveBom.bomNumber}, ${existingActiveBom.status}). ` +
          `Use Bom Revisions to update it instead of importing a duplicate.`
        );
      }

      const bom = await tx.bom.create({
        data: {
          companyId: user.companyId,
          productId,
          bomNumber: await this.generateBomNumberInTx(tx, user.companyId),
          version: dto.bomVersion || 'v1',
          description: `Imported from BOM upload`,
          createdBy: user.id,
          updatedBy: user.id,
        },
      });

      // Look up the default warehouse once, up front, instead of once
      // per item - this alone cuts out dozens of redundant queries on a
      // large import.
      const defaultWarehouse = await tx.warehouse.findFirst({
        where: { companyId: user.companyId, isDefault: true },
      });

      let sequence = 1;
      let itemsCreated = 0;
      for (const item of flatItems) {
        if (!item.itemCode || !item.itemName) continue; // skip incomplete rows silently

        let rawMaterialId = item.rawMaterialId;
        if (!rawMaterialId) {
          const existingRm = await tx.rawMaterial.findFirst({ where: { companyId: user.companyId, code: item.itemCode } });
          if (existingRm) {
            rawMaterialId = existingRm.id;
          } else {
            const newRm = await tx.rawMaterial.create({
              data: {
                companyId: user.companyId,
                code: item.itemCode,
                name: item.itemName,
                brand: item.preferredMake || undefined,
                partNumber: item.itemCode,
                createdBy: user.id,
                updatedBy: user.id,
              },
            });
            rawMaterialId = newRm.id;

            // Build the ranked brand-preference list: preferred make is
            // rank 1, each alternate (slash-separated) fills the next
            // ranks in order - so if the preferred brand is unavailable
            // at purchase time, purchasing knows exactly which
            // substitute to try next.
            const brandNames: string[] = [];
            if (item.preferredMake) brandNames.push(item.preferredMake.trim());
            if (item.alternateMakes) {
              for (const alt of item.alternateMakes.split('/')) {
                const trimmed = alt.trim();
                if (trimmed && !brandNames.includes(trimmed)) brandNames.push(trimmed);
              }
            }
            if (brandNames.length > 0) {
              await tx.rawMaterialBrand.createMany({
                data: brandNames.map((brandName, idx) => ({
                  companyId: user.companyId,
                  rawMaterialId: newRm.id,
                  brandName,
                  preferenceOrder: idx + 1,
                  createdBy: user.id,
                  updatedBy: user.id,
                })),
              });
            }
          }
        }

        await this.bomService.addItem(
          bom.id,
          {
            sequence: sequence++,
            itemType: 'RAW_MATERIAL',
            rawMaterialId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            quantity: item.quantity,
            notes: [item.package && `Package: ${item.package}`, item.preferredMake && `Preferred: ${item.preferredMake}`, item.alternateMakes && `Alt: ${item.alternateMakes}`]
              .filter(Boolean)
              .join(' | ') || undefined,
          } as any,
          user,
          tx,
          { skipCostRecalc: true, skipAudit: true, defaultWarehouseId: defaultWarehouse?.id },
        );
        itemsCreated++;
      }

      // Recalculate the BOM's total cost once, after all items are in,
      // instead of after every single item.
      await tx.bom.update({ where: { id: bom.id }, data: { totalCost: 0 } }); // BomItems have no unitCost from import, so total is 0 until priced

      await this.audit.log({ tableName: 'boms', recordId: bom.id, action: 'CREATE', newValues: { ...bom, itemsCreated }, changedBy: user.id });

      return { bomId: bom.id, bomNumber: bom.bomNumber, productId, itemsImported: itemsCreated };
    }, { timeout: 120000, maxWait: 15000 });
  }

  private async generateBomNumberInTx(tx: any, companyId: string): Promise<string> {
    const count = await tx.bom.count({ where: { companyId } });
    return `BOM-IMP-${String(count + 1).padStart(4, '0')}`;
  }
}
