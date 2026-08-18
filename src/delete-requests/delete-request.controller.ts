import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DeleteRequestService } from './delete-request.service';
import { CreateDeleteRequestDto, RejectDeleteRequestDto } from './dto/delete-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('delete-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DeleteRequestController {
  constructor(private readonly service: DeleteRequestService) {}

  @Post()
  create(@Body() dto: CreateDeleteRequestDto, @Request() req: any) {
    return this.service.create(dto.tableName, dto.recordId, dto.reason, req.user);
  }

  @Get('pending')
  @RequirePermissions(Permission.DELETE_APPROVE)
  listPending(@Request() req: any) {
    return this.service.listPending(req.user);
  }

  @Get('mine')
  listMine(@Request() req: any) {
    return this.service.listMine(req.user);
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.DELETE_APPROVE)
  approve(@Param('id') id: string, @Request() req: any) {
    return this.service.approve(id, req.user);
  }

  @Post(':id/reject')
  @RequirePermissions(Permission.DELETE_APPROVE)
  reject(@Param('id') id: string, @Body() dto: RejectDeleteRequestDto, @Request() req: any) {
    return this.service.reject(id, req.user, dto.comments);
  }
}
