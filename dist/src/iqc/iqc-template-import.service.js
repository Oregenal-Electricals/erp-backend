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
exports.IqcTemplateImportService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = __importStar(require("xlsx"));
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const TITLE_ROW_INDEX = 1;
const DOC_CODE_COL_INDEX = 7;
const DATA_START_ROW_INDEX = 6;
const STOP_MARKERS = ['Final Status', 'Prepd. By', 'Prepared By', 'Checked By'];
let IqcTemplateImportService = class IqcTemplateImportService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    parseWorkbook(file) {
        const ext = file.originalname.toLowerCase().split('.').pop();
        if (ext !== 'xlsx' && ext !== 'xls') {
            throw new common_1.BadRequestException(`Unsupported file type ".${ext}" - please upload .xlsx or .xls`);
        }
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const results = [];
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
            try {
                results.push(this.parseSheet(sheetName, rows));
            }
            catch (e) {
                results.push({ sheetName, name: sheetName, docCode: null, parameters: [], error: e.message || 'Could not parse this sheet' });
            }
        }
        return results;
    }
    parseSheet(sheetName, rows) {
        const titleRow = rows[TITLE_ROW_INDEX];
        if (!titleRow)
            throw new Error('Sheet is empty or too short to be a check sheet');
        const rawTitle = String(titleRow[0] || '').trim();
        const name = rawTitle.replace(/^IQC INSPECTION OF\s*/i, '').trim() || sheetName;
        const docCode = titleRow[DOC_CODE_COL_INDEX] ? String(titleRow[DOC_CODE_COL_INDEX]).trim() : null;
        const parameters = [];
        for (let r = DATA_START_ROW_INDEX; r < rows.length; r++) {
            const row = rows[r];
            if (!row)
                continue;
            const firstCellText = String(row[0] || '').trim();
            if (STOP_MARKERS.some(marker => firstCellText.toLowerCase().startsWith(marker.toLowerCase())))
                break;
            const sNoRaw = row[1];
            const category = row[2] ? String(row[2]).trim() : null;
            const parameterName = row[3] ? String(row[3]).trim() : null;
            const specification = row[4] ? String(row[4]).trim() : null;
            if (sNoRaw == null && !category && !parameterName && !specification)
                continue;
            if (!parameterName || !specification)
                continue;
            parameters.push({
                sNo: Number(sNoRaw) || parameters.length + 1,
                category: category || 'Major',
                parameterName,
                specification,
            });
        }
        if (parameters.length === 0)
            throw new Error('No parameter rows found - check the sheet matches the expected format');
        return { sheetName, name, docCode, parameters, error: null };
    }
    async confirmImport(parsed, user) {
        const created = [];
        const skipped = [];
        const namesUsedThisBatch = new Set();
        for (const t of parsed) {
            if (t.error || t.parameters.length === 0) {
                skipped.push({ sheetName: t.sheetName, reason: t.error || 'No parameters' });
                continue;
            }
            let finalName = t.name;
            const existing = await this.prisma.iqcCheckTemplate.findFirst({ where: { companyId: user.companyId, name: finalName, isActive: true } });
            if (existing || namesUsedThisBatch.has(finalName)) {
                finalName = `${t.name} — ${t.sheetName}`;
            }
            namesUsedThisBatch.add(finalName);
            const template = await this.prisma.iqcCheckTemplate.create({
                data: {
                    companyId: user.companyId,
                    name: finalName,
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
};
exports.IqcTemplateImportService = IqcTemplateImportService;
exports.IqcTemplateImportService = IqcTemplateImportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], IqcTemplateImportService);
//# sourceMappingURL=iqc-template-import.service.js.map