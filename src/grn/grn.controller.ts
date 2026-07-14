import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { GrnService } from './grn.service';
import { CreateGrnDto, UpdateGrnDto } from './dto/grn.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('grn')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GrnController {
  constructor(private readonly grnService: GrnService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.grnService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.GRN_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.grnService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.grnService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateGrnDto, @Request() req: any) { return this.grnService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateGrnDto, @Request() req: any) { return this.grnService.update(id, dto, req.user); }

  @Post(':id/submit')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  submit(@Param('id') id: string, @Request() req: any) { return this.grnService.submit(id, req.user); }
}
