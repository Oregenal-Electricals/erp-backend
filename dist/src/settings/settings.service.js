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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const DEFAULT_SETTINGS = [
    {
        key: 'app_name',
        value: 'Smart Manufacturing ERP',
        category: 'GENERAL',
        description: 'Application name',
    },
    {
        key: 'app_version',
        value: '1.0.0',
        category: 'GENERAL',
        description: 'Application version',
    },
    {
        key: 'timezone',
        value: 'Asia/Kolkata',
        category: 'GENERAL',
        description: 'Default timezone',
    },
    {
        key: 'date_format',
        value: 'DD/MM/YYYY',
        category: 'GENERAL',
        description: 'Date display format',
    },
    {
        key: 'currency_code',
        value: 'INR',
        category: 'FINANCE',
        description: 'Default currency',
    },
    {
        key: 'currency_symbol',
        value: '₹',
        category: 'FINANCE',
        description: 'Currency symbol',
    },
    {
        key: 'gst_enabled',
        value: 'true',
        category: 'FINANCE',
        description: 'GST enabled',
    },
    {
        key: 'decimal_places',
        value: '2',
        category: 'FINANCE',
        description: 'Decimal places for amounts',
    },
    {
        key: 'approval_po',
        value: 'true',
        category: 'APPROVAL',
        description: 'Purchase Order requires approval',
    },
    {
        key: 'approval_grn',
        value: 'false',
        category: 'APPROVAL',
        description: 'GRN requires approval',
    },
    {
        key: 'approval_inv',
        value: 'true',
        category: 'APPROVAL',
        description: 'Invoice requires approval',
    },
    {
        key: 'max_login_attempts',
        value: '5',
        category: 'SECURITY',
        description: 'Max failed login attempts before lock',
    },
    {
        key: 'session_timeout',
        value: '24',
        category: 'SECURITY',
        description: 'Session timeout in hours',
    },
    {
        key: 'password_expiry',
        value: '90',
        category: 'SECURITY',
        description: 'Password expiry in days (0 = never)',
    },
];
const DEFAULT_SERIES = [
    {
        documentType: 'PO',
        prefix: 'PO',
        separator: '-',
        includeYear: true,
        yearFormat: 'YY-YY',
        padding: 4,
    },
    {
        documentType: 'GRN',
        prefix: 'GRN',
        separator: '-',
        includeYear: true,
        yearFormat: 'YY-YY',
        padding: 4,
    },
    {
        documentType: 'INV',
        prefix: 'INV',
        separator: '-',
        includeYear: true,
        yearFormat: 'YY-YY',
        padding: 4,
    },
    {
        documentType: 'WO',
        prefix: 'WO',
        separator: '-',
        includeYear: true,
        yearFormat: 'YY-YY',
        padding: 4,
    },
    {
        documentType: 'DC',
        prefix: 'DC',
        separator: '-',
        includeYear: true,
        yearFormat: 'YY-YY',
        padding: 4,
    },
    {
        documentType: 'QC',
        prefix: 'QC',
        separator: '-',
        includeYear: true,
        yearFormat: 'YY-YY',
        padding: 4,
    },
    {
        documentType: 'MR',
        prefix: 'MR',
        separator: '-',
        includeYear: true,
        yearFormat: 'YY-YY',
        padding: 4,
    },
    {
        documentType: 'SR',
        prefix: 'SR',
        separator: '-',
        includeYear: true,
        yearFormat: 'YY-YY',
        padding: 4,
    },
];
let SettingsService = class SettingsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async initializeDefaultSettings(userId) {
        let created = 0;
        for (const setting of DEFAULT_SETTINGS) {
            const existing = await this.prisma.systemSetting.findUnique({
                where: { key: setting.key },
            });
            if (!existing) {
                await this.prisma.systemSetting.create({
                    data: Object.assign(Object.assign({}, setting), { createdBy: userId, updatedBy: userId }),
                });
                created++;
            }
        }
        return { message: `Initialized ${created} default settings` };
    }
    async getAllSettings(category) {
        return this.prisma.systemSetting.findMany({
            where: category ? { category } : {},
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });
    }
    async getSetting(key) {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key },
        });
        if (!setting)
            throw new common_1.NotFoundException(`Setting "${key}" not found`);
        return setting;
    }
    async getSettingValue(key, defaultValue) {
        var _a, _b;
        try {
            const setting = await this.prisma.systemSetting.findUnique({
                where: { key },
            });
            return (_b = (_a = setting === null || setting === void 0 ? void 0 : setting.value) !== null && _a !== void 0 ? _a : defaultValue) !== null && _b !== void 0 ? _b : '';
        }
        catch (_c) {
            return defaultValue !== null && defaultValue !== void 0 ? defaultValue : '';
        }
    }
    async updateSetting(key, dto, userId) {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key },
        });
        if (!setting) {
            const created = await this.prisma.systemSetting.create({
                data: {
                    key,
                    value: dto.value,
                    description: dto.description,
                    createdBy: userId,
                    updatedBy: userId,
                },
            });
            return created;
        }
        const updated = await this.prisma.systemSetting.update({
            where: { key },
            data: {
                value: dto.value,
                description: dto.description,
                updatedBy: userId,
            },
        });
        await this.audit.log({
            tableName: 'system_settings',
            recordId: setting.id,
            action: 'UPDATE',
            oldValues: { key, value: setting.value },
            newValues: { key, value: dto.value },
            changedBy: userId,
        });
        return updated;
    }
    async bulkUpdateSettings(dto, userId) {
        const results = [];
        for (const [key, value] of Object.entries(dto.settings)) {
            const result = await this.updateSetting(key, { value }, userId);
            results.push(result);
        }
        return { updated: results.length, settings: results };
    }
    async initializeDefaultSeries(companyId, userId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        let created = 0;
        for (const series of DEFAULT_SERIES) {
            const existing = await this.prisma.numberingSeries.findUnique({
                where: {
                    companyId_documentType: {
                        companyId,
                        documentType: series.documentType,
                    },
                },
            });
            if (!existing) {
                await this.prisma.numberingSeries.create({
                    data: Object.assign(Object.assign({}, series), { companyId, createdBy: userId, updatedBy: userId }),
                });
                created++;
            }
        }
        return {
            message: `Initialized ${created} numbering series for ${company.name}`,
        };
    }
    async getAllSeries(companyId) {
        return this.prisma.numberingSeries.findMany({
            where: companyId ? { companyId } : {},
            include: { company: { select: { id: true, name: true, code: true } } },
            orderBy: [{ companyId: 'asc' }, { documentType: 'asc' }],
        });
    }
    async getOneSeries(id) {
        const series = await this.prisma.numberingSeries.findUnique({
            where: { id },
            include: { company: { select: { id: true, name: true } } },
        });
        if (!series)
            throw new common_1.NotFoundException('Numbering series not found');
        return series;
    }
    async createSeries(dto, userId) {
        const company = await this.prisma.company.findUnique({
            where: { id: dto.companyId },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        const existing = await this.prisma.numberingSeries.findUnique({
            where: {
                companyId_documentType: {
                    companyId: dto.companyId,
                    documentType: dto.documentType,
                },
            },
        });
        if (existing)
            throw new common_1.ConflictException(`Series for ${dto.documentType} already exists`);
        const series = await this.prisma.numberingSeries.create({
            data: Object.assign(Object.assign({}, dto), { createdBy: userId, updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'numbering_series',
            recordId: series.id,
            action: 'CREATE',
            newValues: series,
            changedBy: userId,
        });
        return series;
    }
    async updateSeries(id, dto, userId) {
        const series = await this.prisma.numberingSeries.findUnique({
            where: { id },
        });
        if (!series)
            throw new common_1.NotFoundException('Numbering series not found');
        if (series.isLocked) {
            const allowedChanges = ['padding', 'separator'];
            const requestedChanges = Object.keys(dto);
            const disallowed = requestedChanges.filter((k) => !allowedChanges.includes(k));
            if (disallowed.length > 0) {
                throw new common_1.BadRequestException(`Cannot change ${disallowed.join(', ')} — series is locked after first use`);
            }
        }
        const updated = await this.prisma.numberingSeries.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: userId }),
        });
        await this.audit.log({
            tableName: 'numbering_series',
            recordId: id,
            action: 'UPDATE',
            oldValues: series,
            newValues: dto,
            changedBy: userId,
        });
        return updated;
    }
    async getNextNumber(companyId, documentType) {
        const series = await this.prisma.numberingSeries.findUnique({
            where: { companyId_documentType: { companyId, documentType } },
        });
        if (!series) {
            throw new common_1.NotFoundException(`No numbering series found for ${documentType}. Please configure it in Settings.`);
        }
        if (!series.isActive) {
            throw new common_1.BadRequestException(`Numbering series for ${documentType} is inactive`);
        }
        const updated = await this.prisma.numberingSeries.update({
            where: { id: series.id },
            data: {
                currentNumber: { increment: 1 },
                isLocked: true,
                updatedBy: 'system',
            },
        });
        const nextNum = updated.currentNumber;
        const padded = String(nextNum).padStart(series.padding, '0');
        let docNumber = series.prefix;
        if (series.includeYear) {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const fiscalYear = month >= 4 ? year : year - 1;
            const nextFiscalYear = fiscalYear + 1;
            let yearStr = '';
            if (series.yearFormat === 'YY-YY') {
                yearStr = `${String(fiscalYear).slice(2)}-${String(nextFiscalYear).slice(2)}`;
            }
            else if (series.yearFormat === 'YYYY') {
                yearStr = String(fiscalYear);
            }
            else if (series.yearFormat === 'YY') {
                yearStr = String(fiscalYear).slice(2);
            }
            else {
                yearStr = `${String(fiscalYear).slice(2)}-${String(nextFiscalYear).slice(2)}`;
            }
            docNumber = `${series.prefix}${series.separator}${yearStr}${series.separator}${padded}`;
        }
        else {
            docNumber = `${series.prefix}${series.separator}${padded}`;
        }
        await this.prisma.numberingSeries.update({
            where: { id: series.id },
            data: { lastGenerated: docNumber, updatedBy: 'system' },
        });
        return docNumber;
    }
    async previewNextNumber(companyId, documentType) {
        const series = await this.prisma.numberingSeries.findUnique({
            where: { companyId_documentType: { companyId, documentType } },
        });
        if (!series)
            throw new common_1.NotFoundException(`No series for ${documentType}`);
        const nextNum = series.currentNumber + 1;
        const padded = String(nextNum).padStart(series.padding, '0');
        let docNumber = series.prefix;
        if (series.includeYear) {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const fiscalYear = month >= 4 ? year : year - 1;
            const nextFiscalYear = fiscalYear + 1;
            const yearStr = `${String(fiscalYear).slice(2)}-${String(nextFiscalYear).slice(2)}`;
            docNumber = `${series.prefix}${series.separator}${yearStr}${series.separator}${padded}`;
        }
        else {
            docNumber = `${series.prefix}${series.separator}${padded}`;
        }
        return docNumber;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map