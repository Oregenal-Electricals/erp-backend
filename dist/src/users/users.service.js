"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = class UsersService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createUser(dto, requestingUser) {
        var _a;
        if (dto.role === client_1.UserRole.SUPER_ADMIN &&
            requestingUser.role !== client_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN role');
        }
        const company = await this.prisma.company.findUnique({
            where: { id: dto.companyId },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        const emailExists = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (emailExists)
            throw new common_1.ConflictException('Email already in use');
        if (dto.employeeCode) {
            const codeExists = await this.prisma.user.findUnique({
                where: { employeeCode: dto.employeeCode },
            });
            if (codeExists)
                throw new common_1.ConflictException('Employee code already in use');
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
                additionalRoles: dto.additionalRoles || [],
                companyId: dto.companyId,
                mustChangePwd: (_a = dto.mustChangePwd) !== null && _a !== void 0 ? _a : true,
                createdBy: requestingUser.id,
                updatedBy: requestingUser.id,
            },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                additionalRoles: true,
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
            newValues: Object.assign(Object.assign({}, user), { passwordHash: '[REDACTED]' }),
            changedBy: requestingUser.id,
        });
        return user;
    }
    async findAllUsers(filters) {
        const where = {};
        if (filters.companyId)
            where.companyId = filters.companyId;
        if (filters.role)
            where.role = filters.role;
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
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
    async findOneUser(id) {
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
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updateUser(id, dto, requestingUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (dto.role === client_1.UserRole.SUPER_ADMIN &&
            requestingUser.role !== client_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN role');
        }
        if (dto.employeeCode && dto.employeeCode !== user.employeeCode) {
            const codeExists = await this.prisma.user.findUnique({
                where: { employeeCode: dto.employeeCode },
            });
            if (codeExists)
                throw new common_1.ConflictException('Employee code already in use');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: requestingUser.id }),
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
    async toggleUserStatus(id, requestingUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (id === requestingUser.id) {
            throw new common_1.BadRequestException('You cannot deactivate your own account');
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
    async unlockUser(id, requestingUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
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
    async resetPassword(id, dto, requestingUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
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
            message: 'Password reset successfully. User must change password on next login.',
        };
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const currentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!currentValid)
            throw new common_1.BadRequestException('Current password is incorrect');
        if (dto.currentPassword === dto.newPassword) {
            throw new common_1.BadRequestException('New password must be different from current password');
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map