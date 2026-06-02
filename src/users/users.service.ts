import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // CREATE USER
  // ─────────────────────────────────────────────
  async createUser(dto: CreateUserDto, requestingUser: any) {
    // Only SUPER_ADMIN can create SUPER_ADMIN
    if (
      dto.role === UserRole.SUPER_ADMIN &&
      requestingUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can assign SUPER_ADMIN role',
      );
    }

    // Check company exists
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    // Check email unique
    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (emailExists) throw new ConflictException('Email already in use');

    // Check employee code unique
    if (dto.employeeCode) {
      const codeExists = await this.prisma.user.findUnique({
        where: { employeeCode: dto.employeeCode },
      });
      if (codeExists)
        throw new ConflictException('Employee code already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        employeeCode: dto.employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        companyId: dto.companyId,
        mustChangePwd: dto.mustChangePwd ?? true,
        createdBy: requestingUser.id,
        updatedBy: requestingUser.id,
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        companyId: true,
        mustChangePwd: true,
        isActive: true,
        isLocked: true,
        createdAt: true,
        company: { select: { id: true, name: true, code: true } },
      },
    });

    await this.audit.log({
      tableName: 'users',
      recordId: user.id,
      action: 'CREATE',
      newValues: { ...user, passwordHash: '[REDACTED]' },
      changedBy: requestingUser.id,
    });

    return user;
  }

  // ─────────────────────────────────────────────
  // LIST USERS
  // ─────────────────────────────────────────────
  async findAllUsers(filters: {
    companyId?: string;
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  }) {
    const where: any = {};

    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.role) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { employeeCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        companyId: true,
        mustChangePwd: true,
        isActive: true,
        isLocked: true,
        lastLoginAt: true,
        createdAt: true,
        company: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  // ─────────────────────────────────────────────
  // GET ONE USER
  // ─────────────────────────────────────────────
  async findOneUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        companyId: true,
        mustChangePwd: true,
        isActive: true,
        isLocked: true,
        loginAttempts: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        company: { select: { id: true, name: true, code: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─────────────────────────────────────────────
  // UPDATE USER
  // ─────────────────────────────────────────────
  async updateUser(id: string, dto: UpdateUserDto, requestingUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Only SUPER_ADMIN can assign SUPER_ADMIN role
    if (
      dto.role === UserRole.SUPER_ADMIN &&
      requestingUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can assign SUPER_ADMIN role',
      );
    }

    // Check employee code unique
    if (dto.employeeCode && dto.employeeCode !== user.employeeCode) {
      const codeExists = await this.prisma.user.findUnique({
        where: { employeeCode: dto.employeeCode },
      });
      if (codeExists)
        throw new ConflictException('Employee code already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { ...dto, updatedBy: requestingUser.id },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        company: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      tableName: 'users',
      recordId: id,
      action: 'UPDATE',
      oldValues: {
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      newValues: dto,
      changedBy: requestingUser.id,
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // TOGGLE STATUS
  // ─────────────────────────────────────────────
  async toggleUserStatus(id: string, requestingUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Cannot deactivate yourself
    if (id === requestingUser.id) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive, updatedBy: requestingUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: true,
      },
    });

    await this.audit.log({
      tableName: 'users',
      recordId: id,
      action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
      oldValues: { isActive: user.isActive },
      newValues: { isActive: updated.isActive },
      changedBy: requestingUser.id,
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // UNLOCK USER
  // ─────────────────────────────────────────────
  async unlockUser(id: string, requestingUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isLocked: false, loginAttempts: 0, updatedBy: requestingUser.id },
      select: { id: true, email: true, isLocked: true, loginAttempts: true },
    });

    await this.audit.log({
      tableName: 'users',
      recordId: id,
      action: 'UPDATE',
      oldValues: { isLocked: true },
      newValues: { isLocked: false },
      changedBy: requestingUser.id,
      reason: 'Account unlocked by admin',
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // RESET PASSWORD (Admin)
  // ─────────────────────────────────────────────
  async resetPassword(id: string, dto: ResetPasswordDto, requestingUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePwd: true,
        loginAttempts: 0,
        isLocked: false,
        updatedBy: requestingUser.id,
      },
    });

    await this.audit.log({
      tableName: 'users',
      recordId: id,
      action: 'UPDATE',
      newValues: { passwordReset: true, mustChangePwd: true },
      changedBy: requestingUser.id,
      reason: 'Password reset by admin',
    });

    return {
      message:
        'Password reset successfully. User must change password on next login.',
    };
  }

  // ─────────────────────────────────────────────
  // CHANGE PASSWORD (Self)
  // ─────────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const currentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!currentValid)
      throw new BadRequestException('Current password is incorrect');

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePwd: false,
        updatedBy: userId,
      },
    });

    await this.audit.log({
      tableName: 'users',
      recordId: userId,
      action: 'UPDATE',
      newValues: { passwordChanged: true, mustChangePwd: false },
      changedBy: userId,
      reason: 'Password changed by user',
    });

    return { message: 'Password changed successfully' };
  }
}
