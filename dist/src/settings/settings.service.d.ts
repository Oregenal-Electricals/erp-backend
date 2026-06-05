import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { UpdateSystemSettingDto, BulkUpdateSettingsDto, CreateNumberingSeriesDto, UpdateNumberingSeriesDto } from './dto/settings.dto';
export declare class SettingsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    initializeDefaultSettings(userId: string): Promise<{
        message: string;
    }>;
    getAllSettings(category?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        description: string | null;
        key: string;
        value: string;
        category: string;
    }[]>;
    getSetting(key: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        description: string | null;
        key: string;
        value: string;
        category: string;
    }>;
    getSettingValue(key: string, defaultValue?: string): Promise<string>;
    updateSetting(key: string, dto: UpdateSystemSettingDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        description: string | null;
        key: string;
        value: string;
        category: string;
    }>;
    bulkUpdateSettings(dto: BulkUpdateSettingsDto, userId: string): Promise<{
        updated: number;
        settings: any[];
    }>;
    initializeDefaultSeries(companyId: string, userId: string): Promise<{
        message: string;
    }>;
    getAllSeries(companyId?: string): Promise<({
        company: {
            id: string;
            code: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        isLocked: boolean;
        documentType: string;
        prefix: string;
        separator: string;
        includeYear: boolean;
        yearFormat: string;
        padding: number;
        currentNumber: number;
        lastGenerated: string | null;
    })[]>;
    getOneSeries(id: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        isLocked: boolean;
        documentType: string;
        prefix: string;
        separator: string;
        includeYear: boolean;
        yearFormat: string;
        padding: number;
        currentNumber: number;
        lastGenerated: string | null;
    }>;
    createSeries(dto: CreateNumberingSeriesDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        isLocked: boolean;
        documentType: string;
        prefix: string;
        separator: string;
        includeYear: boolean;
        yearFormat: string;
        padding: number;
        currentNumber: number;
        lastGenerated: string | null;
    }>;
    updateSeries(id: string, dto: UpdateNumberingSeriesDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        isLocked: boolean;
        documentType: string;
        prefix: string;
        separator: string;
        includeYear: boolean;
        yearFormat: string;
        padding: number;
        currentNumber: number;
        lastGenerated: string | null;
    }>;
    getNextNumber(companyId: string, documentType: string): Promise<string>;
    previewNextNumber(companyId: string, documentType: string): Promise<string>;
}
