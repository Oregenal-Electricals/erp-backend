import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DispatchConfirmationService } from './dispatch-confirmation.service';
import { CreateConfirmationDto, ConfirmPackageDto, ReverseConfirmationDto } from './dto/dispatch-confirmation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-confirmation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchConfirmationController {
  constructor(private readonly confirmationService: DispatchConfirmationService) {}

  @Get(':id')
  @RequirePermissions(Permission.DISPATCH_CONFIRM_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.confirmationService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.DISPATCH_CONFIRM_CREATE)
  createConfirmation(@Body() dto: CreateConfirmationDto, @Request() req: any) {
    return this.confirmationService.createConfirmation(dto.loadingId, req.user);
  }

  @Post(':id/packages')
  @RequirePermissions(Permission.DISPATCH_CONFIRM_CREATE)
  confirmPackage(@Param('id') id: string, @Body() dto: ConfirmPackageDto, @Request() req: any) {
    return this.confirmationService.confirmPackage(id, dto.packageId, req.user);
  }

  @Post('items/:itemId/reverse')
  @RequirePermissions(Permission.DISPATCH_CONFIRM_REVERSE)
  reverseConfirmationItem(@Param('itemId') itemId: string, @Body() dto: ReverseConfirmationDto, @Request() req: any) {
    return this.confirmationService.reverseConfirmationItem(itemId, dto.reason, req.user);
  }
}
