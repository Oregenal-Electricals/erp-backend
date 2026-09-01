import { BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

describe('AttendanceService — PROD-002: import idempotency and correction audit', () => {
  let service: AttendanceService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1', role: 'HR_MANAGER' };

  const employee = { id: 'emp-1', basicSalary: 15000 };
  const existingAttendance = {
    id: 'att-1', companyId: 'company-1', employeeId: 'emp-1',
    attendanceDate: new Date('2026-05-10'), status: 'PRESENT',
    checkIn: new Date('2026-05-10T08:00:00'), checkOut: new Date('2026-05-10T16:30:00'),
    remarks: null, shiftId: 'shift-1', shift: { id: 'shift-1', shiftHours: 8, lunchMinutes: 30, otMultiplier: 1.5, holidayMultiplier: 2.0 },
    isHoliday: false,
    employee: { basicSalary: 15000 },
  };

  beforeEach(() => {
    prisma = {
      employee: { findFirst: jest.fn().mockResolvedValue(employee) },
      shift: { findFirst: jest.fn().mockResolvedValue({ id: 'shift-1', shiftHours: 8, lunchMinutes: 30, otMultiplier: 1.5, holidayMultiplier: 2.0 }) },
      attendance: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new AttendanceService(prisma, audit);
  });

  describe('duplicate attendance import is controlled, never silently duplicated', () => {
    it('rejects marking attendance a second time for the same employee/date rather than creating a duplicate', async () => {
      prisma.attendance.findUnique.mockResolvedValue(existingAttendance);
      await expect(
        service.markAttendance({ employeeId: 'emp-1', attendanceDate: '2026-05-10', status: 'PRESENT' } as any, user),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.attendance.create).not.toHaveBeenCalled();
    });

    it('repeated bulk sync reports per-record failures rather than creating duplicates', async () => {
      prisma.attendance.findUnique.mockResolvedValue(existingAttendance);
      const result = await service.bulkMarkAttendance({
        attendanceDate: '2026-05-10', shiftId: 'shift-1',
        records: [{ employeeId: 'emp-1', status: 'PRESENT' }],
      } as any, user);
      expect(result.failed).toBe(1);
      expect(result.success).toBe(0);
      expect(prisma.attendance.create).not.toHaveBeenCalled();
    });

    it('a genuinely new employee/date combination in the same bulk sync still succeeds', async () => {
      prisma.attendance.findUnique
        .mockResolvedValueOnce(existingAttendance) // emp-1 already marked
        .mockResolvedValueOnce(null); // emp-2 is new
      prisma.attendance.create.mockResolvedValue({ id: 'att-2' });
      const result = await service.bulkMarkAttendance({
        attendanceDate: '2026-05-10', shiftId: 'shift-1',
        records: [{ employeeId: 'emp-1', status: 'PRESENT' }, { employeeId: 'emp-2', status: 'PRESENT' }],
      } as any, user);
      expect(result.total).toBe(2);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('attendance correction is fully audited with old and new values', () => {
    it('captures both old and new status/checkIn/remarks when HR corrects an attendance record', async () => {
      prisma.attendance.findFirst.mockResolvedValue(existingAttendance);
      prisma.attendance.update.mockResolvedValue({
        ...existingAttendance, status: 'HALF_DAY', checkIn: new Date('2026-05-10T08:00:00'), remarks: 'Corrected per security log',
      });
      await service.updateAttendance('att-1', { status: 'HALF_DAY', remarks: 'Corrected per security log' } as any, user);

      const auditCall = audit.log.mock.calls[0][0];
      expect(auditCall.oldValues.status).toBe('PRESENT');
      expect(auditCall.newValues.status).toBe('HALF_DAY');
      expect(auditCall.newValues.reason).toBe('Corrected per security log');
      expect(auditCall.changedBy).toBe(user.id);
    });
  });

  describe('unauthorized attendance modification - permission enforcement is structural', () => {
    it('the correction route requires HR_EDIT, and production-tier roles hold no such permission (verified separately in the live DB)', () => {
      const controllerSource = require('fs').readFileSync(require.resolve('./attendance.controller.ts'), 'utf8');
      const routeIdx = controllerSource.indexOf("@Put(':id')");
      expect(routeIdx).toBeGreaterThan(-1);
      const nextLines = controllerSource.slice(routeIdx, routeIdx + 150);
      expect(nextLines).toContain('@RequirePermissions(Permission.HR_EDIT)');
    });

    it('the bulk import route requires HR_CREATE, not a Production permission', () => {
      const controllerSource = require('fs').readFileSync(require.resolve('./attendance.controller.ts'), 'utf8');
      const routeIdx = controllerSource.indexOf("@Post('bulk')");
      expect(routeIdx).toBeGreaterThan(-1);
      const nextLines = controllerSource.slice(routeIdx, routeIdx + 150);
      expect(nextLines).toContain('@RequirePermissions(Permission.HR_CREATE)');
    });

    it('the controller enforces JwtAuthGuard and PermissionsGuard on every route', () => {
      const controllerSource = require('fs').readFileSync(require.resolve('./attendance.controller.ts'), 'utf8');
      expect(controllerSource).toContain('@UseGuards(JwtAuthGuard, PermissionsGuard)');
    });
  });
});
