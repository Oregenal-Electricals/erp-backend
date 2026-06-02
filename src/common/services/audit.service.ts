import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditParams {
  tableName: string;
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'ACTIVATE' | 'DEACTIVATE';
  oldValues?: any;
  newValues?: any;
  changedBy: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: AuditParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tableName: params.tableName,
          recordId: params.recordId,
          action: params.action,
          oldValues: params.oldValues ?? undefined,
          newValues: params.newValues ?? undefined,
          changedBy: params.changedBy,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          reason: params.reason,
          createdBy: params.changedBy,
          updatedBy: params.changedBy,
        },
      });
    } catch (error) {
      // Audit failure must NEVER crash the main business flow
      this.logger.error('Audit log write failed', error);
    }
  }
}
