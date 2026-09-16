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
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        key: string;
        value: string;
        category: string;
    }[]>;
    getSetting(key: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        key: string;
        value: string;
        category: string;
    }>;
    bulkUpdateSettings(dto: BulkUpdateSettingsDto, user: any): Promise<{
        updated: number;
        settings: any[];
    }>;
    updateSetting(key: string, dto: UpdateSystemSettingDto, user: any): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        key: string;
        value: string;
        category: string;
    }>;
    initializeSeries(companyId: string, user: any): Promise<{
        message: string;
    }>;
    getAllSeries(companyId?: string): Promise<({
        company: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
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
    }>;
    getOneSeries(id: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
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
