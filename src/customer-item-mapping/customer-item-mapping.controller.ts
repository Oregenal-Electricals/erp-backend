import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CustomerItemMappingService } from './customer-item-mapping.service';
import { ResolveOrCreateMappingDto, RequestMappingChangeDto } from './dto/customer-item-mapping.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('customer-item-mappings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomerItemMappingController {
  constructor(private readonly service: CustomerItemMappingService) {}

  @Get()
  @RequirePermissions(Permission.SALES_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.service.findAll(req.user, query); }

  @Get('resolve')
  @RequirePermissions(Permission.SALES_VIEW)
  resolve(@Request() req: any, @Query('customerId') customerId: string, @Query('customerItemCode') customerItemCode: string) {
    return this.service.resolve(customerId, customerItemCode, req.user);
  }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.service.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  createIfMissing(@Body() dto: ResolveOrCreateMappingDto, @Request() req: any) { return this.service.createIfMissing(dto, req.user); }

  @Post(':id/request-change')
  @RequirePermissions(Permission.SALES_CREATE)
  requestChange(@Param('id') id: string, @Body() dto: RequestMappingChangeDto, @Request() req: any) {
    return this.service.requestChange(id, dto, req.user);
  }
}
