import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BomImportService } from './bom-import.service';
import { ConfirmBomImportDto } from './dto/bom-import.dto';

@ApiTags('BOM Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('bom-import')
export class BomImportController {
  constructor(private readonly service: BomImportService) {}

  @Post('parse')
  @RequirePermissions(Permission.BOM_VIEW)
  @ApiOperation({ summary: 'Parse an uploaded BOM file (xlsx/csv/pdf) into a preview - does not write to the database' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async parse(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any): Promise<any> {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.service.parseFile(file, user.companyId);
  }

  @Post('confirm')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  @ApiOperation({ summary: 'Create the Product (if new), any missing Raw Materials, the BOM, and all line items from a previously-parsed preview' })
  async confirm(@Body() dto: ConfirmBomImportDto, @CurrentUser() user: any) {
    return this.service.confirmImport(dto, user);
  }
}
