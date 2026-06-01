import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import * as os from 'os';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  async check() {
    const dbStatus = await this.prisma.healthCheck();

    return {
      status: dbStatus ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      services: {
        api: {
          status: 'ok',
          uptime: Math.floor(process.uptime()),
        },
        database: {
          status: dbStatus ? 'ok' : 'error',
          provider: 'postgresql',
        },
      },
      system: {
        platform: os.platform(),
        nodeVersion: process.version,
        memoryUsage: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      },
    };
  }

  @Get('ping')
  @ApiOperation({ summary: 'Simple ping check' })
  ping() {
    return {
      status: 'ok',
      message: 'ERP Backend is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database connectivity check' })
  async dbCheck() {
    const isConnected = await this.prisma.healthCheck();
    return {
      status: isConnected ? 'ok' : 'error',
      database: 'postgresql',
      connected: isConnected,
      timestamp: new Date().toISOString(),
    };
  }
}
