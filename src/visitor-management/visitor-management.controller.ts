import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VisitorManagementService } from './visitor-management.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateVisitorDto,
  UpdateVisitorDto,
} from './dto/visitor.dto';

@ApiTags('Visitor Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('visitors')
export class VisitorManagementController {
  constructor(private readonly service: VisitorManagementService) {}

  @Post()
  @RequirePermissions(Permission.VISITOR_CREATE)
  @ApiOperation({ summary: 'Register a new visitor' })
  createVisitor(@Body() dto: CreateVisitorDto, @CurrentUser() user: any) {
    return this.service.createVisitor(dto, user);
  }

  @Get()
  @RequirePermissions(Permission.VISITOR_VIEW)
  @ApiOperation({ summary: 'List all visitors' })
  @ApiQuery({ name: 'search', required: false })
  findAllVisitors(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.service.findAllVisitors(user, search);
  }

  @Get('stats')
  @RequirePermissions(Permission.VISITOR_VIEW)
  @ApiOperation({ summary: 'Get visitor statistics' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.VISITOR_VIEW)
  @ApiOperation({ summary: 'Get visitor by ID with visit history' })
  findOneVisitor(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneVisitor(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.VISITOR_CREATE)
  @ApiOperation({ summary: 'Update visitor details' })
  updateVisitor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisitorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateVisitor(id, dto, user);
  }

  @Patch(':id/blacklist')
  @RequirePermissions(Permission.VISITOR_CREATE)
  @ApiOperation({ summary: 'Toggle visitor blacklist status' })
  blacklistVisitor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.service.blacklistVisitor(id, reason, user);
  }
}
