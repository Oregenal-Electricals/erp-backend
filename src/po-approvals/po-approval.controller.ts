import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PoApprovalService } from './po-approval.service';
import { ApprovePoDto, RejectPoDto, CreateApprovalSettingDto, UpdateApprovalSettingDto } from './dto/po-approval.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('po-approvals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PoApprovalController {
  constructor(private readonly poApprovalService: PoApprovalService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.poApprovalService.getStats(req.user); }

  @Get('settings')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getSettings(@Request() req: any) { return this.poApprovalService.getSettings(req.user); }

  @Post('settings')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  createSetting(@Body() dto: CreateApprovalSettingDto, @Request() req: any) { return this.poApprovalService.createSetting(dto, req.user); }

  @Put('settings/:id')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  updateSetting(@Param('id') id: string, @Body() dto: UpdateApprovalSettingDto, @Request() req: any) { return this.poApprovalService.updateSetting(id, dto, req.user); }

  @Get('pending')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getPending(@Request() req: any) { return this.poApprovalService.getPending(req.user); }

  @Get(':poId/history')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getHistory(@Param('poId') poId: string, @Request() req: any) { return this.poApprovalService.getHistory(poId, req.user); }

  @Post(':poId/approve')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  approve(@Param('poId') poId: string, @Body() dto: ApprovePoDto, @Request() req: any) { return this.poApprovalService.approve(poId, dto, req.user); }

  @Post(':poId/reject')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  reject(@Param('poId') poId: string, @Body() dto: RejectPoDto, @Request() req: any) { return this.poApprovalService.reject(poId, dto, req.user); }
}
