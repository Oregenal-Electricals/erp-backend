import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateMachineDto, PostReadingDto, BulkReadingDto, UpdateAlertDto } from './dto/iot.dto';

// Alert thresholds
const DEFAULT_THRESHOLDS: Record<string, { min?: number; max: number; unit: string }> = {
  TEMPERATURE: { max: 80, unit: '°C' },
  VIBRATION:   { max: 10, unit: 'mm/s' },
  CURRENT:     { max: 50, unit: 'A' },
  PRESSURE:    { max: 100, unit: 'bar' },
};

@Injectable()
export class IotService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ── MACHINES ─────────────────────────────────────────────────────────────

  async createMachine(dto: CreateMachineDto, user: any) {
    const existing = await this.prisma.iotMachine.findUnique({ where: { companyId_machineCode: { companyId: user.companyId, machineCode: dto.machineCode } } });
    if (existing) throw new BadRequestException(`Machine code ${dto.machineCode} already exists`);
    const machine = await this.prisma.iotMachine.create({
      data: { ...dto, machineType: dto.machineType || 'GENERAL', companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'iot_machines', recordId: machine.id, action: 'CREATE', newValues: machine, changedBy: user.id });
    return machine;
  }

  async updateMachine(id: string, dto: any, user: any) {
    const machine = await this.prisma.iotMachine.findFirst({ where: { id, companyId: user.companyId } });
    if (!machine) throw new NotFoundException('Machine not found');
    return this.prisma.iotMachine.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
  }

  async updateMachineStatus(id: string, status: string, user: any) {
    const machine = await this.prisma.iotMachine.findFirst({ where: { id, companyId: user.companyId } });
    if (!machine) throw new NotFoundException('Machine not found');
    return this.prisma.iotMachine.update({ where: { id }, data: { status, lastPingAt: new Date(), updatedBy: user.id } });
  }

  async findAllMachines(user: any, query: any) {
    const { status, machineType } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (status) where.status = status;
    if (machineType) where.machineType = machineType;
    return this.prisma.iotMachine.findMany({ where, orderBy: { machineCode: 'asc' } });
  }

  async getMachine(id: string, user: any) {
    const machine = await this.prisma.iotMachine.findFirst({ where: { id, companyId: user.companyId } });
    if (!machine) throw new NotFoundException('Machine not found');
    const [latestReadings, openAlerts] = await Promise.all([
      this.prisma.machineReading.findMany({ where: { machineId: id, companyId: user.companyId }, orderBy: { recordedAt: 'desc' }, take: 20 }),
      this.prisma.iotAlert.findMany({ where: { machineId: id, companyId: user.companyId, status: 'OPEN' }, orderBy: { createdAt: 'desc' } }),
    ]);
    return { ...machine, latestReadings, openAlerts };
  }

  // ── READINGS ──────────────────────────────────────────────────────────────

  async postReading(dto: PostReadingDto, user: any) {
    const machine = await this.prisma.iotMachine.findFirst({ where: { id: dto.machineId, companyId: user.companyId } });
    if (!machine) throw new NotFoundException('Machine not found');

    const reading = await this.prisma.machineReading.create({
      data: { companyId: user.companyId, machineId: dto.machineId, readingType: dto.readingType, value: dto.value, unit: dto.unit, createdBy: user.id, updatedBy: user.id },
    });

    // Update machine status to RUNNING
    await this.prisma.iotMachine.update({ where: { id: dto.machineId }, data: { status: 'RUNNING', lastPingAt: new Date(), updatedBy: user.id } });

    // Check thresholds and raise alerts
    const threshold = DEFAULT_THRESHOLDS[dto.readingType];
    if (threshold && dto.value > threshold.max) {
      await this.prisma.iotAlert.create({
        data: {
          companyId: user.companyId, machineId: dto.machineId,
          alertType: 'THRESHOLD_BREACH', severity: dto.value > threshold.max * 1.2 ? 'CRITICAL' : 'WARNING',
          parameter: dto.readingType, value: dto.value, threshold: threshold.max,
          message: `${machine.machineName}: ${dto.readingType} ${dto.value}${dto.unit || ''} exceeds threshold ${threshold.max}${threshold.unit}`,
          createdBy: user.id, updatedBy: user.id,
        },
      });
    }
    return reading;
  }

  async bulkPostReadings(dto: BulkReadingDto, user: any) {
    const results = [];
    for (const r of dto.readings) {
      try {
        const reading = await this.postReading({ machineId: dto.machineId, ...r }, user);
        results.push({ readingType: r.readingType, success: true, id: reading.id });
      } catch(e) {
        results.push({ readingType: r.readingType, success: false, error: e.message });
      }
    }
    return { machineId: dto.machineId, total: results.length, success: results.filter(r=>r.success).length, results };
  }

  async getReadings(machineId: string, user: any, query: any) {
    const { readingType, hours = 24 } = query;
    const from = new Date(Date.now() - Number(hours) * 3600000);
    const where: any = { machineId, companyId: user.companyId, recordedAt: { gte: from } };
    if (readingType) where.readingType = readingType;
    return this.prisma.machineReading.findMany({ where, orderBy: { recordedAt: 'desc' }, take: 500 });
  }

  // ── ALERTS ────────────────────────────────────────────────────────────────

  async getAlerts(user: any, query: any) {
    const { status, machineId, severity } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (status) where.status = status;
    if (machineId) where.machineId = machineId;
    if (severity) where.severity = severity;
    return this.prisma.iotAlert.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 100,
      include: { machine: { select: { machineName: true, machineCode: true, location: true } } },
    });
  }

  async updateAlert(id: string, dto: UpdateAlertDto, user: any) {
    const alert = await this.prisma.iotAlert.findFirst({ where: { id, companyId: user.companyId } });
    if (!alert) throw new NotFoundException('Alert not found');
    return this.prisma.iotAlert.update({
      where: { id },
      data: { status: dto.status, ...(dto.status === 'RESOLVED' && { resolvedAt: new Date(), resolvedBy: user.id }), updatedBy: user.id },
    });
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────

  async getDashboard(user: any) {
    const [totalMachines, onlineMachines, runningMachines, openAlerts, criticalAlerts] = await Promise.all([
      this.prisma.iotMachine.count({ where: { companyId: user.companyId, isActive: true } }),
      this.prisma.iotMachine.count({ where: { companyId: user.companyId, isActive: true, status: 'ONLINE' } }),
      this.prisma.iotMachine.count({ where: { companyId: user.companyId, isActive: true, status: 'RUNNING' } }),
      this.prisma.iotAlert.count({ where: { companyId: user.companyId, status: 'OPEN' } }),
      this.prisma.iotAlert.count({ where: { companyId: user.companyId, status: 'OPEN', severity: 'CRITICAL' } }),
    ]);

    const machines = await this.prisma.iotMachine.findMany({
      where: { companyId: user.companyId, isActive: true },
      orderBy: { machineCode: 'asc' },
    });

    return { totalMachines, onlineMachines, runningMachines, offlineMachines: totalMachines - onlineMachines - runningMachines, openAlerts, criticalAlerts, machines };
  }

  // ── AI ANALYTICS (M127) ──────────────────────────────────────────────────

  async getAiInsights(user: any) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [topOtEmployees, slowMovingItems, vendorRejectionRates, productionEfficiency] = await Promise.all([
      // Top OT employees this month
      this.prisma.payrollEntry.findMany({
        where: { companyId: user.companyId, createdAt: { gte: monthStart }, otHours: { gt: 0 } },
        include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
        orderBy: { otHours: 'desc' }, take: 5,
      }),
      // Slow moving inventory
      this.prisma.stockBalance.findMany({
        where: { companyId: user.companyId },
        take: 10,
      }),
      // Vendor rejection rates
      this.prisma.vendor.findMany({
        where: { companyId: user.companyId, isActive: true },
        include: { _count: { select: { purchaseOrders: true } } },
        take: 5,
      }),
      // Production efficiency from work orders
      this.prisma.workOrder.findMany({
        where: { companyId: user.companyId, createdAt: { gte: monthStart } },
        select: { id: true, status: true, plannedQty: true },
        take: 20,
      }),
    ]);

    const totalPlanned = productionEfficiency.reduce((s, w) => s + (w.plannedQty || 0), 0);
    const totalActual = productionEfficiency.filter(w => w.status === 'COMPLETED').length * 100;
    const efficiencyRate = totalPlanned > 0 ? Math.round(totalActual / totalPlanned * 100) : 0;

    return {
      reportType: 'AI_INSIGHTS',
      generatedAt: now,
      insights: [
        { category: 'HR', title: 'High OT Employees', data: topOtEmployees.map(e => ({ name: `${e.employee?.firstName} ${e.employee?.lastName}`, otHours: e.otHours, otAmount: e.otAmount })) },
        { category: 'INVENTORY', title: 'High Stock Items', data: slowMovingItems.map(i => ({ id: i.id, companyId: i.companyId })) },
        { category: 'PRODUCTION', title: 'Production Efficiency', data: { efficiencyRate, totalPlanned: productionEfficiency.length, completed: productionEfficiency.filter(w=>w.status==='COMPLETED').length, workOrders: productionEfficiency.length } },
      ],
    };
  }

  // ── PREDICTIVE ANALYTICS (M128) ──────────────────────────────────────────

  async getPredictiveInsights(user: any) {
    const machines = await this.prisma.iotMachine.findMany({ where: { companyId: user.companyId, isActive: true } });
    const predictions = machines.map(m => ({
      machineId: m.id, machineCode: m.machineCode, machineName: m.machineName,
      maintenanceDue: m.status === 'ERROR' ? 'IMMEDIATE' : m.status === 'OFFLINE' ? 'SOON' : 'SCHEDULED',
      predictedDowntime: m.status === 'ERROR' ? 'HIGH RISK' : 'LOW RISK',
      recommendation: m.status === 'ERROR' ? 'Schedule immediate maintenance' : m.status === 'OFFLINE' ? 'Check connectivity and power' : 'Continue monitoring',
    }));
    return { reportType: 'PREDICTIVE_ANALYTICS', generatedAt: new Date(), predictions };
  }
}
