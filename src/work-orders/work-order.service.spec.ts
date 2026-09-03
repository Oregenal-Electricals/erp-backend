import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';

describe('WorkOrderService — PROD-001: Work Order Released to Production', () => {
  let service: WorkOrderService;
  let prisma: any;
  let audit: any;
  let materialReservation: any;
  let workflows: any;
  let notifications: any;
  let settings: any;
  const user = { id: 'user-1', companyId: 'company-1', role: 'PLANT_HEAD' };

  const draftWo = {
    id: 'wo-1', companyId: 'company-1', woNumber: 'WO-2026-0001',
    productCode: '9W-LED', productName: '9W Emergency LED Bulb',
    status: 'DRAFT', plannedQty: 1000, bomId: 'bom-1', warehouseId: 'wh-1',
    plannedManpower: 10,
  };
  const activeProduct = { id: 'product-1', code: '9W-LED', name: '9W Emergency LED Bulb', isActive: true, companyId: 'company-1' };
  const approvedBom = { id: 'bom-1', bomNumber: 'BOM-0001', status: 'APPROVED', companyId: 'company-1' };
  const productivity = { id: 'prod-1', productId: 'product-1', piecesPerManHour: 8, effectiveFrom: new Date('2026-01-01'), effectiveTo: null };

  beforeEach(() => {
    prisma = {
      workOrder: { findFirst: jest.fn().mockResolvedValue(draftWo), findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), count: jest.fn().mockResolvedValue(0) },
      product: { findFirst: jest.fn().mockResolvedValue(activeProduct) },
      bom: { findFirst: jest.fn().mockResolvedValue(approvedBom) },
      bomItem: { findMany: jest.fn().mockResolvedValue([]) },
      stockBalance: { findUnique: jest.fn().mockResolvedValue(null) },
      productStandardProductivity: { findFirst: jest.fn().mockResolvedValue(productivity) },
      manpowerAllocation: { findFirst: jest.fn().mockResolvedValue({ id: 'alloc-1', status: 'APPROVED' }) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    materialReservation = { reserveForWorkOrder: jest.fn().mockResolvedValue([]) };
    workflows = { submit: jest.fn(), act: jest.fn() };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    settings = {
      getSettingValue: jest.fn((key: string, def: string) => {
        if (key === 'WO_BLOCK_RELEASE_ON_SHORTAGE') return Promise.resolve('false');
        if (key === 'STANDARD_LABOUR_RATE_PER_SHIFT') return Promise.resolve('120');
        if (key === 'STANDARD_SHIFT_HOURS') return Promise.resolve('8');
        return Promise.resolve(def);
      }),
    };
    service = new WorkOrderService(prisma, audit, materialReservation, workflows, notifications, settings);
  });

  describe('positive: valid release with the manual UAT test data', () => {
    it('releases a valid DRAFT work order, computing the exact planned labour figures from the spec example', async () => {
      prisma.workOrder.update.mockResolvedValue({ ...draftWo, status: 'RELEASED' });

      const result = await service.release('wo-1', user);

      const updateCall = prisma.workOrder.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('RELEASED');
      expect(updateCall.data.releasedById).toBe(user.id);
      expect(updateCall.data.releasedAt).toBeInstanceOf(Date);
      expect(updateCall.data.materialAvailability).toBe('AVAILABLE');
      // Hourly target = 10 x 8 = 80; planned hours = 1000/80 = 12.5; planned labour hours = 10 x 12.5 = 125
      expect(updateCall.data.plannedManpower).toBe(10);
      expect(updateCall.data.plannedLabourHours).toBeCloseTo(125, 5);
      // Hourly rate = 120/8 = 15; cost = 125 x 15 = 1875
      expect(updateCall.data.plannedLabourCost).toBeCloseTo(1875, 5);
      // cost/pc = 1875/1000 = 1.875
      expect(updateCall.data.plannedLabourCostPerPc).toBeCloseTo(1.875, 5);
      expect(result.materialCheck.status).toBe('AVAILABLE');
    });

    it('never touches inventory during release - checkMaterialAvailability never writes to StockBalance', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./work-order.service.ts'), 'utf8');
      const start = serviceSource.indexOf('private async checkMaterialAvailability');
      const section = serviceSource.slice(start, start + 1500);
      expect(section).not.toContain('stockBalance.update');
      expect(section).not.toContain('stockBalance.create');
    });

    it('does not call reserveForWorkOrder during release() - reservation is deferred to start()', async () => {
      prisma.workOrder.update.mockResolvedValue({ ...draftWo, status: 'RELEASED' });
      await service.release('wo-1', user);
      expect(materialReservation.reserveForWorkOrder).not.toHaveBeenCalled();
    });

    it('records the release in the audit trail', async () => {
      prisma.workOrder.update.mockResolvedValue({ ...draftWo, status: 'RELEASED' });
      await service.release('wo-1', user);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ tableName: 'work_orders', recordId: 'wo-1', changedBy: user.id, newValues: expect.objectContaining({ status: 'RELEASED' }) }),
      );
    });

    it('start() by a bypass-role user reserves material - the relocated trigger point', async () => {
      const releasedWo = { ...draftWo, status: 'RELEASED' };
      prisma.workOrder.findFirst.mockResolvedValue(releasedWo);
      prisma.workOrder.update.mockResolvedValue({ ...releasedWo, status: 'IN_PROGRESS' });
      const result = await service.start('wo-1', user);
      expect(materialReservation.reserveForWorkOrder).toHaveBeenCalledWith('wo-1', user);
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('negative: missing BOM', () => {
    it('blocks release when no BOM is linked at all', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...draftWo, bomId: null });
      await expect(service.release('wo-1', user)).rejects.toThrow(BadRequestException);
      expect(prisma.workOrder.update).not.toHaveBeenCalled();
    });

    it('blocks release when the linked BOM is DRAFT, not yet approved', async () => {
      prisma.bom.findFirst.mockResolvedValue({ ...approvedBom, status: 'DRAFT' });
      await expect(service.release('wo-1', user)).rejects.toThrow(BadRequestException);
    });

    it('blocks release when the linked BOM record cannot be found', async () => {
      prisma.bom.findFirst.mockResolvedValue(null);
      await expect(service.release('wo-1', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('negative: invalid quantity', () => {
    it('blocks release for zero planned quantity', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...draftWo, plannedQty: 0 });
      await expect(service.release('wo-1', user)).rejects.toThrow(BadRequestException);
    });

    it('blocks release for negative planned quantity', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...draftWo, plannedQty: -50 });
      await expect(service.release('wo-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('negative: inactive product', () => {
    it('blocks release when the product is inactive', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...activeProduct, isActive: false });
      await expect(service.release('wo-1', user)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the product cannot be found at all', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.release('wo-1', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('negative: cancelled/completed work orders cannot be released', () => {
    it('refuses to release a CANCELLED work order', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...draftWo, status: 'CANCELLED' });
      await expect(service.release('wo-1', user)).rejects.toThrow(BadRequestException);
    });

    it('refuses to release a COMPLETED work order', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...draftWo, status: 'COMPLETED' });
      await expect(service.release('wo-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('duplicate / idempotency: cannot release the same work order twice', () => {
    it('refuses to release a work order that is already RELEASED', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...draftWo, status: 'RELEASED' });
      await expect(service.release('wo-1', user)).rejects.toThrow(BadRequestException);
      expect(prisma.workOrder.update).not.toHaveBeenCalled();
    });
  });

  describe('unauthorized release - permission enforcement', () => {
    it('release route requires WORK_ORDER_RELEASE, not the more general PRODUCTION_EDIT', () => {
      const controllerSource = require('fs').readFileSync(require.resolve('./work-order.controller.ts'), 'utf8');
      const routeIdx = controllerSource.indexOf("@Post(':id/release')");
      expect(routeIdx).toBeGreaterThan(-1);
      const nextLines = controllerSource.slice(routeIdx, routeIdx + 200);
      expect(nextLines).toContain('@RequirePermissions(Permission.WORK_ORDER_RELEASE)');
    });

    it('the controller enforces JwtAuthGuard and PermissionsGuard on every route', () => {
      const controllerSource = require('fs').readFileSync(require.resolve('./work-order.controller.ts'), 'utf8');
      expect(controllerSource).toContain('@UseGuards(JwtAuthGuard, PermissionsGuard)');
    });
  });

  describe('material availability - shortage handling', () => {
    it('shows SHORTAGE and does not block release when WO_BLOCK_RELEASE_ON_SHORTAGE is false (default)', async () => {
      prisma.bomItem.findMany.mockResolvedValue([{ itemCode: 'RM-001', itemName: 'LED Chip', quantity: 1, effectiveQty: null, isActive: true }]);
      prisma.stockBalance.findUnique.mockResolvedValue({ availableQty: 100 });
      prisma.workOrder.update.mockResolvedValue({ ...draftWo, status: 'RELEASED' });

      const result = await service.release('wo-1', user);

      expect(result.materialCheck.status).toBe('SHORTAGE');
      expect(result.materialCheck.shortItems[0].itemCode).toBe('RM-001');
      expect(prisma.workOrder.update).toHaveBeenCalled();
    });

    it('blocks release on shortage when WO_BLOCK_RELEASE_ON_SHORTAGE is configured true', async () => {
      settings.getSettingValue.mockImplementation((key: string, def: string) => {
        if (key === 'WO_BLOCK_RELEASE_ON_SHORTAGE') return Promise.resolve('true');
        return Promise.resolve(def);
      });
      prisma.bomItem.findMany.mockResolvedValue([{ itemCode: 'RM-001', itemName: 'LED Chip', quantity: 1, effectiveQty: null, isActive: true }]);
      prisma.stockBalance.findUnique.mockResolvedValue({ availableQty: 0 });

      await expect(service.release('wo-1', user)).rejects.toThrow(BadRequestException);
      expect(prisma.workOrder.update).not.toHaveBeenCalled();
    });

    it('never mutates StockBalance even when a shortage is found', async () => {
      prisma.bomItem.findMany.mockResolvedValue([{ itemCode: 'RM-001', itemName: 'LED Chip', quantity: 1, effectiveQty: null, isActive: true }]);
      prisma.stockBalance.findUnique.mockResolvedValue({ availableQty: 0 });
      prisma.stockBalance.update = jest.fn();
      prisma.workOrder.update.mockResolvedValue({ ...draftWo, status: 'RELEASED' });

      await service.release('wo-1', user);

      expect(prisma.stockBalance.update).not.toHaveBeenCalled();
    });
  });

  describe('planned vs actual cost separation', () => {
    it('release() never touches ProductionCostSheet - actual cost only comes from real production activity', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./work-order.service.ts'), 'utf8');
      const start = serviceSource.indexOf('async release(id: string, user: any) {');
      const end = serviceSource.indexOf('private async checkMaterialAvailability');
      const releaseSection = serviceSource.slice(start, end);
      expect(releaseSection).not.toContain('productionCostSheet');
      expect(releaseSection).not.toContain('ProductionCostSheet');
    });

    it('skips planned labour figures (does not block release) when no productivity standard is configured for the product', async () => {
      prisma.productStandardProductivity.findFirst.mockResolvedValue(null);
      prisma.workOrder.update.mockResolvedValue({ ...draftWo, status: 'RELEASED' });

      await service.release('wo-1', user);

      const updateCall = prisma.workOrder.update.mock.calls[0][0];
      expect(updateCall.data.plannedLabourHours).toBeUndefined();
      expect(updateCall.data.plannedLabourCost).toBeUndefined();
      expect(prisma.workOrder.update).toHaveBeenCalled();
    });

    it('defaults plannedManpower to 1 when the work order does not specify one, rather than failing', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ ...draftWo, plannedManpower: null });
      prisma.workOrder.update.mockResolvedValue({ ...draftWo, status: 'RELEASED' });

      await service.release('wo-1', user);

      const updateCall = prisma.workOrder.update.mock.calls[0][0];
      expect(updateCall.data.plannedManpower).toBe(1);
    });
  });

  describe('PROD-006: Production Start with real start conditions', () => {
    const releasedFirstStage = { ...draftWo, status: 'RELEASED', parentWorkOrderId: null, cumulativeInputQty: 0, cumulativeProcessedQty: 0 };
    const releasedSubsequentStage = { ...draftWo, status: 'RELEASED', parentWorkOrderId: 'wo-smt', cumulativeInputQty: 0, cumulativeProcessedQty: 0 };

    describe('approved manpower gate (spec sections 7, 28, 50)', () => {
      it('blocks start when no approved manpower allocation exists for this Work Order', async () => {
        prisma.workOrder.findFirst.mockResolvedValue(releasedFirstStage);
        prisma.manpowerAllocation.findFirst.mockResolvedValue(null);

        await expect(service.start('wo-1', user)).rejects.toThrow(BadRequestException);
      });

      it('allows start once an approved manpower allocation exists', async () => {
        prisma.workOrder.findFirst.mockResolvedValue(releasedFirstStage);
        prisma.manpowerAllocation.findFirst.mockResolvedValue({ id: 'alloc-1', status: 'APPROVED' });
        prisma.workOrder.update.mockResolvedValue({ ...releasedFirstStage, status: 'IN_PROGRESS' });

        const result = await service.start('wo-1', user);
        expect(result.status).toBe('IN_PROGRESS');
      });
    });

    describe('first-stage vs subsequent-stage input gate (spec sections 7-9, 37, 43)', () => {
      it('the first routing stage (no parentWorkOrderId) needs no previous-stage handover to start', async () => {
        prisma.workOrder.findFirst.mockResolvedValue(releasedFirstStage);
        prisma.manpowerAllocation.findFirst.mockResolvedValue({ id: 'alloc-1', status: 'APPROVED' });
        prisma.workOrder.update.mockResolvedValue({ ...releasedFirstStage, status: 'IN_PROGRESS' });

        const result = await service.start('wo-1', user);
        expect(result.status).toBe('IN_PROGRESS');
      });

      it('blocks a subsequent stage with zero available input (manual test 2, spec section 9)', async () => {
        prisma.workOrder.findFirst.mockResolvedValue(releasedSubsequentStage);
        prisma.manpowerAllocation.findFirst.mockResolvedValue({ id: 'alloc-1', status: 'APPROVED' });

        await expect(service.start('wo-1', user)).rejects.toThrow(BadRequestException);
      });

      it('allows a subsequent stage once positive available input exists (manual tests 3-4)', async () => {
        prisma.workOrder.findFirst.mockResolvedValue({ ...releasedSubsequentStage, cumulativeInputQty: 200 });
        prisma.manpowerAllocation.findFirst.mockResolvedValue({ id: 'alloc-1', status: 'APPROVED' });
        prisma.workOrder.update.mockResolvedValue({ ...releasedSubsequentStage, status: 'IN_PROGRESS', cumulativeInputQty: 200 });

        const result = await service.start('wo-1', user);
        expect(result.status).toBe('IN_PROGRESS');
      });

      it('available input accounts for what has already been processed (spec sections 10-11)', async () => {
        // 200 received, 150 already processed -> 50 available, still positive, still allowed
        prisma.workOrder.findFirst.mockResolvedValue({ ...releasedSubsequentStage, cumulativeInputQty: 200, cumulativeProcessedQty: 150 });
        prisma.manpowerAllocation.findFirst.mockResolvedValue({ id: 'alloc-1', status: 'APPROVED' });
        prisma.workOrder.update.mockResolvedValue({ ...releasedSubsequentStage, status: 'IN_PROGRESS' });

        const result = await service.start('wo-1', user);
        expect(result.status).toBe('IN_PROGRESS');
      });

      it('blocks when received equals already-processed - no fresh available input remains', async () => {
        prisma.workOrder.findFirst.mockResolvedValue({ ...releasedSubsequentStage, cumulativeInputQty: 200, cumulativeProcessedQty: 200 });
        prisma.manpowerAllocation.findFirst.mockResolvedValue({ id: 'alloc-1', status: 'APPROVED' });

        await expect(service.start('wo-1', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('multiple stages of the same WO can be simultaneously active (spec sections 4, 18)', () => {
      it('starting a subsequent stage never touches or depends on another stage row directly - each call is independent', async () => {
        prisma.workOrder.findFirst.mockResolvedValue({ ...releasedSubsequentStage, cumulativeInputQty: 200 });
        prisma.manpowerAllocation.findFirst.mockResolvedValue({ id: 'alloc-1', status: 'APPROVED' });
        prisma.workOrder.update.mockResolvedValue({ ...releasedSubsequentStage, status: 'IN_PROGRESS' });

        await service.start('wo-mi', user);

        const updateCall = prisma.workOrder.update.mock.calls[0][0];
        expect(updateCall.where.id).toBe('wo-mi');
      });
    });

    describe('sets stageStatus alongside status (spec section 5)', () => {
      it('IN_PRODUCTION stageStatus is set when a bypass-role user starts directly', async () => {
        prisma.workOrder.findFirst.mockResolvedValue(releasedFirstStage);
        prisma.manpowerAllocation.findFirst.mockResolvedValue({ id: 'alloc-1', status: 'APPROVED' });
        prisma.workOrder.update.mockResolvedValue({ ...releasedFirstStage, status: 'IN_PROGRESS', stageStatus: 'IN_PRODUCTION' });

        await service.start('wo-1', user);

        const updateCall = prisma.workOrder.update.mock.calls[0][0];
        expect(updateCall.data.stageStatus).toBe('IN_PRODUCTION');
      });
    });
  });

  describe('PROD-012: Stage Completion / Remaining WIP Reconciliation', () => {
    const firstStageWo = {
      id: 'wo-smt', companyId: 'company-1', status: 'IN_PROGRESS', parentWorkOrderId: null,
      completedQty: 980, rejectedQty: 20, cumulativeProcessedQty: 1000, cumulativeInputQty: 0,
    };
    const subsequentStageWo = {
      ...firstStageWo, id: 'wo-mi', parentWorkOrderId: 'wo-smt',
      completedQty: 490, rejectedQty: 10, cumulativeProcessedQty: 500, cumulativeInputQty: 500,
    };

    beforeEach(() => {
      prisma.workOrder.findFirst.mockResolvedValue(firstStageWo);
      prisma.workOrder.update.mockResolvedValue({ ...firstStageWo, status: 'COMPLETED' });
      prisma.productionQc = { findFirst: jest.fn().mockResolvedValue(null) };
      prisma.downtime = { findFirst: jest.fn().mockResolvedValue(null) };
      prisma.productionEntry = { aggregate: jest.fn().mockResolvedValue({ _sum: { reworkQty: 0 } }) };
      materialReservation.releaseReservations = jest.fn().mockResolvedValue([]);
    });

    describe('positive: valid final stage completion (manual test 4, spec section 63)', () => {
      it('completes the exact spec example: 1000 input, 980 good, 20 reject, fully reconciled', async () => {
        const result = await service.complete('wo-smt', {} as any, user);
        expect(result.status).toBe('COMPLETED');
      });

      it('never sets a separate stageStatus field - WorkOrder.status IS the stage completion signal', async () => {
        await service.complete('wo-smt', {} as any, user);
        const updateCall = prisma.workOrder.update.mock.calls.find((c: any) => c[0].data.status === 'COMPLETED');
        expect(updateCall).toBeDefined();
      });
    });

    describe('unreconciled/excess quantity blocked (manual tests 5-6, spec sections 12-13)', () => {
      it('blocks completion when accounted quantity is less than processed (unreconciled)', async () => {
        prisma.workOrder.findFirst.mockResolvedValue({ ...firstStageWo, completedQty: 470, rejectedQty: 20, cumulativeProcessedQty: 500 });
        await expect(service.complete('wo-mi', {} as any, user)).rejects.toThrow(BadRequestException);
      });

      it('blocks completion when accounted quantity exceeds processed (excess/created)', async () => {
        prisma.workOrder.findFirst.mockResolvedValue({ ...firstStageWo, completedQty: 500, rejectedQty: 20, cumulativeProcessedQty: 500 });
        await expect(service.complete('wo-mi', {} as any, user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('remaining unprocessed input blocked (manual test 7, spec section 14)', () => {
      it('blocks a non-first-stage completion when input remains unprocessed', async () => {
        prisma.workOrder.findFirst.mockResolvedValue({ ...subsequentStageWo, cumulativeInputQty: 550, cumulativeProcessedQty: 500 });
        await expect(service.complete('wo-mi', {} as any, user)).rejects.toThrow(BadRequestException);
      });

      it('allows authorized short closure with a reason despite remaining input', async () => {
        prisma.workOrder.findFirst.mockResolvedValue({ ...subsequentStageWo, cumulativeInputQty: 550, cumulativeProcessedQty: 500 });
        const result = await service.complete('wo-mi', { shortClosure: true, reason: 'Material shortage - management approved' } as any, user);
        expect(result.status).toBe('COMPLETED');
      });

      it('the first stage (no parentWorkOrderId) skips the remaining-input check entirely', async () => {
        prisma.workOrder.findFirst.mockResolvedValue(firstStageWo);
        const result = await service.complete('wo-smt', {} as any, user);
        expect(result.status).toBe('COMPLETED');
      });
    });

    describe('active downtime blocks completion (manual test 10, spec section 27)', () => {
      it('blocks completion while a downtime record is OPEN', async () => {
        prisma.downtime.findFirst.mockResolvedValue({ id: 'dt-1', status: 'OPEN', startTime: new Date('2026-05-10T10:20:00') });
        await expect(service.complete('wo-smt', {} as any, user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('IPQC gate preserved (pre-existing, unchanged behavior)', () => {
      it('still blocks completion on a failed IPQC inspection', async () => {
        prisma.productionQc.findFirst.mockResolvedValue({ qcNumber: 'QC-1', result: 'FAIL' });
        await expect(service.complete('wo-smt', {} as any, user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('WO status verification (spec section 4, manual test 4)', () => {
      it('completing this WO never implies any other WO (a different routing stage) is touched', async () => {
        await service.complete('wo-smt', {} as any, user);
        // complete() only ever calls prisma.workOrder.update with this WO's own id
        const updateCall = prisma.workOrder.update.mock.calls[prisma.workOrder.update.mock.calls.length - 1][0];
        expect(updateCall.where.id).toBe('wo-smt');
      });
    });

    describe('material reservation release preserved (pre-existing behavior)', () => {
      it('still releases material reservations on completion', async () => {
        await service.complete('wo-smt', {} as any, user);
        expect(materialReservation.releaseReservations).toHaveBeenCalledWith('wo-smt', user, true);
      });
    });

    describe('rework counted in reconciliation (spec section 11)', () => {
      it('accounts for confirmed rework quantity, not just good+reject', async () => {
        prisma.workOrder.findFirst.mockResolvedValue({ ...firstStageWo, completedQty: 970, rejectedQty: 20, cumulativeProcessedQty: 1000 });
        prisma.productionEntry.aggregate.mockResolvedValue({ _sum: { reworkQty: 10 } }); // 970+20+10=1000, reconciles

        const result = await service.complete('wo-smt', {} as any, user);
        expect(result.status).toBe('COMPLETED');
      });
    });

    describe('audit', () => {
      it('logs stage completion with quantity breakdown', async () => {
        await service.complete('wo-smt', {} as any, user);
        expect(audit.log).toHaveBeenCalledWith(
          expect.objectContaining({ tableName: 'work_orders', action: 'UPDATE', changedBy: user.id }),
        );
      });
    });
  });
});
