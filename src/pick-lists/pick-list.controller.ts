import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PickListService } from './pick-list.service';
import { CreatePickListDto, PickItemDto, ReversePickDto } from './dto/pick-list.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('pick-lists')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PickListController {
  constructor(private readonly plService: PickListService) {}

  @Get('suggest-batches/:dispatchReservationId')
  @RequirePermissions(Permission.DISPATCH_PICK_VIEW)
  suggestBatches(@Param('dispatchReservationId') dispatchReservationId: string, @Request() req: any) {
    return this.plService.suggestBatches(dispatchReservationId, req.user);
  }

  @Get(':id')
  @RequirePermissions(Permission.DISPATCH_PICK_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.plService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.DISPATCH_PICK_CREATE)
  createPickList(@Body() dto: CreatePickListDto, @Request() req: any) {
    return this.plService.createPickList(dto.dispatchPlanId, req.user);
  }

  @Post(':pickListId/pick')
  @RequirePermissions(Permission.DISPATCH_PICK_CONFIRM)
  pickItem(@Param('pickListId') pickListId: string, @Body() dto: PickItemDto, @Request() req: any) {
    return this.plService.pickItem(pickListId, dto.dispatchReservationId, dto.batchId, dto.pickQty, req.user);
  }

  @Post('items/:pickListItemId/reverse')
  @RequirePermissions(Permission.DISPATCH_PICK_REVERSE)
  reversePick(@Param('pickListItemId') pickListItemId: string, @Body() dto: ReversePickDto, @Request() req: any) {
    return this.plService.reversePick(pickListItemId, dto.reverseQty, dto.reason, req.user);
  }
}
