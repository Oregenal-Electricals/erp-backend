import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RfqService } from './rfq.service';
import { CreateRfqDto, UpdateRfqDto, AddRfqVendorDto } from './dto/rfq.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('rfqs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Get('stats')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getStats(@Request() req: any) { return this.rfqService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.rfqService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.rfqService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.PURCHASE_CREATE)
  create(@Body() dto: CreateRfqDto, @Request() req: any) { return this.rfqService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateRfqDto, @Request() req: any) { return this.rfqService.update(id, dto, req.user); }

  @Post(':id/send')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  send(@Param('id') id: string, @Request() req: any) { return this.rfqService.send(id, req.user); }

  @Post(':id/close')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  close(@Param('id') id: string, @Request() req: any) { return this.rfqService.close(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.rfqService.cancel(id, req.user); }

  @Post(':id/vendors')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  addVendor(@Param('id') id: string, @Body() dto: AddRfqVendorDto, @Request() req: any) { return this.rfqService.addVendor(id, dto, req.user); }

  @Delete(':id/vendors/:vendorId')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  removeVendor(@Param('id') id: string, @Param('vendorId') vendorId: string, @Request() req: any) { return this.rfqService.removeVendor(id, vendorId, req.user); }
}
