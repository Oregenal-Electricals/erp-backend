import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApService } from './ap.service';
import { CreateApBillDto, CreateApPaymentDto } from './dto/ap.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('ap')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApController {
  constructor(private readonly apService: ApService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.apService.getStats(req.user); }

  @Get('aging')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getAging(@Request() req: any) { return this.apService.getAgingReport(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.apService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.apService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateApBillDto, @Request() req: any) { return this.apService.create(dto, req.user); }

  @Post('payments')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  recordPayment(@Body() dto: CreateApPaymentDto, @Request() req: any) { return this.apService.recordPayment(dto, req.user); }
}
