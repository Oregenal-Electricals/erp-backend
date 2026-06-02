import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import {
  UpdateSystemSettingDto,
  BulkUpdateSettingsDto,
  CreateNumberingSeriesDto,
  UpdateNumberingSeriesDto,
} from './dto/settings.dto';

// Default system settings
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

// Default numbering series per document type
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

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // SYSTEM SETTINGS
  // ─────────────────────────────────────────────

  async initializeDefaultSettings(userId: string) {
    let created = 0;
    for (const setting of DEFAULT_SETTINGS) {
      const existing = await this.prisma.systemSetting.findUnique({
        where: { key: setting.key },
      });
      if (!existing) {
        await this.prisma.systemSetting.create({
          data: { ...setting, createdBy: userId, updatedBy: userId },
        });
        created++;
      }
    }
    return { message: `Initialized ${created} default settings` };
  }

  async getAllSettings(category?: string) {
    return this.prisma.systemSetting.findMany({
      where: category ? { category } : {},
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async getSetting(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return setting;
  }

  async getSettingValue(key: string, defaultValue?: string): Promise<string> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key },
      });
      return setting?.value ?? defaultValue ?? '';
    } catch {
      return defaultValue ?? '';
    }
  }

  async updateSetting(
    key: string,
    dto: UpdateSystemSettingDto,
    userId: string,
  ) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      // Create if not exists
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

  async bulkUpdateSettings(dto: BulkUpdateSettingsDto, userId: string) {
    const results = [];
    for (const [key, value] of Object.entries(dto.settings)) {
      const result = await this.updateSetting(key, { value }, userId);
      results.push(result);
    }
    return { updated: results.length, settings: results };
  }

  // ─────────────────────────────────────────────
  // NUMBERING SERIES
  // ─────────────────────────────────────────────

  async initializeDefaultSeries(companyId: string, userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

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
          data: { ...series, companyId, createdBy: userId, updatedBy: userId },
        });
        created++;
      }
    }
    return {
      message: `Initialized ${created} numbering series for ${company.name}`,
    };
  }

  async getAllSeries(companyId?: string) {
    return this.prisma.numberingSeries.findMany({
      where: companyId ? { companyId } : {},
      include: { company: { select: { id: true, name: true, code: true } } },
      orderBy: [{ companyId: 'asc' }, { documentType: 'asc' }],
    });
  }

  async getOneSeries(id: string) {
    const series = await this.prisma.numberingSeries.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true } } },
    });
    if (!series) throw new NotFoundException('Numbering series not found');
    return series;
  }

  async createSeries(dto: CreateNumberingSeriesDto, userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    const existing = await this.prisma.numberingSeries.findUnique({
      where: {
        companyId_documentType: {
          companyId: dto.companyId,
          documentType: dto.documentType,
        },
      },
    });
    if (existing)
      throw new ConflictException(
        `Series for ${dto.documentType} already exists`,
      );

    const series = await this.prisma.numberingSeries.create({
      data: { ...dto, createdBy: userId, updatedBy: userId },
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

  async updateSeries(
    id: string,
    dto: UpdateNumberingSeriesDto,
    userId: string,
  ) {
    const series = await this.prisma.numberingSeries.findUnique({
      where: { id },
    });
    if (!series) throw new NotFoundException('Numbering series not found');

    // If series has been used (isLocked), only allow padding and separator changes
    if (series.isLocked) {
      const allowedChanges = ['padding', 'separator'];
      const requestedChanges = Object.keys(dto);
      const disallowed = requestedChanges.filter(
        (k) => !allowedChanges.includes(k),
      );
      if (disallowed.length > 0) {
        throw new BadRequestException(
          `Cannot change ${disallowed.join(', ')} — series is locked after first use`,
        );
      }
    }

    const updated = await this.prisma.numberingSeries.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
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

  // ─────────────────────────────────────────────
  // GET NEXT NUMBER — Used by all other modules
  // ─────────────────────────────────────────────
  async getNextNumber(
    companyId: string,
    documentType: string,
  ): Promise<string> {
    const series = await this.prisma.numberingSeries.findUnique({
      where: { companyId_documentType: { companyId, documentType } },
    });

    if (!series) {
      throw new NotFoundException(
        `No numbering series found for ${documentType}. Please configure it in Settings.`,
      );
    }

    if (!series.isActive) {
      throw new BadRequestException(
        `Numbering series for ${documentType} is inactive`,
      );
    }

    // Atomic increment
    const updated = await this.prisma.numberingSeries.update({
      where: { id: series.id },
      data: {
        currentNumber: { increment: 1 },
        isLocked: true, // lock after first use
        updatedBy: 'system',
      },
    });

    // Build the number
    const nextNum = updated.currentNumber;
    const padded = String(nextNum).padStart(series.padding, '0');

    let docNumber = series.prefix;

    if (series.includeYear) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      // Indian fiscal year: April = start
      const fiscalYear = month >= 4 ? year : year - 1;
      const nextFiscalYear = fiscalYear + 1;

      let yearStr = '';
      if (series.yearFormat === 'YY-YY') {
        yearStr = `${String(fiscalYear).slice(2)}-${String(nextFiscalYear).slice(2)}`;
      } else if (series.yearFormat === 'YYYY') {
        yearStr = String(fiscalYear);
      } else if (series.yearFormat === 'YY') {
        yearStr = String(fiscalYear).slice(2);
      } else {
        yearStr = `${String(fiscalYear).slice(2)}-${String(nextFiscalYear).slice(2)}`;
      }

      docNumber = `${series.prefix}${series.separator}${yearStr}${series.separator}${padded}`;
    } else {
      docNumber = `${series.prefix}${series.separator}${padded}`;
    }

    // Store last generated
    await this.prisma.numberingSeries.update({
      where: { id: series.id },
      data: { lastGenerated: docNumber, updatedBy: 'system' },
    });

    return docNumber;
  }

  async previewNextNumber(
    companyId: string,
    documentType: string,
  ): Promise<string> {
    const series = await this.prisma.numberingSeries.findUnique({
      where: { companyId_documentType: { companyId, documentType } },
    });
    if (!series) throw new NotFoundException(`No series for ${documentType}`);

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
    } else {
      docNumber = `${series.prefix}${series.separator}${padded}`;
    }

    return docNumber;
  }
}
