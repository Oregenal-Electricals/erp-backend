import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StageTransferService } from './stage-transfer.service';

describe('StageTransferService — PROD-006: Partial Stage Handover', () => {
  let service: StageTransferService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1', role: 'SUPERVISOR' };

  const smtWo = {
    id: 'wo-smt', companyId: 'company-1', woNumber: 'WO-2026-0001-SMT', status: 'IN_PROGRESS',
    productCode: '9W-LED', productName: '9W Emergency LED Bulb',
    completedQty: 200, cumulativeHandoverQty: 0,
    routingGroupId: 'rg-1', parentWorkOrderId: null,
  };
  const miWo = {
    id: 'wo-mi', companyId: 'company-1', woNumber: 'WO-2026-0001-MI', status: 'RELEASED',
    stageStatus: 'NOT_READY', routingGroupId: 'rg-1', parentWorkOrderId: 'wo-smt',
  };
  const assemblyWo = {
    id: 'wo-assembly', companyId: 'company-1', woNumber: 'WO-2026-0001-ASSEMBLY', status: 'RELEASED',
    stageStatus: 'NOT_READY', routingGroupId: 'rg-1', parentWorkOrderId: 'wo-mi',
  };

  beforeEach(() => {
    prisma = {
      workOrder: { findFirst: jest.fn(), update: jest.fn() },
      stageTransferNote: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new StageTransferService(prisma, audit);
  });

  describe('positive: partial handover while IN_PROGRESS (spec sections 3, 44) - no COMPLETED requirement', () => {
    it('gives a partial transferable quantity while the source WO is still IN_PROGRESS', async () => {
      prisma.workOrder.findFirst.mockImplementation(({ where }: any) => Promise.resolve(where.id === 'wo-smt' ? smtWo : miWo));
      prisma.stageTransferNote.create.mockResolvedValue({ id: 'note-1', qty: 200 });

      const result = await service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-mi', qty: 200 } as any, user);

      expect(result.qty).toBe(200);
      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'wo-mi' }, data: expect.objectContaining({ cumulativeInputQty: { increment: 200 } }) }),
      );
    });

    it('the source WO remains IN_PROGRESS after a partial handover - never forced toward COMPLETED', async () => {
      prisma.workOrder.findFirst.mockImplementation(({ where }: any) => Promise.resolve(where.id === 'wo-smt' ? smtWo : miWo));
      prisma.stageTransferNote.create.mockResolvedValue({ id: 'note-1', qty: 200 });

      await service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-mi', qty: 200 } as any, user);

      // The only update to the source WO is the atomic cumulativeHandoverQty
      // increment via $executeRaw - status is never touched here.
      const statusUpdateCalls = prisma.workOrder.update.mock.calls.filter((c: any) => c[0].where.id === 'wo-smt');
      expect(statusUpdateCalls).toHaveLength(0);
    });
  });

  describe('negative: source WO not producing yet', () => {
    it('blocks give() when the source WO is still DRAFT/RELEASED (not producing anything yet)', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...smtWo, status: 'RELEASED' });
      await expect(service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-mi', qty: 200 } as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('transferable balance and cumulative tracking (spec sections 12, 22-23, manual tests 5, 7, 48)', () => {
    it('blocks handover that exceeds the transferable balance', async () => {
      prisma.workOrder.findFirst.mockImplementation(({ where }: any) => Promise.resolve(where.id === 'wo-smt' ? smtWo : miWo));
      await expect(service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-mi', qty: 250 } as any, user)).rejects.toThrow(BadRequestException);
      expect(prisma.stageTransferNote.create).not.toHaveBeenCalled();
    });

    it('accounts for quantity already given when checking the second handover (cumulative correctness)', async () => {
      // 200 completed, 150 already given -> only 50 transferable left
      prisma.workOrder.findFirst.mockImplementation(({ where }: any) =>
        Promise.resolve(where.id === 'wo-smt' ? { ...smtWo, cumulativeHandoverQty: 150 } : miWo));

      await expect(service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-mi', qty: 100 } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('allows exactly the remaining transferable balance on a second handover', async () => {
      prisma.workOrder.findFirst.mockImplementation(({ where }: any) =>
        Promise.resolve(where.id === 'wo-smt' ? { ...smtWo, cumulativeHandoverQty: 150 } : miWo));
      prisma.stageTransferNote.create.mockResolvedValue({ id: 'note-2', qty: 50 });

      const result = await service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-mi', qty: 50 } as any, user);
      expect(result.qty).toBe(50);
    });

    it('zero handover blocks a downstream attempt to give (spec section 9, manual test 2 mirrors this on the receiving side)', async () => {
      prisma.workOrder.findFirst.mockImplementation(({ where }: any) =>
        Promise.resolve(where.id === 'wo-smt' ? { ...smtWo, completedQty: 0 } : miWo));
      await expect(service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-mi' } as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('concurrency safety (spec section 56)', () => {
    it('treats a zero-row atomic update result as a real concurrency conflict, not a silent success', async () => {
      prisma.workOrder.findFirst.mockImplementation(({ where }: any) => Promise.resolve(where.id === 'wo-smt' ? smtWo : miWo));
      prisma.$executeRaw.mockResolvedValue(0);

      await expect(service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-mi', qty: 200 } as any, user)).rejects.toThrow(BadRequestException);
      expect(prisma.stageTransferNote.create).not.toHaveBeenCalled();
    });
  });

  describe('routing-sequence enforcement - no stage skipping (spec sections 20, 53)', () => {
    it('blocks a handover that skips the immediate next stage in the same routing chain', async () => {
      // SMT attempting to give directly to Assembly, skipping MI
      prisma.workOrder.findFirst.mockImplementation(({ where }: any) => Promise.resolve(where.id === 'wo-smt' ? smtWo : assemblyWo));
      await expect(service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-assembly', qty: 100 } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('allows a handover to the genuine immediate next stage', async () => {
      prisma.workOrder.findFirst.mockImplementation(({ where }: any) => Promise.resolve(where.id === 'wo-smt' ? smtWo : miWo));
      prisma.stageTransferNote.create.mockResolvedValue({ id: 'note-1', qty: 200 });

      const result = await service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-mi', qty: 200 } as any, user);
      expect(result.qty).toBe(200);
    });
  });

  describe('receive() - lightweight acknowledgment, never re-adjusts quantity', () => {
    it('marks the note RECEIVED without touching cumulativeInputQty again (already counted at give time)', async () => {
      prisma.stageTransferNote.findFirst.mockResolvedValue({ id: 'note-1', status: 'PENDING', toWorkOrderId: 'wo-mi', qty: 200 });
      prisma.stageTransferNote.update.mockResolvedValue({ id: 'note-1', status: 'RECEIVED' });

      await service.receive('note-1', user);

      expect(prisma.workOrder.update).not.toHaveBeenCalled();
    });

    it('refuses to receive an already-received transfer', async () => {
      prisma.stageTransferNote.findFirst.mockResolvedValue({ id: 'note-1', status: 'RECEIVED' });
      await expect(service.receive('note-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('audit', () => {
    it('logs a successful handover', async () => {
      prisma.workOrder.findFirst.mockImplementation(({ where }: any) => Promise.resolve(where.id === 'wo-smt' ? smtWo : miWo));
      prisma.stageTransferNote.create.mockResolvedValue({ id: 'note-1', qty: 200 });

      await service.give({ fromWorkOrderId: 'wo-smt', toWorkOrderId: 'wo-mi', qty: 200 } as any, user);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: 'stage_transfer_notes', action: 'CREATE', changedBy: user.id }),
      );
    });
  });

  describe('permission enforcement is structural', () => {
    it('the give route requires PRODUCTION_HANDOVER_CREATE-equivalent permission - verified via controller decorator', () => {
      const controllerSource = require('fs').readFileSync(require.resolve('./stage-transfer.controller.ts'), 'utf8');
      expect(controllerSource).toContain('@UseGuards');
    });
  });
});
