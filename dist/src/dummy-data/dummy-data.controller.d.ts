import { DummyDataService } from './dummy-data.service';
export declare class DummyDataController {
    private readonly service;
    constructor(service: DummyDataService);
    getStatus(user: any): Promise<{
        companies: number;
        plants: number;
        units: number;
        departments: number;
        branches: number;
        financialYears: number;
        users: number;
        changeRequests: number;
        total: number;
    }>;
    seedCompany(companyId: string, user: any): Promise<{
        message: string;
        company: string;
        created: {
            plants: number;
            units: number;
            departments: number;
            branches: number;
            financialYears: number;
            users: number;
            changeRequests: number;
        };
        note: string;
    }>;
    purgeCompany(companyId: string): Promise<{
        message: string;
        company: string;
        deleted: {
            changeRequestComments: number;
            changeRequests: number;
            users: number;
            financialYears: number;
            branches: number;
            departments: number;
            units: number;
            plants: number;
        };
    }>;
    purgeAll(): Promise<{
        message: string;
        deleted: {
            changeRequests: number;
            users: number;
            financialYears: number;
            branches: number;
            departments: number;
            units: number;
            plants: number;
            companies: number;
        };
        warning: string;
    }>;
}
