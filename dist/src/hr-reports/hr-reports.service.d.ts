import { PrismaService } from '../prisma/prisma.service';
export declare class HrReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getHeadcountReport(companyId: string): Promise<{
        reportType: string;
        summary: {
            total: number;
            active: number;
            inactive: number;
            joinedThisMonth: number;
            resignedThisMonth: number;
        };
        byDepartment: {
            department: string;
            code: string;
            count: number;
        }[];
        byEmploymentType: {
            type: string;
            count: number;
        }[];
        byGender: {
            gender: string;
            count: number;
        }[];
    }>;
    getAttendanceSummaryReport(companyId: string, month: number, year: number): Promise<{
        reportType: string;
        month: number;
        year: number;
        summary: {
            totalEmployees: number;
            avgPresent: number;
            totalOtHours: any;
            totalOtAmount: any;
        };
        rows: {
            employeeNumber: string;
            employeeName: string;
            department: string;
            present: number;
            absent: number;
            halfDay: number;
            leave: number;
            holiday: number;
            weekOff: number;
            totalOtHours: any;
            totalOtAmount: any;
            workedHours: any;
        }[];
    }>;
    getLeaveUtilizationReport(companyId: string, year: number): Promise<{
        reportType: string;
        year: number;
        byType: {
            leaveType: string;
            code: string;
            isPaid: boolean;
            totalAllocated: number;
            totalUsed: number;
            totalPending: number;
            totalAvailable: number;
            utilizationRate: number;
            employeeCount: number;
        }[];
        byEmployee: any[];
    }>;
    getPayrollCostReport(companyId: string, month: number, year: number): Promise<{
        reportType: string;
        month: number;
        year: number;
        summary: {
            totalEmployees: number;
            totalGross: number;
            totalPf: number;
            totalEsi: number;
            totalTds: number;
            totalNetPay: number;
            totalOt: number;
        };
        byDepartment: any[];
        entries: {
            employeeNumber: string;
            employeeName: string;
            department: string;
            designation: string;
            gross: number;
            pf: number;
            esi: number;
            tds: number;
            ot: number;
            netPay: number;
        }[];
    }>;
    getAttritionReport(companyId: string, year: number): Promise<{
        reportType: string;
        year: number;
        summary: {
            totalEmployees: number;
            joined: number;
            resigned: number;
            terminated: number;
            attritionRate: number;
        };
        joinedEmployees: {
            employeeNumber: string;
            name: string;
            department: string;
            designation: string;
            dateOfJoining: Date;
            type: string;
        }[];
        resignedEmployees: {
            employeeNumber: string;
            name: string;
            department: string;
            designation: string;
            dateOfLeaving: Date;
        }[];
        terminatedEmployees: {
            employeeNumber: string;
            name: string;
            department: string;
            dateOfLeaving: Date;
        }[];
    }>;
    getOtReport(companyId: string, month: number, year: number): Promise<{
        reportType: string;
        month: number;
        year: number;
        summary: {
            totalOtHours: number;
            totalOtAmount: number;
            employeesWithOt: number;
        };
        byEmployee: any[];
    }>;
}
