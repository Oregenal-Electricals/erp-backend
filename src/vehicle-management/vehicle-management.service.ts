import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  LogVehicleEntryDto,
  LogVehicleExitDto,
} from './dto/vehicle.dto';
import { VehicleLogStatus } from '@prisma/client';

@Injectable()
export class VehicleManagementService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private settings: SettingsService,
  ) {}

  // ── VEHICLE MASTER ────────────────────────────

  async createVehicle(dto: CreateVehicleDto, user: any) {
    const exists = await this.prisma.vehicle.findUnique({
      where: { companyId_vehicleNumber: { companyId: user.companyId, vehicleNumber: dto.vehicleNumber.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Vehicle ${dto.vehicleNumber} already registered`);

    const vehicle = await this.prisma.vehicle.create({
      data: { ...dto, vehicleNumber: dto.vehicleNumber.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'vehicles', recordId: vehicle.id, action: 'CREATE', newValues: vehicle, changedBy: user.id });
    return vehicle;
  }

  async findAllVehicles(user: any, search?: string) {
    const where: any = { companyId: user.companyId };
    if (search) {
      where.OR = [
        { vehicleNumber: { contains: search.toUpperCase(), mode: 'insensitive' } },
        { ownerName:     { contains: search, mode: 'insensitive' } },
        { ownerMobile:   { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.vehicle.findMany({
      where,
      include: { _count: { select: { logs: true } } },
      orderBy: { vehicleNumber: 'asc' },
    });
  }

  async findOneVehicle(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        logs: {
          include: {
            plant:   { select: { id: true, name: true, code: true } },
            entryBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { entryTime: 'desc' },
          take: 10,
        },
      },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto, user: any) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'vehicles', recordId: id, action: 'UPDATE', oldValues: vehicle, newValues: dto, changedBy: user.id });
    return updated;
  }

  // ── VEHICLE LOGS ──────────────────────────────

  async logEntry(dto: LogVehicleEntryDto, user: any) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
    if (!plant) throw new NotFoundException('Plant not found');

    // Check not already inside
    const alreadyIn = await this.prisma.vehicleLog.findFirst({
      where: { vehicleId: dto.vehicleId, status: VehicleLogStatus.INSIDE },
    });
    if (alreadyIn) throw new ConflictException(`Vehicle ${vehicle.vehicleNumber} is already inside`);

    // Generate log number
    let logNumber: string;
    try {
      logNumber = await this.settings.getNextNumber(user.companyId, 'VEH');
    } catch {
      const count = await this.prisma.vehicleLog.count({ where: { companyId: user.companyId } });
      const now = new Date();
      const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      logNumber = `VEH-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
    }

    const log = await this.prisma.vehicleLog.create({
      data: {
        logNumber,
        companyId:           user.companyId,
        vehicleId:           dto.vehicleId,
        plantId:             dto.plantId,
        driverName:          dto.driverName,
        driverMobile:        dto.driverMobile,
        driverLicense:       dto.driverLicense,
        purpose:             dto.purpose,
        inWeight:            dto.inWeight,
        materialDescription: dto.materialDescription,
        supplierName:        dto.supplierName,
        customerName:        dto.customerName,
        poNumber:            dto.poNumber,
        remarks:             dto.remarks,
        expectedExitTime:    dto.expectedExitTime ? new Date(dto.expectedExitTime) : undefined,
        entryById:           user.id,
        createdBy:           user.id,
        updatedBy:           user.id,
      },
      include: this.logIncludes(),
    });

    await this.audit.log({ tableName: 'vehicle_logs', recordId: log.id, action: 'CREATE', newValues: { logNumber, vehicleId: dto.vehicleId }, changedBy: user.id });
    return log;
  }

  async logExit(id: string, dto: LogVehicleExitDto, user: any) {
    const log = await this.prisma.vehicleLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Vehicle log not found');
    if (log.status !== VehicleLogStatus.INSIDE) throw new BadRequestException('Vehicle is not currently inside');

    const netWeight = dto.outWeight && log.inWeight
      ? Math.abs(log.inWeight - dto.outWeight)
      : null;

    const updated = await this.prisma.vehicleLog.update({
      where: { id },
      data: {
        status:    VehicleLogStatus.EXITED,
        exitTime:  new Date(),
        outWeight: dto.outWeight,
        netWeight,
        remarks:   dto.remarks || log.remarks,
        exitById:  user.id,
        updatedBy: user.id,
      },
      include: this.logIncludes(),
    });

    await this.audit.log({ tableName: 'vehicle_logs', recordId: id, action: 'UPDATE', oldValues: { status: 'INSIDE' }, newValues: { status: 'EXITED', exitTime: new Date() }, changedBy: user.id });
    return updated;
  }

  async findAllLogs(user: any, filters: { plantId?: string; status?: VehicleLogStatus; date?: string; purpose?: string }) {
    const where: any = { companyId: user.companyId };
    if (filters.plantId) where.plantId = filters.plantId;
    if (filters.status)  where.status  = filters.status;
    if (filters.purpose) where.purpose = filters.purpose;
    if (filters.date) {
      const d = new Date(filters.date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.entryTime = { gte: d, lt: next };
    }
    return this.prisma.vehicleLog.findMany({ where, include: this.logIncludes(), orderBy: { entryTime: 'desc' } });
  }

  async getActiveVehicles(user: any) {
    return this.prisma.vehicleLog.findMany({
      where: { companyId: user.companyId, status: VehicleLogStatus.INSIDE },
      include: this.logIncludes(),
      orderBy: { entryTime: 'asc' },
    });
  }

  async getStats(user: any) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const base = { companyId: user.companyId };

    const [totalVehicles, insideNow, todayIn, todayOut, totalLogs] = await Promise.all([
      this.prisma.vehicle.count({ where: base }),
      this.prisma.vehicleLog.count({ where: { ...base, status: 'INSIDE' } }),
      this.prisma.vehicleLog.count({ where: { ...base, entryTime: { gte: today, lt: tomorrow } } }),
      this.prisma.vehicleLog.count({ where: { ...base, status: 'EXITED', exitTime: { gte: today, lt: tomorrow } } }),
      this.prisma.vehicleLog.count({ where: base }),
    ]);

    return { totalVehicles, insideNow, todayIn, todayOut, totalLogs };
  }

  private logIncludes() {
    return {
      vehicle: { select: { id: true, vehicleNumber: true, vehicleType: true, ownerName: true } },
      plant:   { select: { id: true, name: true, code: true } },
      entryBy: { select: { id: true, firstName: true, lastName: true } },
      exitBy:  { select: { id: true, firstName: true, lastName: true } },
    };
  }
}
