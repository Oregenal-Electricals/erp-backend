import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RawMaterialService } from './raw-material.service';
import { CreateRawMaterialDto, UpdateRawMaterialDto } from './dto/raw-material.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('raw-materials')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RawMaterialController {
  constructor(private readonly rawMaterialService: RawMaterialService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) {
    return this.rawMaterialService.getStats(req.user);
  }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) {
    return this.rawMaterialService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.rawMaterialService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateRawMaterialDto, @Request() req: any) {
    return this.rawMaterialService.create(dto, req.user);
  }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateRawMaterialDto, @Request() req: any) {
    return this.rawMaterialService.update(id, dto, req.user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.rawMaterialService.remove(id, req.user);
  }
}
