import { DispatchTrackingService } from './dispatch-tracking.service';
import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTrackingUpdateDto } from './dto/dispatch-tracking.dto';

describe('DispatchTrackingService - DSP-015', () => {
  let service: DispatchTrackingService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function gateOutRow(overrides: any = {}) {
    return {
      id: 'go-1', gateOutNumber: 'GO-2026-0001', companyId: 'company-1', soId: 'so-1',
      customerName: 'ABC Corp', vehicleNumber: 'HR55AB1234', ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      dispatchGateOut: { findFirst: jest.fn().mockResolvedValue(gateOutRow()) },
      dispatchTrackingUpdate: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'dtu-1', ...data })),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'dtu-1', ...data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'dtu-1', gateOutId: 'go-1', companyId: 'company-1', status: 'IN_TRANSIT', location: 'Pune hub', notes: null, eventAt: new Date('2026-10-01T10:00:00Z') }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new DispatchTrackingService(prisma, audit);
  });

  describe('create', () => {
    it('creates a manual tracking update against the Gate-Out, stamping source=MANUAL and enteredBy=user.id', async () => {
      const result = await service.create({ gateOutId: 'go-1', status: 'IN_TRANSIT', location: 'Pune hub', notes: 'left origin warehouse' } as any, user);
      expect(prisma.dispatchTrackingUpdate.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1', gateOutId: 'go-1', status: 'IN_TRANSIT', location: 'Pune hub',
          source: 'MANUAL', enteredBy: 'user-1', createdBy: 'user-1', updatedBy: 'user-1',
        }),
      }));
      expect(result.id).toBe('dtu-1');
    });

    it('defaults eventAt to now when not supplied, but honours an explicit eventAt (e.g. a backdated manual entry)', async () => {
      await service.create({ gateOutId: 'go-1', status: 'DELAYED', eventAt: '2026-10-01T08:00:00.000Z' } as any, user);
      const callData = prisma.dispatchTrackingUpdate.create.mock.calls[0][0].data;
      expect(callData.eventAt).toEqual(new Date('2026-10-01T08:00:00.000Z'));
    });

    it('throws NotFoundException when the Gate-Out does not exist or belongs to another company', async () => {
      prisma.dispatchGateOut.findFirst.mockResolvedValue(null);
      await expect(service.create({ gateOutId: 'go-missing', status: 'IN_TRANSIT' } as any, user)).rejects.toThrow(NotFoundException);
      expect(prisma.dispatchTrackingUpdate.create).not.toHaveBeenCalled();
    });

    it('writes an audit log entry on create', async () => {
      await service.create({ gateOutId: 'go-1', status: 'IN_TRANSIT' } as any, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'dispatch_tracking_updates', action: 'CREATE', changedBy: 'user-1' }));
    });
  });

  describe('update', () => {
    it('edits an existing tracking update, preserving fields not supplied', async () => {
      const result = await service.update('dtu-1', { notes: 'corrected location spelling' } as any, user);
      expect(prisma.dispatchTrackingUpdate.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'dtu-1' },
        data: expect.objectContaining({ status: 'IN_TRANSIT', location: 'Pune hub', notes: 'corrected location spelling', updatedBy: 'user-1' }),
      }));
      expect(result.notes).toBe('corrected location spelling');
    });

    it('throws NotFoundException editing a tracking update outside the caller company', async () => {
      prisma.dispatchTrackingUpdate.findFirst.mockResolvedValue(null);
      await expect(service.update('dtu-x', { notes: 'x' } as any, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findTimeline', () => {
    it('returns the full history oldest-first with the latest entry surfaced as currentStatus', async () => {
      const t1 = { id: 'dtu-1', status: 'IN_TRANSIT', eventAt: new Date('2026-10-01T08:00:00Z'), createdAt: new Date('2026-10-01T08:00:00Z') };
      const t2 = { id: 'dtu-2', status: 'DELAYED', eventAt: new Date('2026-10-02T08:00:00Z'), createdAt: new Date('2026-10-02T08:00:00Z') };
      const t3 = { id: 'dtu-3', status: 'DELIVERED', eventAt: new Date('2026-10-03T08:00:00Z'), createdAt: new Date('2026-10-03T08:00:00Z') };
      prisma.dispatchTrackingUpdate.findMany.mockResolvedValue([t1, t2, t3]);

      const result = await service.findTimeline('go-1', user);
      expect(prisma.dispatchTrackingUpdate.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { gateOutId: 'go-1', companyId: 'company-1', isActive: true },
        orderBy: [{ eventAt: 'asc' }, { createdAt: 'asc' }],
      }));
      expect(result.timeline).toEqual([t1, t2, t3]);
      expect(result.currentStatus).toBe('DELIVERED');
      expect(result.gateOutNumber).toBe('GO-2026-0001');
    });

    it('a shipment that has gone IN_TRANSIT -> DELAYED -> IN_TRANSIT -> DELIVERED keeps every hop in the timeline, not just the latest', async () => {
      const hops = [
        { id: 'h1', status: 'IN_TRANSIT', eventAt: new Date('2026-10-01T08:00:00Z'), createdAt: new Date('2026-10-01T08:00:00Z') },
        { id: 'h2', status: 'DELAYED', eventAt: new Date('2026-10-02T08:00:00Z'), createdAt: new Date('2026-10-02T08:00:00Z') },
        { id: 'h3', status: 'IN_TRANSIT', eventAt: new Date('2026-10-03T08:00:00Z'), createdAt: new Date('2026-10-03T08:00:00Z') },
        { id: 'h4', status: 'DELIVERED', eventAt: new Date('2026-10-04T08:00:00Z'), createdAt: new Date('2026-10-04T08:00:00Z') },
      ];
      prisma.dispatchTrackingUpdate.findMany.mockResolvedValue(hops);
      const result = await service.findTimeline('go-1', user);
      expect(result.timeline).toHaveLength(4);
      expect(result.timeline.map((h: any) => h.status)).toEqual(['IN_TRANSIT', 'DELAYED', 'IN_TRANSIT', 'DELIVERED']);
      expect(result.currentStatus).toBe('DELIVERED');
    });

    it('returns currentStatus null for a Gate-Out with no tracking updates yet', async () => {
      prisma.dispatchTrackingUpdate.findMany.mockResolvedValue([]);
      const result = await service.findTimeline('go-1', user);
      expect(result.currentStatus).toBeNull();
      expect(result.timeline).toEqual([]);
    });

    it('throws NotFoundException for a Gate-Out outside the caller company', async () => {
      prisma.dispatchGateOut.findFirst.mockResolvedValue(null);
      await expect(service.findTimeline('go-1', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('CreateTrackingUpdateDto validation', () => {
    it('accepts the three documented statuses', async () => {
      for (const status of ['IN_TRANSIT', 'DELAYED', 'DELIVERED']) {
        const dto = plainToInstance(CreateTrackingUpdateDto, { gateOutId: 'go-1', status });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('rejects a status outside the enum (no free-text status values)', async () => {
      const dto = plainToInstance(CreateTrackingUpdateDto, { gateOutId: 'go-1', status: 'LOST_IN_TRANSIT' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });

    it('rejects a missing gateOutId', async () => {
      const dto = plainToInstance(CreateTrackingUpdateDto, { status: 'IN_TRANSIT' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'gateOutId')).toBe(true);
    });
  });

  describe('RBAC gating (controller route guards)', () => {
    it('the controller enforces JwtAuthGuard and PermissionsGuard on every route', () => {
      const controllerSource = require('fs').readFileSync(require.resolve('./dispatch-tracking.controller.ts'), 'utf8');
      expect(controllerSource).toContain('@UseGuards(JwtAuthGuard, PermissionsGuard)');
    });

    it('create requires DISPATCH_TRACKING_CREATE', () => {
      const controllerSource = require('fs').readFileSync(require.resolve('./dispatch-tracking.controller.ts'), 'utf8');
      const idx = controllerSource.indexOf('@Post()');
      expect(idx).toBeGreaterThan(-1);
      expect(controllerSource.slice(idx, idx + 150)).toContain('@RequirePermissions(Permission.DISPATCH_TRACKING_CREATE)');
    });

    it('edit requires DISPATCH_TRACKING_EDIT, distinct from create', () => {
      const controllerSource = require('fs').readFileSync(require.resolve('./dispatch-tracking.controller.ts'), 'utf8');
      const idx = controllerSource.indexOf("@Patch(':id')");
      expect(idx).toBeGreaterThan(-1);
      expect(controllerSource.slice(idx, idx + 150)).toContain('@RequirePermissions(Permission.DISPATCH_TRACKING_EDIT)');
    });

    it('viewing the timeline requires DISPATCH_TRACKING_VIEW only, not the create/edit permissions', () => {
      const controllerSource = require('fs').readFileSync(require.resolve('./dispatch-tracking.controller.ts'), 'utf8');
      const idx = controllerSource.indexOf("@Get('gate-out/:gateOutId')");
      expect(idx).toBeGreaterThan(-1);
      expect(controllerSource.slice(idx, idx + 150)).toContain('@RequirePermissions(Permission.DISPATCH_TRACKING_VIEW)');
    });
  });
});
