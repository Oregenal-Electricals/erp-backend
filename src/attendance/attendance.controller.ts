import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateShiftDto, MarkAttendanceDto, UpdateAttendanceDto, BulkAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attService: AttendanceService) {}

  // Shifts — admin only enforced in service
  @Get('shifts')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getShifts(@Request() req: any) { return this.attService.findAllShifts(req.user); }

  @Post('shifts')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createShift(@Body() dto: CreateShiftDto, @Request() req: any) { return this.attService.createShift(dto, req.user); }

  @Put('shifts/:id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateShift(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.attService.updateShift(id, dto, req.user); }

  // Attendance stats
  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any, @Query() query: any) { return this.attService.getStats(req.user, query); }

  // Attendance list
  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.attService.findAll(req.user, query); }

  // Monthly summary per employee
  @Get('summary/:employeeId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getMonthlySummary(@Param('employeeId') empId: string, @Query() query: any, @Request() req: any) {
    return this.attService.getMonthlySummary(empId, Number(query.month), Number(query.year), req.user);
  }

  // Mark attendance
  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  mark(@Body() dto: MarkAttendanceDto, @Request() req: any) { return this.attService.markAttendance(dto, req.user); }

  // Bulk mark
  @Post('bulk')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  bulkMark(@Body() dto: BulkAttendanceDto, @Request() req: any) { return this.attService.bulkMarkAttendance(dto, req.user); }

  // Update attendance
  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto, @Request() req: any) { return this.attService.updateAttendance(id, dto, req.user); }
}
