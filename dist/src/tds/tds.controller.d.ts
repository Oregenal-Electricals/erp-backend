import { TdsService } from './tds.service';
import { SaveDeclarationDto } from './dto/tds.dto';
export declare class TdsController {
    private readonly tdsService;
    constructor(tdsService: TdsService);
    getAll(req: any, query: any): Promise<({
        employee: {
            firstName: string;
            lastName: string;
            employeeNumber: string;
            panNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        financialYear: string;
        remarks: string | null;
        employeeId: string;
        otherDeductions: number;
        section80C: number;
        section80D: number;
        section80G: number;
        section80E: number;
        rentPaid: number;
        isMetroCity: boolean;
        hraExemption: number;
        standardDeduction: number;
        taxableIncome: number;
        annualTax: number;
        monthlyTds: number;
        regime: string;
    })[]>;
    getChallan(month: string, year: string, req: any): Promise<{
        reportType: string;
        month: number;
        year: number;
        runNumber: string;
        payrollStatus: string;
        dueDate: string;
        section: string;
        entries: {
            employeeNumber: string;
            employeeName: string;
            panNumber: string;
            grossSalary: number;
            tdsAmount: number;
        }[];
        totalTds: number;
        employeeCount: number;
    }>;
    getRegister(fy: string, req: any): Promise<{
        reportType: string;
        financialYear: string;
        companyId: string;
        employees: any[];
        totalTdsDeducted: any;
    }>;
    getForm16(empId: string, fy: string, req: any): Promise<{
        reportType: string;
        financialYear: string;
        employeeId: string;
        employee: {
            firstName: string;
            lastName: string;
            employeeNumber: string;
            panNumber: string;
            basicSalary: number;
            hraAmount: number;
            conveyanceAmount: number;
            otherAllowances: number;
        };
        grossSalary: number;
        standardDeduction: number;
        hraExemption: number;
        section80C: number;
        section80D: number;
        section80G: number;
        section80E: number;
        otherDeductions: number;
        taxableIncome: number;
        annualTax: number;
        totalTdsDeducted: number;
        balanceTax: number;
        regime: string;
        totalPfContribution: number;
        monthlyDetails: {
            month: number;
            gross: number;
            tds: number;
        }[];
    }>;
    getDeclaration(empId: string, fy: string, req: any): Promise<{
        employee: {
            firstName: string;
            lastName: string;
            employeeNumber: string;
            basicSalary: number;
            hraAmount: number;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        financialYear: string;
        remarks: string | null;
        employeeId: string;
        otherDeductions: number;
        section80C: number;
        section80D: number;
        section80G: number;
        section80E: number;
        rentPaid: number;
        isMetroCity: boolean;
        hraExemption: number;
        standardDeduction: number;
        taxableIncome: number;
        annualTax: number;
        monthlyTds: number;
        regime: string;
    }>;
    saveDeclaration(dto: SaveDeclarationDto, req: any): Promise<any>;
}
