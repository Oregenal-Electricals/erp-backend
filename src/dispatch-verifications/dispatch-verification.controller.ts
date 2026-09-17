import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DispatchVerificationService } from './dispatch-verification.service';
import { CreateVerificationDto, VerifyItemDto, ReverseVerificationDto } from './dto/dispatch-verification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-verifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchVerificationController {
  constructor(private readonly dvService: DispatchVerificationService) {}

  @Get(':id')
  @RequirePermissions(Permission.DISPATCH_VERIFY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.dvService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.DISPATCH_VERIFY_CONFIRM)
  createVerification(@Body() dto: CreateVerificationDto, @Request() req: any) {
    return this.dvService.createVerification(dto.pickListId, req.user);
  }

  @Post(':verificationId/verify')
  @RequirePermissions(Permission.DISPATCH_VERIFY_CONFIRM)
  verifyItem(@Param('verificationId') verificationId: string, @Body() dto: VerifyItemDto, @Request() req: any) {
    return this.dvService.verifyItem(verificationId, dto.pickListItemId, dto.verifiedQty, req.user);
  }

  @Post('items/:verificationItemId/reverse')
  @RequirePermissions(Permission.DISPATCH_VERIFY_REVERSE)
  reverseVerification(@Param('verificationItemId') verificationItemId: string, @Body() dto: ReverseVerificationDto, @Request() req: any) {
    return this.dvService.reverseVerification(verificationItemId, dto.reverseQty, dto.reason, req.user);
  }
}
