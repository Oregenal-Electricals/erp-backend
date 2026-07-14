import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ArService } from './ar.service';
import { CreateArInvoiceDto, CreateArPaymentDto } from './dto/ar.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('ar')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ArController {
  constructor(private readonly arService: ArService) {}

  @Get('stats')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getStats(@Request() req: any) { return this.arService.getStats(req.user); }

  @Get('aging')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getAging(@Request() req: any) { return this.arService.getAgingReport(req.user); }

  @Get()
  @RequirePermissions(Permission.AR_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.arService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.FINANCE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.arService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.FINANCE_CREATE)
  create(@Body() dto: CreateArInvoiceDto, @Request() req: any) { return this.arService.create(dto, req.user); }

  @Post('from-dispatch/:dispatchId')
  @RequirePermissions(Permission.FINANCE_CREATE)
  createFromDispatch(@Param('dispatchId') dispatchId: string, @Request() req: any) { return this.arService.createFromDispatch(dispatchId, req.user); }

  @Post('payments')
  @RequirePermissions(Permission.FINANCE_CREATE)
  recordPayment(@Body() dto: CreateArPaymentDto, @Request() req: any) { return this.arService.recordPayment(dto, req.user); }
}
