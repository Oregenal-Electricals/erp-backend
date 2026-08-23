import { AttendanceService } from './attendance.service';
import { CreateShiftDto, MarkAttendanceDto, UpdateAttendanceDto, BulkAttendanceDto } from './dto/attendance.dto';
export declare class AttendanceController {
    private readonly attService;
    constructor(attService: AttendanceService);
    getShifts(req: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        startTime: string;
        endTime: string;
        lunchMinutes: number;
        shiftHours: number;
        lunchStartTime: string | null;
        lunchEndTime: string | null;
        weeklyOff: string;
        otMultiplier: number;
        holidayMultiplier: number;
    }[]>;
    createShift(dto: CreateShiftDto, req: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        startTime: string;
        endTime: string;
        lunchMinutes: number;
        shiftHours: number;
        lunchStartTime: string | null;
        lunchEndTime: string | null;
        weeklyOff: string;
        otMultiplier: number;
        holidayMultiplier: number;
    }>;
    updateShift(id: string, dto: any, req: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        startTime: string;
        endTime: string;
        lunchMinutes: number;
        shiftHours: number;
        lunchStartTime: string | null;
        lunchEndTime: string | null;
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
                department: {
                    name: string;
                };
                employeeNumber: string;
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
            status: string;
            remarks: string | null;
            checkIn: Date | null;
            checkOut: Date | null;
            employeeId: string;
            shiftId: string | null;
            attendanceDate: Date;
            lunchOut: Date | null;
            lunchIn: Date | null;
            lunchMinutes: number;
            grossWorkedMinutes: number;
            netWorkedMinutes: number;
            netWorkedRounded: number;
            workedHours: number;
            otHours: number;
            otRate: number;
            otAmount: number;
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            checkIn: Date | null;
            checkOut: Date | null;
            employeeId: string;
            shiftId: string | null;
            attendanceDate: Date;
            lunchOut: Date | null;
            lunchIn: Date | null;
            lunchMinutes: number;
            grossWorkedMinutes: number;
            netWorkedMinutes: number;
            netWorkedRounded: number;
            workedHours: number;
            otHours: number;
            otRate: number;
            otAmount: number;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        employeeId: string;
        shiftId: string | null;
        attendanceDate: Date;
        lunchOut: Date | null;
        lunchIn: Date | null;
        lunchMinutes: number;
        grossWorkedMinutes: number;
        netWorkedMinutes: number;
        netWorkedRounded: number;
        workedHours: number;
        otHours: number;
        otRate: number;
        otAmount: number;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        employeeId: string;
        shiftId: string | null;
        attendanceDate: Date;
        lunchOut: Date | null;
        lunchIn: Date | null;
        lunchMinutes: number;
        grossWorkedMinutes: number;
        netWorkedMinutes: number;
        netWorkedRounded: number;
        workedHours: number;
        otHours: number;
        otRate: number;
        otAmount: number;
        isHoliday: boolean;
        markedBy: string | null;
    }>;
}
