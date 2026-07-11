import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateProgramDto, CreateSessionDto, EnrollDto, MarkAttendanceDto, UpdateEnrollmentDto } from './dto/training.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('training')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('stats')
  @RequirePermissions(Permission.HR_VIEW)
  getStats(@Request() req: any) { return this.trainingService.getStats(req.user); }

  @Get('programs')
  @RequirePermissions(Permission.HR_VIEW)
  getPrograms(@Request() req: any, @Query() query: any) { return this.trainingService.findAllPrograms(req.user, query); }

  @Post('programs')
  @RequirePermissions(Permission.HR_CREATE)
  createProgram(@Body() dto: CreateProgramDto, @Request() req: any) { return this.trainingService.createProgram(dto, req.user); }

  @Put('programs/:id')
  @RequirePermissions(Permission.HR_EDIT)
  updateProgram(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.trainingService.updateProgram(id, dto, req.user); }

  @Get('sessions')
  @RequirePermissions(Permission.HR_VIEW)
  getSessions(@Request() req: any, @Query() query: any) { return this.trainingService.findAllSessions(req.user, query); }

  @Get('sessions/:id')
  @RequirePermissions(Permission.HR_VIEW)
  getSession(@Param('id') id: string, @Request() req: any) { return this.trainingService.getSession(id, req.user); }

  @Post('sessions')
  @RequirePermissions(Permission.HR_CREATE)
  createSession(@Body() dto: CreateSessionDto, @Request() req: any) { return this.trainingService.createSession(dto, req.user); }

  @Put('sessions/:id')
  @RequirePermissions(Permission.HR_EDIT)
  updateSession(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.trainingService.updateSession(id, dto, req.user); }

  @Put('sessions/:id/complete')
  @RequirePermissions(Permission.HR_EDIT)
  completeSession(@Param('id') id: string, @Request() req: any) { return this.trainingService.completeSession(id, req.user); }

  @Post('enroll')
  @RequirePermissions(Permission.HR_CREATE)
  enroll(@Body() dto: EnrollDto, @Request() req: any) { return this.trainingService.enrollEmployees(dto, req.user); }

  @Post('sessions/:id/attendance')
  @RequirePermissions(Permission.HR_EDIT)
  markAttendance(@Param('id') id: string, @Body() dto: MarkAttendanceDto, @Request() req: any) { return this.trainingService.markAttendance(id, dto, req.user); }

  @Put('enrollments/:id/complete')
  @RequirePermissions(Permission.HR_EDIT)
  completeEnrollment(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto, @Request() req: any) { return this.trainingService.completeEnrollment(id, dto, req.user); }

  @Get('employee/:employeeId')
  @RequirePermissions(Permission.HR_VIEW)
  getEmployeeHistory(@Param('employeeId') empId: string, @Request() req: any) { return this.trainingService.getEmployeeTrainingHistory(empId, req.user); }
}
