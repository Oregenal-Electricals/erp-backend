import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VisitorStatus } from '@prisma/client';
import { VisitorManagementService } from './visitor-management.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateVisitorDto,
  UpdateVisitorDto,
  CheckInVisitorDto,
  CheckOutVisitorDto,
} from './dto/visitor.dto';

@ApiTags('Visitor Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('visitors')
export class VisitorManagementController {
  constructor(private readonly service: VisitorManagementService) {}

  // ── VISITOR MASTER ────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Register a new visitor' })
  createVisitor(@Body() dto: CreateVisitorDto, @CurrentUser() user: any) {
    return this.service.createVisitor(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all visitors' })
  @ApiQuery({ name: 'search', required: false })
  findAllVisitors(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.service.findAllVisitors(user, search);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get visitor statistics' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visitor by ID with visit history' })
  findOneVisitor(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneVisitor(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update visitor details' })
  updateVisitor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisitorDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateVisitor(id, dto, user);
  }

  @Patch(':id/blacklist')
  @ApiOperation({ summary: 'Toggle visitor blacklist status' })
  blacklistVisitor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.service.blacklistVisitor(id, reason, user);
  }
}
