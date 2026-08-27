import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VisitorStatus } from '@prisma/client';
import { VisitorManagementService } from './visitor-management.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CheckInVisitorDto, CheckOutVisitorDto } from './dto/visitor.dto';

@ApiTags('Visitor Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('visitor-logs')
export class VisitorLogController {
  constructor(private readonly service: VisitorManagementService) {}

  @Post('check-in')
  @RequirePermissions(Permission.VISITOR_CHECKIN)
  @ApiOperation({ summary: 'Check in a visitor' })
  checkIn(@Body() dto: CheckInVisitorDto, @CurrentUser() user: any) {
    return this.service.checkIn(dto, user);
  }

  @Get()
  @RequirePermissions(Permission.VISITOR_VIEW)
  @ApiOperation({ summary: 'List all visitor logs' })
  @ApiQuery({ name: 'plantId', required: false })
  @ApiQuery({ name: 'status',  required: false, enum: VisitorStatus })
  @ApiQuery({ name: 'date',    required: false })
  findAllLogs(
    @CurrentUser() user: any,
    @Query('plantId') plantId?: string,
    @Query('status')  status?: VisitorStatus,
    @Query('date')    date?: string,
  ) {
    return this.service.findAllLogs(user, { plantId, status, date });
  }

  @Get('active')
  @RequirePermissions(Permission.VISITOR_VIEW)
  @ApiOperation({ summary: 'Get currently checked-in visitors' })
  getActiveVisitors(@CurrentUser() user: any) {
    return this.service.getActiveVisitors(user);
  }

  @Patch(':id/checkout')
  @RequirePermissions(Permission.VISITOR_CHECKIN)
  @ApiOperation({ summary: 'Check out a visitor' })
  checkOut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckOutVisitorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.checkOut(id, dto, user);
  }
}
