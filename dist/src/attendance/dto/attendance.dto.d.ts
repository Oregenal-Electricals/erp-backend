export declare class CreateShiftDto {
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    shiftHours: number;
    lunchStartTime?: string;
    lunchEndTime?: string;
    lunchMinutes?: number;
    weeklyOff?: string;
    otMultiplier?: number;
    holidayMultiplier?: number;
}
export declare class MarkAttendanceDto {
    employeeId: string;
    attendanceDate: string;
    shiftId?: string;
    checkIn?: string;
    checkOut?: string;
    lunchOut?: string;
    lunchIn?: string;
    status?: string;
    isHoliday?: boolean;
    remarks?: string;
}
export declare class UpdateAttendanceDto {
    shiftId?: string;
    checkIn?: string;
    checkOut?: string;
    lunchOut?: string;
    lunchIn?: string;
    status?: string;
    isHoliday?: boolean;
    remarks?: string;
}
export declare class BulkAttendanceDto {
    attendanceDate: string;
    shiftId?: string;
    records: {
        employeeId: string;
        checkIn?: string;
        checkOut?: string;
        lunchOut?: string;
        lunchIn?: string;
        status?: string;
        isHoliday?: boolean;
        remarks?: string;
    }[];
}
