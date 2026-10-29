import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MaterialHoldDaysService } from './material-hold-days.service';
import {
  CreateMaterialHoldDaysRuleDto,
  UpdateMaterialHoldDaysRuleDto,
  UpdateDefaultHoldDaysDto,
} from './dto/material-hold-days.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('material-hold-days')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MaterialHoldDaysController {
  constructor(private readonly service: MaterialHoldDaysService) {}

  // The resulting Store aging alert stays visible to every role that
  // already sees the Store/Inventory Dashboard - only the rule
  // configuration below is Admin/Super Admin only.
  @Get('aging-stock')
  @RequirePermissions(Permission.INVENTORY_DASHBOARD_VIEW)
  getAgingStock(@Request() req: any) {
    return this.service.getAgingStock(req.user);
  }

  @Get('default')
  @RequirePermissions(Permission.STORE_HOLD_DAYS_RULE_VIEW)
  getDefault() {
    return this.service.getGlobalDefault();
  }

  @Put('default')
  @RequirePermissions(Permission.STORE_HOLD_DAYS_RULE_MANAGE)
  updateDefault(@Body() dto: UpdateDefaultHoldDaysDto, @Request() req: any) {
    return this.service.updateGlobalDefault(dto, req.user);
  }

  @Get('resolve')
  @RequirePermissions(Permission.STORE_HOLD_DAYS_RULE_VIEW)
  resolve(@Query('rawMaterialId') rawMaterialId: string, @Query('vendorId') vendorId: string, @Request() req: any) {
    return this.service.resolve(req.user, rawMaterialId, vendorId || undefined);
  }

  @Get()
  @RequirePermissions(Permission.STORE_HOLD_DAYS_RULE_VIEW)
  findAll(@Request() req: any, @Query() query: any) {
    return this.service.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.STORE_HOLD_DAYS_RULE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.STORE_HOLD_DAYS_RULE_MANAGE)
  create(@Body() dto: CreateMaterialHoldDaysRuleDto, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Put(':id')
  @RequirePermissions(Permission.STORE_HOLD_DAYS_RULE_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateMaterialHoldDaysRuleDto, @Request() req: any) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.STORE_HOLD_DAYS_RULE_MANAGE)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user);
  }
}
