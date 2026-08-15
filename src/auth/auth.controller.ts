import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password — returns JWT token',
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress;
    return this.authService.login(dto, ip);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @Post('preview-login')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SUPER_ADMIN only: log in directly as the real seeded user for a given role, to preview their full experience' })
  async previewLogin(@Body('roleName') roleName: string, @CurrentUser() user: any) {
    return this.authService.previewLoginAsRole(roleName, user);
  }

  async me(@CurrentUser() user: any) {
    return this.authService.me(user.id);
  }
}
