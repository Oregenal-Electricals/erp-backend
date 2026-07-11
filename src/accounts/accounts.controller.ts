import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('accounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('stats')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getStats(@Request() req: any) { return this.accountsService.getStats(req.user); }

  @Get('tree')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getTree(@Request() req: any) { return this.accountsService.getTree(req.user); }

  @Post('seed')
  @RequirePermissions(Permission.FINANCE_CREATE)
  seed(@Request() req: any) { return this.accountsService.seedDefaultAccounts(req.user.companyId, req.user.id); }

  @Get()
  @RequirePermissions(Permission.FINANCE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.accountsService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.FINANCE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.accountsService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.FINANCE_CREATE)
  create(@Body() dto: CreateAccountDto, @Request() req: any) { return this.accountsService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.FINANCE_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto, @Request() req: any) { return this.accountsService.update(id, dto, req.user); }
}
