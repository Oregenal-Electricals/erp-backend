import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, CancelVoucherDto } from './dto/voucher.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('vouchers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.vouchersService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.vouchersService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.vouchersService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateVoucherDto, @Request() req: any) { return this.vouchersService.create(dto, req.user); }

  @Post(':id/post')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  post(@Param('id') id: string, @Request() req: any) { return this.vouchersService.post(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  cancel(@Param('id') id: string, @Body() dto: CancelVoucherDto, @Request() req: any) { return this.vouchersService.cancel(id, dto, req.user); }

  @Post('from-delivery/:deliveryId')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  fromDelivery(@Param('deliveryId') deliveryId: string, @Request() req: any) { return this.vouchersService.createSalesInvoiceFromDelivery(deliveryId, req.user); }
}
