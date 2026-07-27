import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { StageTransferService } from './stage-transfer.service';
import { GiveTransferDto } from './dto/stage-transfer.dto';

@Controller('stage-transfers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StageTransferController {
  constructor(private stageTransferService: StageTransferService) {}

  @Get()
  @RequirePermissions(Permission.STAGE_TRANSFER_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.stageTransferService.findAll(req.user, query); }

  @Post('give')
  @RequirePermissions(Permission.STAGE_TRANSFER_GIVE)
  give(@Body() dto: GiveTransferDto, @Request() req: any) { return this.stageTransferService.give(dto, req.user); }

  @Post(':id/receive')
  @RequirePermissions(Permission.STAGE_TRANSFER_RECEIVE)
  receive(@Param('id') id: string, @Request() req: any) { return this.stageTransferService.receive(id, req.user); }
}
