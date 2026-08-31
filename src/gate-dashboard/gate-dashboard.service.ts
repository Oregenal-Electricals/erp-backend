import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GateDashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(user: any) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const base = { companyId: user.companyId };

    // ── Live counts ───────────────────────────────────────────────
    const [
      visitorsInside, vehiclesInside,
      todayVisitors, todayVehicles,
      pendingGINs, pendingGOEs, pendingPasses, issuedPasses,
      yesterdayVisitors, yesterdayVehicles,
      returnableOverdue,
    ] = await Promise.all([
      this.prisma.visitorLog.count({ where: { ...base, status: 'CHECKED_IN' } }),
      this.prisma.vehicleLog.count({ where: { ...base, status: 'INSIDE' } }),
      this.prisma.visitorLog.count({ where: { ...base, checkInTime: { gte: today, lt: tomorrow } } }),
      this.prisma.vehicleLog.count({ where: { ...base, entryTime: { gte: today, lt: tomorrow } } }),
      this.prisma.gateInwardEntry.count({ where: { ...base, status: 'PENDING' } }),
      this.prisma.gateOutwardEntry.count({ where: { ...base, status: 'PENDING' } }),
      this.prisma.gatePass.count({ where: { ...base, status: 'PENDING' } }),
      this.prisma.gatePass.count({ where: { ...base, status: 'ISSUED' } }),
      this.prisma.visitorLog.count({ where: { ...base, checkInTime: { gte: yesterday, lt: today } } }),
      this.prisma.vehicleLog.count({ where: { ...base, entryTime: { gte: yesterday, lt: today } } }),
      this.prisma.gatePass.count({ where: { ...base, status: 'ISSUED', type: 'RETURNABLE', validTo: { lt: new Date() } } }),
    ]);

    // ── Active visitors ───────────────────────────────────────────
    const activeVisitors = await this.prisma.visitorLog.findMany({
      where: { ...base, status: 'CHECKED_IN' },
      include: {
        visitor: { select: { firstName: true, lastName: true, mobile: true, visitorCompany: true } },
        plant:   { select: { name: true } },
        hostEmployee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { checkInTime: 'asc' },
      take: 10,
    });

    // ── Active vehicles ───────────────────────────────────────────
    const activeVehicles = await this.prisma.vehicleLog.findMany({
      where: { ...base, status: 'INSIDE' },
      include: {
        vehicle: { select: { vehicleNumber: true, vehicleType: true } },
        plant:   { select: { name: true } },
      },
      orderBy: { entryTime: 'asc' },
      take: 10,
    });

    // ── Pending GINs ──────────────────────────────────────────────
    const pendingGINList = await this.prisma.gateInwardEntry.findMany({
      where: { ...base, status: 'PENDING' },
      include: { plant: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });

    // ── Pending GOEs ──────────────────────────────────────────────
    const pendingGOEList = await this.prisma.gateOutwardEntry.findMany({
      where: { ...base, status: 'PENDING' },
      include: { plant: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });

    // ── Pending passes ────────────────────────────────────────────
    const pendingPassList = await this.prisma.gatePass.findMany({
      where: { ...base, status: { in: ['PENDING', 'APPROVED'] } },
      include: {
        plant:       { select: { name: true } },
        requestedBy: { select: { firstName: true, lastName: true } },
        employee:    { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });

    // ── Recent activity (last 20 events) ─────────────────────────
    const [recentVisitorLogs, recentVehicleLogs, recentGINs, recentGOEs, recentPasses] = await Promise.all([
      this.prisma.visitorLog.findMany({
        where: { ...base, checkInTime: { gte: today } },
        include: { visitor: { select: { firstName: true, lastName: true } } },
        orderBy: { checkInTime: 'desc' }, take: 5,
      }),
      this.prisma.vehicleLog.findMany({
        where: { ...base, entryTime: { gte: today } },
        include: { vehicle: { select: { vehicleNumber: true } } },
        orderBy: { entryTime: 'desc' }, take: 5,
      }),
      this.prisma.gateInwardEntry.findMany({
        where: { ...base, createdAt: { gte: today } },
        orderBy: { createdAt: 'desc' }, take: 3,
      }),
      this.prisma.gateOutwardEntry.findMany({
        where: { ...base, createdAt: { gte: today } },
        orderBy: { createdAt: 'desc' }, take: 3,
      }),
      this.prisma.gatePass.findMany({
        where: { ...base, createdAt: { gte: today } },
        orderBy: { createdAt: 'desc' }, take: 3,
      }),
    ]);

    // Build timeline
    const timeline = [
      ...recentVisitorLogs.map(l => ({
        type: 'VISITOR', time: l.checkInTime,
        title: `${l.visitor.firstName} ${l.visitor.lastName} checked in`,
        badge: l.status === 'CHECKED_IN' ? 'IN' : 'OUT', color: 'blue',
      })),
      ...recentVehicleLogs.map(l => ({
        type: 'VEHICLE', time: l.entryTime,
        title: `${l.vehicle.vehicleNumber} entered`,
        badge: l.status, color: 'green',
      })),
      ...recentGINs.map(l => ({
        type: 'GIN', time: l.createdAt,
        title: `GIN ${l.ginNumber} — ${l.supplierName}`,
        badge: l.status, color: 'purple',
      })),
      ...recentGOEs.map(l => ({
        type: 'GOE', time: l.createdAt,
        title: `GOE ${l.goeNumber} — ${l.customerName}`,
        badge: l.status, color: 'orange',
      })),
      ...recentPasses.map(l => ({
        type: 'PASS', time: l.createdAt,
        title: `Pass ${l.passNumber} — ${l.carrierName}`,
        badge: l.status, color: 'teal',
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20);

    // ── Phase 1 additions: people/manpower + dispatch counts ──────
    const [peopleInside, contractLabourInside, todayDispatches] = await Promise.all([
      this.prisma.attendance.count({ where: { ...base, attendanceDate: { gte: today, lt: tomorrow }, status: { in: ['PRESENT', 'HALF_DAY'] } } }),
      this.prisma.attendance.count({
        where: { ...base, attendanceDate: { gte: today, lt: tomorrow }, status: { in: ['PRESENT', 'HALF_DAY'] }, employee: { employmentType: 'CONTRACT' } },
      }),
      this.prisma.gateOutwardEntry.count({ where: { ...base, status: 'DISPATCHED', dispatchedAt: { gte: today, lt: tomorrow } } }),
    ]);
    // Visitor Vehicles Outside: vehicles that came in for a visitor
    // (VehicleLog.purpose = VISITOR, wired via Visitor Check-in) and
    // have since exited today - a real count now that Visitor
    // Check-in/Check-out link and close their own VehicleLog record.
    const visitorVehiclesOutside = await this.prisma.vehicleLog.count({
      where: { ...base, purpose: 'VISITOR', status: 'EXITED', exitTime: { gte: today, lt: tomorrow } },
    });
    // Waiting Vehicles (queued outside, not yet let in) still depends
    // on the Parking/queue workflow, which isn't built yet - genuinely
    // no backing data source exists for this one, so it stays a
    // placeholder rather than a wrong number.
    const waitingVehicles = 0;

    return {
      liveStats: {
        visitorsInside, vehiclesInside,
        todayVisitors, todayVehicles,
        pendingGINs, pendingGOEs,
        pendingPasses, issuedPasses,
        yesterdayVisitors, yesterdayVehicles,
        returnableOverdue,
        peopleInside, contractLabourInside, todayDispatches,
        visitorVehiclesOutside, waitingVehicles,
        pendingApprovals: pendingGINs + pendingGOEs + pendingPasses,
      },
      activeVisitors,
      activeVehicles,
      pendingGINList,
      pendingGOEList,
      pendingPassList,
      timeline,
    };
  }
}
