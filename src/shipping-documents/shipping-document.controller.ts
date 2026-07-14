import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ShippingDocumentService } from './shipping-document.service';
import { CreateShippingDocumentDto, UpdateShippingDocumentDto } from './dto/shipping-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('shipping-documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ShippingDocumentController {
  constructor(private readonly sdService: ShippingDocumentService) {}

  @Get('stats')
  @RequirePermissions(Permission.SALES_VIEW)
  getStats(@Request() req: any) { return this.sdService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.DOCUMENT_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.sdService.findAll(req.user, query); }

  @Get('shipment/:shipmentId')
  @RequirePermissions(Permission.SALES_VIEW)
  findByShipment(@Param('shipmentId') shipmentId: string, @Request() req: any) { return this.sdService.findByShipment(shipmentId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.sdService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  create(@Body() dto: CreateShippingDocumentDto, @Request() req: any) { return this.sdService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.SALES_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateShippingDocumentDto, @Request() req: any) { return this.sdService.update(id, dto, req.user); }

  @Post(':id/verify')
  @RequirePermissions(Permission.SALES_EDIT)
  verify(@Param('id') id: string, @Request() req: any) { return this.sdService.verify(id, req.user); }

  @Post(':id/surrender')
  @RequirePermissions(Permission.SALES_EDIT)
  surrender(@Param('id') id: string, @Request() req: any) { return this.sdService.surrender(id, req.user); }
}
