import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CreditControlService } from './credit-control.service';
import { CreateCreditLimitDto, UpdateCreditLimitDto, ReleaseCreditHoldDto, CheckCreditDto } from './dto/credit-control.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('credit-control')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CreditControlController {
  constructor(private readonly ccService: CreditControlService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.ccService.getStats(req.user); }

  @Get('dashboard')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getDashboard(@Request() req: any) { return this.ccService.getDashboard(req.user); }

  @Get('position/:customerName')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getPosition(@Param('customerName') customerName: string, @Request() req: any) { return this.ccService.getCustomerPosition(customerName, req.user.companyId); }

  @Get('limits')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAllLimits(@Request() req: any) { return this.ccService.findAllLimits(req.user); }

  @Get('holds')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAllHolds(@Request() req: any, @Query() query: any) { return this.ccService.findAllHolds(req.user, query); }

  @Post('check')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  checkCredit(@Body() dto: CheckCreditDto, @Request() req: any) { return this.ccService.checkCredit(dto, req.user); }

  @Post('limits')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createLimit(@Body() dto: CreateCreditLimitDto, @Request() req: any) { return this.ccService.createCreditLimit(dto, req.user); }

  @Put('limits/:id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateLimit(@Param('id') id: string, @Body() dto: UpdateCreditLimitDto, @Request() req: any) { return this.ccService.updateCreditLimit(id, dto, req.user); }

  @Post('holds/:id/release')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  releaseHold(@Param('id') id: string, @Body() dto: ReleaseCreditHoldDto, @Request() req: any) { return this.ccService.releaseHold(id, dto, req.user); }
}
