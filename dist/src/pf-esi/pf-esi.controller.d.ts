import { PfEsiService } from './pf-esi.service';
export declare class PfEsiController {
    private readonly pfEsiService;
    constructor(pfEsiService: PfEsiService);
    getRates(): {
        pf: {
            employeeRate: string;
            employerEpfRate: string;
            employerEpsRate: string;
            edliRate: string;
            adminRate: string;
            wageCeiling: number;
            note: string;
        };
        esi: {
            employeeRate: string;
            employerRate: string;
            wageCeiling: number;
            note: string;
        };
    };
    getPfChallan(month: string, year: string, req: any): Promise<{
        reportType: string;
        month: number;
        year: number;
        companyId: string;
        runNumber: string;
        payrollStatus: string;
        dueDate: string;
        entries: {
            employeeNumber: string;
            employeeName: string;
            pfNumber: string;
            panNumber: string;
            basicWage: number;
            pfWage: number;
            epfEmployee: number;
            epfEmployer: number;
            eps: number;
            edli: number;
            adminCharges: number;
            totalEmployerContrib: number;
            totalContrib: number;
        }[];
        totals: {
            totalBasicWage: number;
            totalPfWage: number;
            totalEpfEmployee: number;
            totalEpfEmployer: number;
            totalEps: number;
            totalEdli: number;
            totalAdminCharges: number;
            totalContrib: number;
        };
        employeeCount: number;
    }>;
    getEsiChallan(month: string, year: string, req: any): Promise<{
        reportType: string;
        month: number;
        year: number;
        companyId: string;
        runNumber: string;
        payrollStatus: string;
        dueDate: string;
        entries: {
            employeeNumber: string;
            employeeName: string;
            esiNumber: string;
            grossWage: number;
            esiEmployee: number;
            esiEmployer: number;
            totalEsi: number;
        }[];
        notApplicable: {
            employeeNumber: string;
            employeeName: string;
            grossWage: number;
            reason: string;
        }[];
        totals: {
            totalGrossWage: number;
            totalEsiEmployee: number;
            totalEsiEmployer: number;
            totalEsi: number;
        };
        applicableCount: number;
        notApplicableCount: number;
    }>;
    getPfRegister(year: string, req: any): Promise<{
        reportType: string;
        year: number;
        companyId: string;
        employees: any[];
        monthsProcessed: number[];
    }>;
    getEsiRegister(year: string, req: any): Promise<{
        reportType: string;
        year: number;
        companyId: string;
        employees: any[];
        monthsProcessed: number[];
    }>;
}
