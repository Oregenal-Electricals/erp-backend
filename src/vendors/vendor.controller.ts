import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('vendors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get('stats')
  @RequirePermissions(Permission.VENDORS_VIEW)
  getStats(@Request() req: any) {
    return this.vendorService.getStats(req.user);
  }

  @Get()
  @RequirePermissions(Permission.VENDORS_VIEW)
  findAll(@Request() req: any, @Query() query: any) {
    return this.vendorService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.VENDORS_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.vendorService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.VENDORS_CREATE)
  create(@Body() dto: CreateVendorDto, @Request() req: any) {
    return this.vendorService.create(dto, req.user);
  }

  @Put(':id')
  @RequirePermissions(Permission.VENDORS_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto, @Request() req: any) {
    return this.vendorService.update(id, dto, req.user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.VENDORS_DELETE)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.vendorService.remove(id, req.user);
  }
}
