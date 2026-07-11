import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto, UpdateQuotationDto, RejectQuotationDto } from './dto/quotation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('quotations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QuotationsController {
  constructor(private readonly qtService: QuotationsService) {}

  @Get('stats')
  @RequirePermissions(Permission.SALES_VIEW)
  getStats(@Request() req: any) { return this.qtService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.SALES_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.qtService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.qtService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  create(@Body() dto: CreateQuotationDto, @Request() req: any) { return this.qtService.create(dto, req.user); }

  @Post(':id/revise')
  @RequirePermissions(Permission.SALES_CREATE)
  revise(@Param('id') id: string, @Body() dto: CreateQuotationDto, @Request() req: any) { return this.qtService.revise(id, dto, req.user); }

  @Post(':id/send')
  @RequirePermissions(Permission.SALES_EDIT)
  send(@Param('id') id: string, @Request() req: any) { return this.qtService.send(id, req.user); }

  @Post(':id/accept')
  @RequirePermissions(Permission.SALES_EDIT)
  accept(@Param('id') id: string, @Request() req: any) { return this.qtService.accept(id, req.user); }

  @Post(':id/reject')
  @RequirePermissions(Permission.SALES_APPROVE)
  reject(@Param('id') id: string, @Body() dto: RejectQuotationDto, @Request() req: any) { return this.qtService.reject(id, dto, req.user); }
}
