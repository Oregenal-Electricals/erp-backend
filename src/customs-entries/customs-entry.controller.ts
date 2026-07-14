import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CustomsEntryService } from './customs-entry.service';
import { CreateCustomsEntryDto, UpdateCustomsEntryDto, AssessCustomsEntryDto } from './dto/customs-entry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('customs-entries')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomsEntryController {
  constructor(private readonly ceService: CustomsEntryService) {}

  @Get('stats')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getStats(@Request() req: any) { return this.ceService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.CUSTOMS_ENTRY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.ceService.findAll(req.user, query); }

  @Get('ipo/:ipoId')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findByIpo(@Param('ipoId') ipoId: string, @Request() req: any) { return this.ceService.findByIpo(ipoId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.ceService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.PURCHASE_CREATE)
  create(@Body() dto: CreateCustomsEntryDto, @Request() req: any) { return this.ceService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateCustomsEntryDto, @Request() req: any) { return this.ceService.update(id, dto, req.user); }

  @Post(':id/file')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  file(@Param('id') id: string, @Request() req: any) { return this.ceService.file(id, req.user); }

  @Post(':id/assess')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  assess(@Param('id') id: string, @Body() dto: AssessCustomsEntryDto, @Request() req: any) { return this.ceService.assess(id, dto, req.user); }

  @Post(':id/pay-duty')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  payDuty(@Param('id') id: string, @Request() req: any) { return this.ceService.payDuty(id, req.user); }

  @Post(':id/out-of-charge')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  outOfCharge(@Param('id') id: string, @Request() req: any) { return this.ceService.outOfCharge(id, req.user); }
}
