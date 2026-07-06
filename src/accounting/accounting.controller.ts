import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateGroupDto, CreateAccountDto } from './dto/accounting.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('accounting')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.accountingService.getStats(req.user); }

  @Post('seed-coa')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  seedCoa(@Request() req: any) { return this.accountingService.seedDefaultCoa(req.user.companyId, req.user.id); }

  @Get('groups')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getGroups(@Request() req: any) { return this.accountingService.findAllGroups(req.user); }

  @Post('groups')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createGroup(@Body() dto: CreateGroupDto, @Request() req: any) { return this.accountingService.createGroup(dto, req.user); }

  @Put('groups/:id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateGroup(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.accountingService.updateGroup(id, dto, req.user); }

  @Get('accounts')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getAccounts(@Request() req: any, @Query() query: any) { return this.accountingService.findAllAccounts(req.user, query); }

  @Get('accounts/:id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getAccount(@Param('id') id: string, @Request() req: any) { return this.accountingService.getAccount(id, req.user); }

  @Post('accounts')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createAccount(@Body() dto: CreateAccountDto, @Request() req: any) { return this.accountingService.createAccount(dto, req.user); }

  @Put('accounts/:id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateAccount(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.accountingService.updateAccount(id, dto, req.user); }
}
