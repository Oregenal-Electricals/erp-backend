import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { CreateDispatchDto } from './dto/dispatch.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get('stats')
  @RequirePermissions(Permission.SALES_VIEW)
  getStats(@Request() req: any) { return this.dispatchService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.SALES_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.dispatchService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.dispatchService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  create(@Body() dto: CreateDispatchDto, @Request() req: any) { return this.dispatchService.create(dto, req.user); }
}
