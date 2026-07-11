import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CustomerPoService } from './customer-po.service';
import { CreateCpoDto, CancelCpoDto } from './dto/customer-po.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('customer-po')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomerPoController {
  constructor(private readonly cpoService: CustomerPoService) {}

  @Get('stats')
  @RequirePermissions(Permission.SALES_VIEW)
  getStats(@Request() req: any) { return this.cpoService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.SALES_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.cpoService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.cpoService.findOne(id, req.user); }

  @Get(':id/shortages')
  @RequirePermissions(Permission.SALES_VIEW)
  getShortages(@Param('id') id: string, @Request() req: any) { return this.cpoService.getShortages(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  create(@Body() dto: CreateCpoDto, @Request() req: any) { return this.cpoService.create(dto, req.user); }

  @Post(':id/acknowledge')
  @RequirePermissions(Permission.SALES_EDIT)
  acknowledge(@Param('id') id: string, @Request() req: any) { return this.cpoService.acknowledge(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.SALES_EDIT)
  cancel(@Param('id') id: string, @Body() dto: CancelCpoDto, @Request() req: any) { return this.cpoService.cancel(id, dto, req.user); }

  @Post(':id/run-shortage-check')
  @RequirePermissions(Permission.SALES_EDIT)
  runShortageCheck(@Param('id') id: string, @Request() req: any) { return this.cpoService.runShortageCheck(id, req.user); }
}
