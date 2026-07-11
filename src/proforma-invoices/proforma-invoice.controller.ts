import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProformaInvoiceService } from './proforma-invoice.service';
import { CreateProformaInvoiceDto, UpdateProformaInvoiceDto, RejectPiDto } from './dto/proforma-invoice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('proforma-invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProformaInvoiceController {
  constructor(private readonly piService: ProformaInvoiceService) {}

  @Get('stats')
  @RequirePermissions(Permission.SALES_VIEW)
  getStats(@Request() req: any) { return this.piService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.SALES_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.piService.findAll(req.user, query); }

  @Get('ipo/:ipoId')
  @RequirePermissions(Permission.SALES_VIEW)
  findByIpo(@Param('ipoId') ipoId: string, @Request() req: any) { return this.piService.findByIpo(ipoId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.piService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  create(@Body() dto: CreateProformaInvoiceDto, @Request() req: any) { return this.piService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.SALES_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateProformaInvoiceDto, @Request() req: any) { return this.piService.update(id, dto, req.user); }

  @Post(':id/accept')
  @RequirePermissions(Permission.SALES_EDIT)
  accept(@Param('id') id: string, @Request() req: any) { return this.piService.accept(id, req.user); }

  @Post(':id/reject')
  @RequirePermissions(Permission.SALES_APPROVE)
  reject(@Param('id') id: string, @Body() dto: RejectPiDto, @Request() req: any) { return this.piService.reject(id, dto, req.user); }
}
