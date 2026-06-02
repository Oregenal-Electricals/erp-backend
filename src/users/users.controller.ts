import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import {
  CreateUserDto, UpdateUserDto,
  ResetPasswordDto, ChangePasswordDto,
} from './dto/user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(Permission.USER_CREATE)
  @ApiOperation({ summary: 'Create a new user' })
  createUser(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.createUser(dto, user);
  }

  @Get()
  @RequirePermissions(Permission.USER_VIEW)
  @ApiOperation({ summary: 'List all users with filters' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'role',      required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive',  required: false, type: Boolean })
  @ApiQuery({ name: 'search',    required: false })
  findAllUsers(
    @Query('companyId') companyId?: string,
    @Query('role')      role?: UserRole,
    @Query('isActive')  isActive?: string,
    @Query('search')    search?: string,
  ) {
    return this.usersService.findAllUsers({
      companyId, role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
    });
  }

  @Get('change-password')
  @ApiOperation({ summary: 'Placeholder — use PATCH below' })
  changePwdInfo() {
    return { message: 'Use PATCH /users/change-password' };
  }

  @Get(':id')
  @RequirePermissions(Permission.USER_VIEW)
  @ApiOperation({ summary: 'Get user by ID' })
  findOneUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOneUser(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.USER_EDIT)
  @ApiOperation({ summary: 'Update user profile and role' })
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateUser(id, dto, user);
  }

  @Patch(':id/toggle-status')
  @RequirePermissions(Permission.USER_TOGGLE_STATUS)
  @ApiOperation({ summary: 'Activate or deactivate user' })
  toggleUserStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.usersService.toggleUserStatus(id, user);
  }

  @Patch(':id/unlock')
  @RequirePermissions(Permission.USER_UNLOCK)
  @ApiOperation({ summary: 'Unlock a locked user account' })
  unlockUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.usersService.unlockUser(id, user);
  }

  @Patch(':id/reset-password')
  @RequirePermissions(Permission.USER_RESET_PASSWORD)
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
