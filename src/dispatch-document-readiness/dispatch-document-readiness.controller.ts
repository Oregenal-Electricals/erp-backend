import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { DispatchDocumentReadinessService } from './dispatch-document-readiness.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-plans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchDocumentReadinessController {
  constructor(private readonly readinessService: DispatchDocumentReadinessService) {}

  @Get(':id/document-readiness')
  @RequirePermissions(Permission.DISPATCH_DOCUMENT_VIEW)
  checkReadiness(@Param('id') id: string, @Request() req: any) {
    return this.readinessService.checkReadiness(id, req.user);
  }
}
