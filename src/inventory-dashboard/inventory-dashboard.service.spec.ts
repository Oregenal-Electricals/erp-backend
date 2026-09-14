import { InventoryDashboardService } from './inventory-dashboard.service';

describe('InventoryDashboardService - STORE-018', () => {
  let service: InventoryDashboardService;
  let prisma: any;
  const user = { companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      stockBalance: { findMany: jest.fn().mockResolvedValue([]) },
      stockBatch: { findMany: jest.fn().mockResolvedValue([]) },
      rtvRequest: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
      materialReservation: { findMany: jest.fn().mockResolvedValue([]) },
      gateInwardEntry: { count: jest.fn().mockResolvedValue(0) },
      storeReceiving: { count: jest.fn().mockResolvedValue(0) },
      iqcInspection: { count: jest.fn().mockResolvedValue(0) },
      stockPutaway: { count: jest.fn().mockResolvedValue(0) },
      rejectedStockItem: { count: jest.fn().mockResolvedValue(0) },
      holdStockItem: { count: jest.fn().mockResolvedValue(0) },
      workOrder: { count: jest.fn().mockResolvedValue(0) },
      additionalMaterialRequest: { count: jest.fn().mockResolvedValue(0) },
      stockAdjustment: { count: jest.fn().mockResolvedValue(0) },
      materialIssueOverride: { count: jest.fn().mockResolvedValue(0) },
    };
    service = new InventoryDashboardService(prisma);
  });

  describe('getReconciliation - detects, never fixes (STORE-018 sections 58-61)', () => {
    it('reports GREEN health when nothing is wrong', async () => {
      const r = await service.getReconciliation(user);
      expect(r.health).toBe('GREEN');
      expect(r.issues).toHaveLength(0);
    });

    it('flags negative stock as CRITICAL', async () => {
      prisma.stockBalance.findMany.mockImplementation(({ where }: any) =>
        Promise.resolve(where.availableQty?.lt !== undefined ? [{ itemCode: 'X', warehouseId: 'wh-1', availableQty: -5 }] : [])
      );
      const r = await service.getReconciliation(user);
      expect(r.health).toBe('RED');
      expect(r.issues.find((i: any) => i.check === 'NEGATIVE_STOCK')).toBeTruthy();
    });

    it('flags Reserved > Available as CRITICAL reservation shortfall (test scenario O)', async () => {
      prisma.stockBalance.findMany.mockImplementation(({ where }: any) =>
        Promise.resolve(where.reservedQty?.gt !== undefined ? [{ itemCode: 'X', warehouseId: 'wh-1', reservedQty: 600, availableQty: 500 }] : [])
      );
      const r = await service.getReconciliation(user);
      expect(r.health).toBe('RED');
      const issue = r.issues.find((i: any) => i.check === 'RESERVATION_SHORTFALL');
      expect(issue.difference).toBe(100);
    });

    it('does not flag Reserved == Available as a shortfall', async () => {
      prisma.stockBalance.findMany.mockImplementation(({ where }: any) =>
        Promise.resolve(where.reservedQty?.gt !== undefined ? [{ itemCode: 'X', warehouseId: 'wh-1', reservedQty: 500, availableQty: 500 }] : [])
      );
      const r = await service.getReconciliation(user);
      expect(r.issues.find((i: any) => i.check === 'RESERVATION_SHORTFALL')).toBeUndefined();
    });

    it('flags a Gate-Out qty that somehow exceeds prepared qty as CRITICAL (data-level sanity check)', async () => {
      prisma.rtvRequest.findMany.mockResolvedValue([{ rtvNumber: 'RTV-1', itemCode: 'X', preparedQty: 50, gateOutQty: 60, approvedQty: 80, requestedQty: 100 }]);
      const r = await service.getReconciliation(user);
      expect(r.health).toBe('RED');
      expect(r.issues.find((i: any) => i.check === 'RTV_GATEOUT_EXCEEDS_PREPARED')).toBeTruthy();
    });

    it('flags an RTV approved qty exceeding requested as AMBER, not CRITICAL', async () => {
      prisma.rtvRequest.findMany.mockResolvedValue([{ rtvNumber: 'RTV-1', itemCode: 'X', preparedQty: 0, gateOutQty: 0, approvedQty: 120, requestedQty: 100 }]);
      const r = await service.getReconciliation(user);
      expect(r.health).toBe('AMBER');
      expect(r.issues.find((i: any) => i.check === 'RTV_APPROVED_EXCEEDS_REQUESTED').severity).toBe('AMBER');
    });

    it('never mutates any stock/reservation/RTV record while reconciling (detection only)', async () => {
      prisma.stockBalance.findMany.mockResolvedValue([{ itemCode: 'X', warehouseId: 'wh-1', availableQty: -5 }]);
      prisma.stockBalance.update = jest.fn();
      await service.getReconciliation(user);
      expect(prisma.stockBalance.update).not.toHaveBeenCalled();
    });
  });

  describe('getActionCards - operational counts only, no fabricated pending states', () => {
    it('reports productionReturnsPending as explicitly not applicable rather than a fake number', async () => {
      const cards = await service.getActionCards(user);
      expect(cards.productionReturnsPending.notApplicable).toBe(true);
    });

    it('wires stockCountVariancePending to DRAFT stock adjustments', async () => {
      prisma.stockAdjustment.count.mockResolvedValue(3);
      const cards = await service.getActionCards(user);
      expect(cards.stockCountVariancePending).toBe(3);
    });

    it('wires rtvApprovalPending and rtvGateOutPending to the correct RTV statuses separately', async () => {
      prisma.rtvRequest.count.mockImplementation(({ where }: any) =>
        Promise.resolve(where.status === 'DRAFT' ? 2 : 5)
      );
      const cards = await service.getActionCards(user);
      expect(cards.rtvApprovalPending).toBe(2);
      expect(cards.rtvGateOutPending).toBe(5);
    });

    it('computes reservationShortfall by comparing reserved vs available, not a separate stored counter', async () => {
      prisma.stockBalance.findMany.mockResolvedValue([{ reservedQty: 600, availableQty: 500 }, { reservedQty: 100, availableQty: 200 }]);
      const cards = await service.getActionCards(user);
      expect(cards.reservationShortfall).toBe(1);
    });
  });
});
