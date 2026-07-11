import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PaymentInstrumentService } from './payment-instrument.service';
import { CreatePaymentInstrumentDto, UpdatePaymentInstrumentDto } from './dto/payment-instrument.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('payment-instruments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentInstrumentController {
  constructor(private readonly piService: PaymentInstrumentService) {}

  @Get('stats')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getStats(@Request() req: any) { return this.piService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.FINANCE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.piService.findAll(req.user, query); }

  @Get('ipo/:ipoId')
  @RequirePermissions(Permission.FINANCE_VIEW)
  findByIpo(@Param('ipoId') ipoId: string, @Request() req: any) { return this.piService.findByIpo(ipoId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.FINANCE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.piService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.FINANCE_CREATE)
  create(@Body() dto: CreatePaymentInstrumentDto, @Request() req: any) { return this.piService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.FINANCE_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdatePaymentInstrumentDto, @Request() req: any) { return this.piService.update(id, dto, req.user); }

  @Post(':id/open')
  @RequirePermissions(Permission.FINANCE_EDIT)
  open(@Param('id') id: string, @Request() req: any) { return this.piService.open(id, req.user); }

  @Post(':id/settle')
  @RequirePermissions(Permission.FINANCE_EDIT)
  settle(@Param('id') id: string, @Request() req: any) { return this.piService.settle(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.FINANCE_EDIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.piService.cancel(id, req.user); }
}
