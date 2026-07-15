"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BomImportService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = __importStar(require("xlsx"));
const sync_1 = require("csv-parse/sync");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const bom_service_1 = require("../bom/bom.service");
const STOP_MARKERS = ['Prepared By', 'Checked By', 'Verified By', 'Approved By'];
function parseQtyUom(val) {
    if (val === null || val === undefined || val === '')
        return [null, 'PCS'];
    if (typeof val === 'number')
        return [val, 'PCS'];
    const s = String(val).trim();
    const m = s.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
    if (m) {
        const qty = parseFloat(m[1]);
        const uom = m[2] ? m[2].toUpperCase() : 'PCS';
        return [qty, uom];
    }
    return [null, 'PCS'];
}
function cellStr(v) {
    if (v === null || v === undefined || v === '')
        return null;
    return String(v).trim();
}
let BomImportService = class BomImportService {
    constructor(prisma, audit, bomService) {
        this.prisma = prisma;
        this.audit = audit;
        this.bomService = bomService;
    }
    parseRows(rows) {
        const product = {};
        const docInfo = {};
        for (let i = 0; i < Math.min(6, rows.length); i++) {
            const row = rows[i] || [];
            const label = cellStr(row[2]);
            const value = cellStr(row[3]);
            if (label === 'Brand')
                product.brand = value;
            if (label === 'ERP Description')
                product.description = value;
            if (label === 'ERP Code')
                product.code = value;
            const docCell = cellStr(row[7]);
            if (docCell === null || docCell === void 0 ? void 0 : docCell.includes('Doc No'))
                docInfo.docNo = docCell.split(':').slice(1).join(':').trim();
            if (docCell === null || docCell === void 0 ? void 0 : docCell.includes('Rev no'))
                docInfo.revNo = docCell.split(':').slice(1).join(':').trim();
            if (docCell === null || docCell === void 0 ? void 0 : docCell.includes('Issue Date'))
                docInfo.issueDate = docCell.split(':').slice(1).join(':').trim();
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
            throw new common_1.BadRequestException("Could not find the header row (expected a 'Part Code' / 'S.NO.' column). Is this the right file/sheet?");
        }
        const sections = [];
        let currentSection = null;
        for (let i = headerRowIdx + 1; i < rows.length; i++) {
            const row = rows[i] || [];
            const firstCell = cellStr(row[0]) || '';
            if (STOP_MARKERS.some((m) => firstCell.includes(m)))
                break;
            const partCode = cellStr(row[1]) || '';
            const descriptionCell = cellStr(row[2]);
            if (firstCell && !partCode && !descriptionCell) {
                currentSection = { name: firstCell, items: [] };
                sections.push(currentSection);
                continue;
            }
            if (!partCode && !descriptionCell)
                continue;
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
    rowsFromExcelBuffer(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    }
    rowsFromCsvBuffer(buffer) {
        return (0, sync_1.parse)(buffer, { skip_empty_lines: false, relax_column_count: true });
    }
    async parseFile(file, companyId) {
        const ext = file.originalname.toLowerCase().split('.').pop();
        let rows;
        if (ext === 'xlsx' || ext === 'xls') {
            rows = this.rowsFromExcelBuffer(file.buffer);
        }
        else if (ext === 'csv') {
            rows = this.rowsFromCsvBuffer(file.buffer);
        }
        else {
            throw new common_1.BadRequestException(`Unsupported file type ".${ext}" - please upload .xlsx, .csv, or .pdf`);
        }
        const parsed = this.parseRows(rows);
        return this.buildPreview(parsed, companyId);
    }
    async buildPreview(parsed, companyId) {
        if (!parsed.product.name && parsed.product.description) {
            parsed.product.name = parsed.product.description;
        }
        const allPartCodes = parsed.sections.flatMap((s) => s.items.map((i) => i.partCode)).filter(Boolean);
        const existingMaterials = allPartCodes.length
            ? await this.prisma.rawMaterial.findMany({
                where: { companyId, code: { in: allPartCodes } },
                select: { id: true, code: true },
            })
            : [];
        const existingCodeSet = new Set(existingMaterials.map((m) => m.code));
        const existingIdByCode = new Map(existingMaterials.map((m) => [m.code, m.id]));
        let existingProduct = null;
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
                item.existsAsRawMaterial = exists;
                item.rawMaterialId = exists ? existingIdByCode.get(item.partCode) : undefined;
                if (!exists)
                    newCount++;
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
    async confirmImport(dto, user) {
        const flatItems = dto.sections.flatMap((s) => s.items);
        if (flatItems.length === 0)
            throw new common_1.BadRequestException('No items to import');
        return this.prisma.$transaction(async (tx) => {
            let productId;
            let productBrand;
            if (dto.useExistingProductId) {
                const existing = await tx.product.findFirst({ where: { id: dto.useExistingProductId, companyId: user.companyId } });
                if (!existing)
                    throw new common_1.NotFoundException('Selected existing product not found');
                productId = existing.id;
                productBrand = existing.brand;
            }
            else {
                if (!dto.product.code || !dto.product.name) {
                    throw new common_1.BadRequestException('Product code and name are required to create a new product');
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
                productBrand = newProduct.brand;
            }
            const existingActiveBom = await tx.bom.findFirst({
                where: { companyId: user.companyId, productId, status: { not: 'OBSOLETE' }, isActive: true },
            });
            if (existingActiveBom) {
                throw new common_1.BadRequestException(`This product already has an active BOM (${existingActiveBom.bomNumber}, ${existingActiveBom.status}). ` +
                    `Use Bom Revisions to update it instead of importing a duplicate.`);
            }
            const bom = await tx.bom.create({
                data: {
                    companyId: user.companyId,
                    productId,
                    bomNumber: await this.generateBomNumberInTx(tx, user.companyId, productBrand),
                    version: dto.bomVersion || 'v1',
                    description: `Imported from BOM upload`,
                    createdBy: user.id,
                    updatedBy: user.id,
                },
            });
            const defaultWarehouse = await tx.warehouse.findFirst({
                where: { companyId: user.companyId, isDefault: true },
            });
            let sequence = 1;
            let itemsCreated = 0;
            for (const item of flatItems) {
                if (!item.itemCode || !item.itemName)
                    continue;
                let rawMaterialId = item.rawMaterialId;
                if (!rawMaterialId) {
                    const existingRm = await tx.rawMaterial.findFirst({ where: { companyId: user.companyId, code: item.itemCode } });
                    if (existingRm) {
                        rawMaterialId = existingRm.id;
                    }
                    else {
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
                        const brandNames = [];
                        if (item.preferredMake)
                            brandNames.push(item.preferredMake.trim());
                        if (item.alternateMakes) {
                            for (const alt of item.alternateMakes.split('/')) {
                                const trimmed = alt.trim();
                                if (trimmed && !brandNames.includes(trimmed))
                                    brandNames.push(trimmed);
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
                await this.bomService.addItem(bom.id, {
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
                }, user, tx, { skipCostRecalc: true, skipAudit: true, defaultWarehouseId: defaultWarehouse === null || defaultWarehouse === void 0 ? void 0 : defaultWarehouse.id });
                itemsCreated++;
            }
            await tx.bom.update({ where: { id: bom.id }, data: { totalCost: 0 } });
            await this.audit.log({ tableName: 'boms', recordId: bom.id, action: 'CREATE', newValues: Object.assign(Object.assign({}, bom), { itemsCreated }), changedBy: user.id });
            return { bomId: bom.id, bomNumber: bom.bomNumber, productId, itemsImported: itemsCreated };
        }, { timeout: 120000, maxWait: 15000 });
    }
    sanitizeBrandPrefix(brand) {
        if (!brand)
            return 'GEN';
        const cleaned = brand.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        return cleaned || 'GEN';
    }
    async generateBomNumberInTx(tx, companyId, brand) {
        const prefix = this.sanitizeBrandPrefix(brand);
        const count = await tx.bom.count({ where: { companyId, bomNumber: { startsWith: `${prefix}-` } } });
        return `${prefix}-${String(count + 1).padStart(4, '0')}`;
    }
};
exports.BomImportService = BomImportService;
exports.BomImportService = BomImportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        bom_service_1.BomService])
], BomImportService);
//# sourceMappingURL=bom-import.service.js.map