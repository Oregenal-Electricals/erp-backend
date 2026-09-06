import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { StoreReceivingService } from './store-receiving.service';
import { ReceiveAtStoreDto } from './dto/store-receiving.dto';
import { PhysicalVerificationService } from './physical-verification.service';
import { VerifyLineDto, CorrectLineDto } from './dto/physical-verification.dto';

@Controller('store-receiving')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StoreReceivingController {
  constructor(private service: StoreReceivingService, private verifyService: PhysicalVerificationService) {}

  @Get('pending-from-gate')
  @RequirePermissions(Permission.STORE_RECEIVING_VIEW)
  findPendingFromGate(@Request() req: any) {
    return this.service.findPendingFromGate(req.user);
  }

  @Get()
  @RequirePermissions(Permission.STORE_RECEIVING_VIEW)
  findAll(@Request() req: any, @Query() query: any) {
    return this.service.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.STORE_RECEIVING_DETAIL_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user);
  }

  @Post('receive')
  @RequirePermissions(Permission.STORE_RECEIVING_CREATE)
  receiveAtStore(@Body() dto: ReceiveAtStoreDto, @Request() req: any) {
    return this.service.receiveAtStore(dto, req.user);
  }

  @Post('items/:itemId/verify')
  @RequirePermissions(Permission.STORE_PHYSICAL_VERIFY)
  verifyLine(@Param('itemId') itemId: string, @Body() dto: VerifyLineDto, @Request() req: any) {
    return this.verifyService.verifyLine(itemId, dto, req.user);
  }

  @Post(':id/complete-verification')
  @RequirePermissions(Permission.STORE_PHYSICAL_VERIFY)
  completeVerification(@Param('id') id: string, @Request() req: any) {
    return this.verifyService.completeVerification(id, req.user);
  }

  @Post('items/:itemId/correct')
  @RequirePermissions(Permission.STORE_PHYSICAL_VERIFY_CORRECT)
  correctLine(@Param('itemId') itemId: string, @Body() dto: CorrectLineDto, @Request() req: any) {
    return this.verifyService.correctLine(itemId, dto, req.user);
  }
}
