import { Controller, Get, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { TraceService } from './trace.service';

@Controller('trace')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TraceController {
  constructor(private service: TraceService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  search(@Query('q') q: string, @Request() req: any) {
    if (!q || !q.trim()) throw new BadRequestException('Provide an item code or batch number to trace');
    return this.service.search(q, req.user);
  }
}
