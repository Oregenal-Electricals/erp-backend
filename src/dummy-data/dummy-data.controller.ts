import {
  Controller, Get, Post, Delete,
  Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DummyDataService } from './dummy-data.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Dummy Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('dummy-data')
export class DummyDataController {
  constructor(private readonly service: DummyDataService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get test data counts across all entities' })
  getStatus(@CurrentUser() user: any) {
    return this.service.getStatus(
      user.role === UserRole.SUPER_ADMIN ? undefined : user.companyId,
    );
  }

  @Post('seed/:companyId')
  @ApiOperation({ summary: 'Seed test data for a specific company' })
  seedCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.seedCompany(companyId, user.id);
  }

  @Delete('purge/:companyId')
  @ApiOperation({ summary: 'Purge test data for a specific company' })
  purgeCompany(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.service.purgeCompany(companyId);
  }

  @Delete('purge-all')
  @ApiOperation({ summary: 'Purge ALL test data (SUPER_ADMIN only)' })
  purgeAll() {
    return this.service.purgeAll();
  }
}
