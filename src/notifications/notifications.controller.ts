import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkReadDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Get('unread-count')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getUnreadCount(@Request() req: any) { return this.notifService.getUnreadCount(req.user.id, req.user.companyId); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.notifService.findAll(req.user.id, req.user.companyId, query); }

  @Post('mark-read')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  markRead(@Request() req: any, @Body() dto: MarkReadDto) { return this.notifService.markRead(req.user.id, req.user.companyId, dto.ids); }

  @Post('clear-old')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  clearOld(@Request() req: any) { return this.notifService.deleteOld(req.user.id, req.user.companyId); }
}
