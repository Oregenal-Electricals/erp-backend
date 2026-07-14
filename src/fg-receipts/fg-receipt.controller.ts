import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FgReceiptService } from './fg-receipt.service';
import { CreateFgReceiptDto } from './dto/fg-receipt.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('fg-receipts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FgReceiptController {
  constructor(private readonly fgrService: FgReceiptService) {}

  @Get('stats')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  getStats(@Request() req: any) { return this.fgrService.getStats(req.user); }

  @Get('pending-wos')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  getPendingWos(@Request() req: any) { return this.fgrService.getCompletedWosWithoutFgr(req.user); }

  @Get()
  @RequirePermissions(Permission.FG_RECEIPT_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.fgrService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.fgrService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.PRODUCTION_CREATE)
  create(@Body() dto: CreateFgReceiptDto, @Request() req: any) { return this.fgrService.create(dto, req.user); }

  @Post('from-wo/:woId')
  @RequirePermissions(Permission.PRODUCTION_CREATE)
  createFromWo(@Param('woId') woId: string, @Request() req: any) { return this.fgrService.createFromWo(woId, req.user); }

  @Post(':id/confirm')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  confirm(@Param('id') id: string, @Request() req: any) { return this.fgrService.confirm(id, req.user); }
}
