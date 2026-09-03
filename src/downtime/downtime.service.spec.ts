import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DowntimeService } from './downtime.service';

describe('DowntimeService — PROD-011: Production Pause/Downtime and Resume', () => {
  let service: DowntimeService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const activeWo = { id: 'wo-assembly', companyId: 'company-1', woNumber: 'WO-2026-0001-ASSEMBLY', status: 'IN_PROGRESS' };

  beforeEach(() => {
    prisma = {
      workOrder: { findFirst: jest.fn().mockResolvedValue(activeWo), update: jest.fn() },
      downtime: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn(), update: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      manpowerAllocation: { aggregate: jest.fn().mockResolvedValue({ _sum: { count: 20 } }) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new DowntimeService(prisma, audit);
  });

  describe('positive: normal pause and resume (manual tests 1-2, spec sections 3, 6-7)', () => {
    it('pauses an IN_PROGRESS WO, creating an OPEN downtime and setting stageStatus to PAUSED', async () => {
      prisma.downtime.create.mockResolvedValue({ id: 'dt-1', status: 'OPEN', startTime: new Date('2026-05-10T10:20:00') });

      const result = await service.pause({ workOrderId: 'wo-assembly', reason: 'Machine Breakdown', category: 'MACHINE', startTime: '2026-05-10T10:20:00' } as any, user);

      expect(result.status).toBe('OPEN');
      const woUpdateCall = prisma.workOrder.update.mock.calls[0][0];
      expect(woUpdateCall.data.stageStatus).toBe('PAUSED');
    });

    it('resume computes exact duration from timestamps, not a typed number', async () => {
      const openDowntime = { id: 'dt-1', status: 'OPEN', startTime: new Date('2026-05-10T10:20:00'), workOrderId: 'wo-assembly' };
      prisma.downtime.findFirst.mockResolvedValue(openDowntime);
      prisma.downtime.update.mockResolvedValue({ ...openDowntime, status: 'CLOSED', endTime: new Date('2026-05-10T10:50:00') });

      await service.resume('dt-1', { endTime: '2026-05-10T10:50:00' } as any, user);

      const auditCall = audit.log.mock.calls[0][0];
      expect(auditCall.newValues.durationMinutes).toBe(30);
    });

    it('resume sets stageStatus back to IN_PRODUCTION', async () => {
      const openDowntime = { id: 'dt-1', status: 'OPEN', startTime: new Date('2026-05-10T10:20:00'), workOrderId: 'wo-assembly' };
      prisma.downtime.findFirst.mockResolvedValue(openDowntime);
      prisma.downtime.update.mockResolvedValue({ ...openDowntime, status: 'CLOSED' });

      await service.resume('dt-1', { endTime: '2026-05-10T10:50:00' } as any, user);

      const woUpdateCall = prisma.workOrder.update.mock.calls[0][0];
      expect(woUpdateCall.data.stageStatus).toBe('IN_PRODUCTION');
    });
  });

  describe('pause is not completion (spec section 4)', () => {
    it('pause never touches WorkOrder.status - only stageStatus', async () => {
      prisma.downtime.create.mockResolvedValue({ id: 'dt-1', status: 'OPEN' });
      await service.pause({ workOrderId: 'wo-assembly', reason: 'Machine Breakdown' } as any, user);

      const woUpdateCall = prisma.workOrder.update.mock.calls[0][0];
      expect(woUpdateCall.data.status).toBeUndefined();
    });
  });

  describe('duplicate/overlapping pause control (manual test 10, spec section 24)', () => {
    it('blocks a second pause while one is already open', async () => {
      prisma.downtime.findFirst.mockResolvedValue({ id: 'dt-existing', status: 'OPEN', startTime: new Date('2026-05-10T10:20:00') });

      await expect(
        service.pause({ workOrderId: 'wo-assembly', reason: 'Material Shortage' } as any, user),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.downtime.create).not.toHaveBeenCalled();
    });
  });

  describe('resume without pause (manual test 11, spec section 25)', () => {
    it('blocks resume when no downtime record exists', async () => {
      prisma.downtime.findFirst.mockResolvedValue(null);
      await expect(service.resume('dt-nonexistent', {} as any, user)).rejects.toThrow(NotFoundException);
    });

    it('blocks resume when the downtime is already CLOSED', async () => {
      prisma.downtime.findFirst.mockResolvedValue({ id: 'dt-1', status: 'CLOSED' });
      await expect(service.resume('dt-1', {} as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('invalid resume time (manual test 12, spec section 26)', () => {
    it('blocks a resume time before the pause time', async () => {
      prisma.downtime.findFirst.mockResolvedValue({ id: 'dt-1', status: 'OPEN', startTime: new Date('2026-05-10T10:20:00'), workOrderId: 'wo-assembly' });

      await expect(
        service.resume('dt-1', { endTime: '2026-05-10T10:10:00' } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('zero-manpower resume blocked (manual test 14, spec sections 34, 44)', () => {
    it('blocks resume when no active manpower is allocated', async () => {
      prisma.downtime.findFirst.mockResolvedValue({ id: 'dt-1', status: 'OPEN', startTime: new Date('2026-05-10T10:20:00'), workOrderId: 'wo-assembly' });
      prisma.manpowerAllocation.aggregate.mockResolvedValue({ _sum: { count: 0 } });

      await expect(
        service.resume('dt-1', { endTime: '2026-05-10T10:50:00' } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('WO not currently in production (spec section 22)', () => {
    it('blocks pause when the WO is not IN_PROGRESS', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...activeWo, status: 'RELEASED' });
      await expect(service.pause({ workOrderId: 'wo-assembly', reason: 'Machine Breakdown' } as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('cumulative downtime across multiple records (manual test 16, spec section 46)', () => {
    it('sums separate closed downtime records without double counting', async () => {
      prisma.downtime.findMany.mockResolvedValue([
        { startTime: new Date('2026-05-10T09:15:00'), endTime: new Date('2026-05-10T09:30:00') }, // 15 min
        { startTime: new Date('2026-05-10T11:20:00'), endTime: new Date('2026-05-10T11:50:00') }, // 30 min
        { startTime: new Date('2026-05-10T14:00:00'), endTime: new Date('2026-05-10T14:10:00') }, // 10 min
      ]);

      const result = await service.getCumulativeDowntime('wo-assembly', user);
      expect(result.totalMinutes).toBe(55);
      expect(result.downtimeCount).toBe(3);
    });
  });

  describe('audit', () => {
    it('logs a pause event', async () => {
      prisma.downtime.create.mockResolvedValue({ id: 'dt-1', status: 'OPEN' });
      await service.pause({ workOrderId: 'wo-assembly', reason: 'Machine Breakdown' } as any, user);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: 'downtimes', action: 'CREATE', changedBy: user.id }),
      );
    });
  });
});
