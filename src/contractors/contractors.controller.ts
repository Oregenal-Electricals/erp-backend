import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto, UpdateContractorDto } from './dto/contractor.dto';

@Controller('contractors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContractorsController {
  constructor(private contractorsService: ContractorsService) {}

  @Get()
  @RequirePermissions(Permission.HR_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.contractorsService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.HR_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.contractorsService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.HR_CREATE)
  create(@Body() dto: CreateContractorDto, @Request() req: any) { return this.contractorsService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.HR_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateContractorDto, @Request() req: any) { return this.contractorsService.update(id, dto, req.user); }

  @Delete(':id')
  @RequirePermissions(Permission.HR_EDIT)
  remove(@Param('id') id: string, @Request() req: any) { return this.contractorsService.remove(id, req.user); }
}
