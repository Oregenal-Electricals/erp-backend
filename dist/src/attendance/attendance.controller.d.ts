import { AttendanceService } from './attendance.service';
import { CreateShiftDto, MarkAttendanceDto, UpdateAttendanceDto, BulkAttendanceDto } from './dto/attendance.dto';
export declare class AttendanceController {
    private readonly attService;
    constructor(attService: AttendanceService);
    getShifts(req: any): Promise<{
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
    createShift(dto: CreateShiftDto, req: any): Promise<{
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
    updateShift(id: string, dto: any, req: any): Promise<{
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
    getStats(req: any, query: any): Promise<{
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
    findAll(req: any, query: any): Promise<{
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
    getMonthlySummary(empId: string, query: any, req: any): Promise<{
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
    mark(dto: MarkAttendanceDto, req: any): Promise<{
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
    bulkMark(dto: BulkAttendanceDto, req: any): Promise<{
        date: string;
        total: number;
        success: number;
        failed: number;
        results: any[];
    }>;
    update(id: string, dto: UpdateAttendanceDto, req: any): Promise<{
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
}
