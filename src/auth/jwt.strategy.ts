import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    companyId: string;
    previewMode?: boolean;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        isActive: true,
        isLocked: true,
        isTestUser: true,
        assignedStage: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.isLocked) {
      throw new UnauthorizedException('Account is locked');
    }

    // previewMode is a JWT-only claim (set exclusively by
    // previewLoginAsRole/previewLoginAsUser, never by a normal login) -
    // it deliberately never touches the DB, so exiting a preview needs no
    // cleanup. Merged in here rather than re-derived, since this is the
    // one place that already verifies the token's signature.
    return { ...user, previewMode: payload.previewMode === true };
  }
}
