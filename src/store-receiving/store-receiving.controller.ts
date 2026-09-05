import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { StoreReceivingService } from './store-receiving.service';
import { ReceiveAtStoreDto } from './dto/store-receiving.dto';

@Controller('store-receiving')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StoreReceivingController {
  constructor(private service: StoreReceivingService) {}

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
}
