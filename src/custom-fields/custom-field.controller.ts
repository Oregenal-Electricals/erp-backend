import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CustomFieldService } from './custom-field.service';
import { CreateCustomFieldDefinitionDto, UpdateCustomFieldDefinitionDto, SaveCustomFieldValuesDto } from './dto/custom-field.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('custom-fields')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomFieldController {
  constructor(private readonly customFieldService: CustomFieldService) {}

  @Get('stats')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getStats(@Request() req: any) { return this.customFieldService.getStats(req.user); }

  @Get('definitions')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getDefinitions(@Request() req: any, @Query('module') module: string) {
    return this.customFieldService.getDefinitions(module, req.user);
  }

  @Get('definitions/all')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getAllDefinitions(@Request() req: any) {
    return this.customFieldService.getAllDefinitions(req.user);
  }

  @Post('definitions')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  createDefinition(@Body() dto: CreateCustomFieldDefinitionDto, @Request() req: any) {
    return this.customFieldService.createDefinition(dto, req.user);
  }

  @Put('definitions/:id')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  updateDefinition(@Param('id') id: string, @Body() dto: UpdateCustomFieldDefinitionDto, @Request() req: any) {
    return this.customFieldService.updateDefinition(id, dto, req.user);
  }

  @Delete('definitions/:id')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  deleteDefinition(@Param('id') id: string, @Request() req: any) {
    return this.customFieldService.deleteDefinition(id, req.user);
  }

  @Get('values/:module/:recordId')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getValues(@Param('module') module: string, @Param('recordId') recordId: string, @Request() req: any) {
    return this.customFieldService.getValues(module, recordId, req.user);
  }

  @Post('values/:module/:recordId')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  saveValues(@Param('module') module: string, @Param('recordId') recordId: string, @Body() body: any, @Request() req: any) {
    return this.customFieldService.saveValues(module, recordId, body, req.user);
  }
}
