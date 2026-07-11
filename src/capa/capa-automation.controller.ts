import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { CapaAutomationService } from './capa-automation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('capa-automation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CapaAutomationController {
  constructor(private readonly capaAutoService: CapaAutomationService) {}

  @Post('auto-create/:ncrId')
  @RequirePermissions(Permission.QUALITY_CREATE)
  autoCreate(@Param('ncrId') ncrId: string, @Request() req: any) { return this.capaAutoService.autoCreateFromNcr(ncrId, req.user); }

  @Get('escalations')
  @RequirePermissions(Permission.QUALITY_VIEW)
  checkEscalations(@Request() req: any) { return this.capaAutoService.checkEscalations(req.user.companyId); }

  @Get('effectiveness/:capaId')
  @RequirePermissions(Permission.QUALITY_VIEW)
  checkEffectiveness(@Param('capaId') capaId: string, @Request() req: any) { return this.capaAutoService.checkEffectiveness(capaId, req.user); }

  @Get('health-score')
  @RequirePermissions(Permission.QUALITY_VIEW)
  getHealthScore(@Request() req: any) { return this.capaAutoService.getHealthScore(req.user.companyId); }
}
