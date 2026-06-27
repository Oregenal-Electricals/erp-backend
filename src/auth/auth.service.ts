import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        company: { select: { id: true, name: true, code: true } },
      },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated. Contact administrator.');
    if (user.isLocked) throw new UnauthorizedException('Account is locked due to too many failed attempts. Contact administrator.');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      const newAttempts = user.loginAttempts + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: newAttempts, isLocked: newAttempts >= 5, updatedBy: 'system' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lastLoginAt: new Date(), updatedBy: 'system' },
    });

    // All roles = primary + additional (deduplicated)
    const allRoles = [user.role, ...(user.additionalRoles || [])].filter((v, i, a) => a.indexOf(v) === i);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      additionalRoles: user.additionalRoles || [],
      allRoles,
      companyId: user.companyId,
    };
    const accessToken = this.jwt.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        additionalRoles: user.additionalRoles || [],
        allRoles,
        companyId: user.companyId,
        company: user.company,
        mustChangePwd: user.mustChangePwd,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, additionalRoles: true,
        companyId: true, mustChangePwd: true, lastLoginAt: true,
        company: { select: { id: true, name: true, code: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      ...user,
      allRoles: [user.role, ...(user.additionalRoles || [])].filter((v, i, a) => a.indexOf(v) === i),
    };
  }
}
