import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateShiftDto, MarkAttendanceDto, UpdateAttendanceDto, BulkAttendanceDto } from './dto/attendance.dto';
export declare class AttendanceService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private parseTime;
    private roundTo30Min;
    private calculateAttendance;
    createShift(dto: CreateShiftDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        code: string;
        startTime: string;
        endTime: string;
        shiftHours: number;
        lunchStartTime: string | null;
        lunchEndTime: string | null;
        lunchMinutes: number;
        weeklyOff: string;
        otMultiplier: number;
        holidayMultiplier: number;
    }>;
    updateShift(id: string, dto: any, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        code: string;
        startTime: string;
        endTime: string;
        shiftHours: number;
        lunchStartTime: string | null;
        lunchEndTime: string | null;
        lunchMinutes: number;
        weeklyOff: string;
        otMultiplier: number;
        holidayMultiplier: number;
    }>;
    findAllShifts(user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        code: string;
        startTime: string;
        endTime: string;
        shiftHours: number;
        lunchStartTime: string | null;
        lunchEndTime: string | null;
        lunchMinutes: number;
        weeklyOff: string;
        otMultiplier: number;
        holidayMultiplier: number;
    }[]>;
    markAttendance(dto: MarkAttendanceDto, user: any): Promise<{
        shift: {
            name: string;
        };
        employee: {
            firstName: string;
            lastName: string;
            employeeNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        employeeId: string;
        lunchMinutes: number;
        otHours: number;
        grossWorkedMinutes: number;
        netWorkedMinutes: number;
        netWorkedRounded: number;
        workedHours: number;
        otRate: number;
        otAmount: number;
        shiftId: string | null;
        attendanceDate: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        lunchOut: Date | null;
        lunchIn: Date | null;
        isHoliday: boolean;
        markedBy: string | null;
    }>;
    updateAttendance(id: string, dto: UpdateAttendanceDto, user: any): Promise<{
        shift: {
            name: string;
        };
        employee: {
            firstName: string;
            lastName: string;
            employeeNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        employeeId: string;
        lunchMinutes: number;
        otHours: number;
        grossWorkedMinutes: number;
        netWorkedMinutes: number;
        netWorkedRounded: number;
        workedHours: number;
        otRate: number;
        otAmount: number;
        shiftId: string | null;
        attendanceDate: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        lunchOut: Date | null;
        lunchIn: Date | null;
        isHoliday: boolean;
        markedBy: string | null;
    }>;
    bulkMarkAttendance(dto: BulkAttendanceDto, user: any): Promise<{
        date: string;
        total: number;
        success: number;
        failed: number;
        results: any[];
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            shift: {
                name: string;
                startTime: string;
                endTime: string;
            };
            employee: {
                firstName: string;
                lastName: string;
                employeeNumber: string;
                department: {
                    name: string;
                };
            };
        } & {
            id: string;
            companyId: string;
            status: string;
            remarks: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            employeeId: string;
            lunchMinutes: number;
            otHours: number;
            grossWorkedMinutes: number;
            netWorkedMinutes: number;
            netWorkedRounded: number;
            workedHours: number;
            otRate: number;
            otAmount: number;
            shiftId: string | null;
            attendanceDate: Date;
            checkIn: Date | null;
            checkOut: Date | null;
            lunchOut: Date | null;
            lunchIn: Date | null;
            isHoliday: boolean;
            markedBy: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getMonthlySummary(employeeId: string, month: number, year: number, user: any): Promise<{
        employeeId: string;
        month: number;
        year: number;
        summary: {
            present: number;
            absent: number;
            halfDay: number;
            holiday: number;
            weekOff: number;
            leave: number;
            totalWorkedHours: number;
            totalOtHours: number;
            totalOtAmount: number;
        };
        records: ({
            shift: {
                name: string;
            };
        } & {
            id: string;
            companyId: string;
            status: string;
            remarks: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            employeeId: string;
            lunchMinutes: number;
            otHours: number;
            grossWorkedMinutes: number;
            netWorkedMinutes: number;
            netWorkedRounded: number;
            workedHours: number;
            otRate: number;
            otAmount: number;
            shiftId: string | null;
            attendanceDate: Date;
            checkIn: Date | null;
            checkOut: Date | null;
            lunchOut: Date | null;
            lunchIn: Date | null;
            isHoliday: boolean;
            markedBy: string | null;
        })[];
    }>;
    getStats(user: any, query: any): Promise<{
        month: number;
        year: number;
        total: number;
        present: number;
        absent: number;
        onLeave: number;
        halfDay: number;
        totalOtHours: number;
        totalOtAmount: number;
    }>;
}
