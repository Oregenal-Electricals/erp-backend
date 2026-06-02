import { SettingsService } from './settings.service';
import { UpdateSystemSettingDto, BulkUpdateSettingsDto, CreateNumberingSeriesDto, UpdateNumberingSeriesDto } from './dto/settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    initializeSettings(user: any): Promise<{
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
        value: string;
        key: string;
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
        value: string;
        key: string;
        category: string;
    }>;
    updateSetting(key: string, dto: UpdateSystemSettingDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        description: string | null;
        value: string;
        key: string;
        category: string;
    }>;
    bulkUpdateSettings(dto: BulkUpdateSettingsDto, user: any): Promise<{
        updated: number;
        settings: any[];
    }>;
    initializeSeries(companyId: string, user: any): Promise<{
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
    getNextNumber(companyId: string, documentType: string): Promise<{
        number: string;
        documentType: string;
        companyId: string;
    }>;
    previewNextNumber(companyId: string, documentType: string): Promise<{
        preview: string;
        documentType: string;
        note: string;
    }>;
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
    createSeries(dto: CreateNumberingSeriesDto, user: any): Promise<{
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
    updateSeries(id: string, dto: UpdateNumberingSeriesDto, user: any): Promise<{
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
}
