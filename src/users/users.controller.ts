import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/user.dto';

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.CORPORATE_ADMIN];

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a new user' })
  createUser(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.createUser(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all users with optional filters' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  findAllUsers(
    @Query('companyId') companyId?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAllUsers({
      companyId,
      role,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOneUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOneUser(id);
  }

  @Put(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update user profile and role' })
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateUser(id, dto, user);
  }

  @Patch(':id/toggle-status')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Activate or deactivate user' })
  toggleUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.usersService.toggleUserStatus(id, user);
  }

  @Patch(':id/unlock')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Unlock a locked user account' })
  unlockUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.usersService.unlockUser(id, user);
  }

  @Patch(':id/reset-password')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin resets password for a user' })
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.resetPassword(id, dto, user);
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'User changes own password' })
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: any) {
    return this.usersService.changePassword(user.id, dto);
  }
}
