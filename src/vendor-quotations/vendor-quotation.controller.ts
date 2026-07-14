import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { VendorQuotationService } from './vendor-quotation.service';
import { CreateVendorQuotationDto, UpdateVendorQuotationDto, UpdateQuotationItemDto } from './dto/vendor-quotation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('vendor-quotations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorQuotationController {
  constructor(private readonly vqService: VendorQuotationService) {}

  @Get('stats')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getStats(@Request() req: any) { return this.vqService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.QUOTATION_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.vqService.findAll(req.user, query); }

  @Get('rfq/:rfqId')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findByRfq(@Param('rfqId') rfqId: string, @Request() req: any) { return this.vqService.findByRfq(rfqId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.vqService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.PURCHASE_CREATE)
  create(@Body() dto: CreateVendorQuotationDto, @Request() req: any) { return this.vqService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateVendorQuotationDto, @Request() req: any) { return this.vqService.update(id, dto, req.user); }

  @Post(':id/submit')
  @RequirePermissions(Permission.PURCHASE_APPROVE)
  submit(@Param('id') id: string, @Request() req: any) { return this.vqService.submit(id, req.user); }

  @Post(':id/finalize')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  finalize(@Param('id') id: string, @Request() req: any) { return this.vqService.finalize(id, req.user); }

  @Post(':id/reject')
  @RequirePermissions(Permission.PURCHASE_APPROVE)
  reject(@Param('id') id: string, @Request() req: any) { return this.vqService.reject(id, req.user); }

  @Put(':id/items/:itemId')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  updateItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateQuotationItemDto, @Request() req: any) { return this.vqService.updateItem(id, itemId, dto, req.user); }
}
