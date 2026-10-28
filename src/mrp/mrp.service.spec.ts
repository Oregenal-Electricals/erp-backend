import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MrpService } from './mrp.service';

describe('MrpService.calculateMrp - warehouse-scoped stock lookup', () => {
  let service: MrpService;
  let prisma: any;
  let audit: any;
  let materialReservation: any;
  let routingService: any;

  const user = { id: 'user-1', companyId: 'company-1' };
  const wo = {
    id: 'wo-1', companyId: 'company-1', woNumber: 'WO-001', bomId: 'bom-1',
    warehouseId: 'wh-real', status: 'RELEASED', plannedQty: 30,
    productCode: 'P1', productName: 'Product 1', warehouse: { name: 'Real Warehouse' },
  };
  const bom = {
    id: 'bom-1', bomNumber: 'BOM-001', version: 1,
    items: [{ sequence: 1, itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', itemType: 'RAW_MATERIAL', quantity: 1, effectiveQty: 1, wastagePercent: 0 }],
  };

  beforeEach(() => {
    prisma = {
      workOrder: { findFirst: jest.fn().mockResolvedValue(wo) },
      bom: { findFirst: jest.fn().mockResolvedValue(bom) },
      stockBalance: { findFirst: jest.fn() },
      stockBatch: { findMany: jest.fn().mockResolvedValue([]) },
    };
    audit = {};
    materialReservation = {};
    routingService = {};
    service = new MrpService(prisma, audit, materialReservation, routingService);
  });

  it('scopes the stock balance lookup to the work order\'s own warehouse', async () => {
    prisma.stockBalance.findFirst.mockResolvedValue({ availableQty: 70 });
    await service.calculateMrp('wo-1', user);
    expect(prisma.stockBalance.findFirst).toHaveBeenCalledWith({
      where: { companyId: 'company-1', itemCode: 'DRIVER-01', warehouseId: 'wh-real' },
    });
  });

  it('uses the real warehouse balance (70 available) rather than a different warehouse\'s zero balance', async () => {
    // Simulates the bug scenario directly: without the warehouseId filter,
    // a multi-warehouse company could have findFirst() return a different
    // warehouse's zero-stock row. With the fix, the mock only returns a
    // value when called with the correct warehouseId - so a passing test
    // here proves the filter is actually applied, not just present in code.
    prisma.stockBalance.findFirst.mockImplementation(({ where }: any) =>
      where.warehouseId === 'wh-real' ? Promise.resolve({ availableQty: 70 }) : Promise.resolve({ availableQty: 0 }),
    );
    const result = await service.calculateMrp('wo-1', user);
    expect(result.requirements[0].availableQty).toBe(70);
    expect(result.requirements[0].shortage).toBe(0);
    expect(result.requirements[0].status).toBe('AVAILABLE');
  });

  it('sees zero stock for the work order\'s own warehouse, even when a different warehouse has plenty', async () => {
    // Confirms the filter is warehouse-specific: a completely unrelated
    // warehouse having 999 units must not leak into this WO's number.
    prisma.stockBalance.findFirst.mockImplementation(({ where }: any) =>
      where.warehouseId === 'wh-real' ? Promise.resolve(null) : Promise.resolve({ availableQty: 999 }),
    );
    const result = await service.calculateMrp('wo-1', user);
    expect(result.requirements[0].availableQty).toBe(0);
    expect(result.requirements[0].shortage).toBe(30);
    expect(result.requirements[0].status).toBe('SHORTAGE');
  });

  it('flags SHORTAGE and hasShortage when required exceeds the WO warehouse\'s available qty', async () => {
    prisma.stockBalance.findFirst.mockResolvedValue({ availableQty: 10 }); // need 30, have 10
    const result = await service.calculateMrp('wo-1', user);
    expect(result.requirements[0].shortage).toBe(20);
    expect(result.requirements[0].status).toBe('SHORTAGE');
    expect(result.summary.hasShortage).toBe(true);
    expect(result.summary.canProduce).toBe(false);
  });

  it('throws NotFoundException for a work order that does not exist', async () => {
    prisma.workOrder.findFirst.mockResolvedValue(null);
    await expect(service.calculateMrp('missing', user)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when the work order has no BOM linked', async () => {
    prisma.workOrder.findFirst.mockResolvedValue({ ...wo, bomId: null });
    await expect(service.calculateMrp('wo-1', user)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for a completed work order', async () => {
    prisma.workOrder.findFirst.mockResolvedValue({ ...wo, status: 'COMPLETED' });
    await expect(service.calculateMrp('wo-1', user)).rejects.toThrow(/completed\/cancelled/);
  });
});

describe('MrpService.checkSoMaterialCompleteness - SO material-completeness gate (used by WO start)', () => {
  let service: MrpService;
  let prisma: any;

  const so = {
    id: 'so-1', soNumber: 'SO-2026-0001',
    items: [{ id: 'soi-1', itemCode: 'FG-1', itemName: 'Finished Good 1', uom: 'PCS', qty: 100, pendingQty: 50, isActive: true }],
  };

  beforeEach(() => {
    prisma = {
      salesOrder: { findFirst: jest.fn().mockResolvedValue(so) },
      workOrder: { findMany: jest.fn().mockResolvedValue([]) },
      product: {
        findFirst: jest.fn(({ where }: any) =>
          where.code === 'FG-1' ? Promise.resolve({ id: 'product-1', name: 'Finished Good 1' }) : Promise.resolve(null),
        ),
      },
      bom: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'bom-1',
          items: [{ itemCode: 'RM-1', itemName: 'Raw Material 1', uom: 'PCS', effectiveQty: 2, wastagePercent: 0 }],
        }),
      },
      routingStage: { findFirst: jest.fn().mockResolvedValue(null) },
      stockBalance: { findUnique: jest.fn(), findFirst: jest.fn() },
      purchaseOrderItem: { findMany: jest.fn().mockResolvedValue([]) },
      rawMaterial: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    service = new MrpService(prisma, {} as any, {} as any, {} as any);
  });

  // The engine nets the finished-good item itself against its own on-hand
  // stock first (an already-built FG would need no fresh raw material at
  // all) before exploding any remainder into its BOM - so FG-1's own
  // stock is pinned to 0 in these tests, keeping the raw-material (RM-1)
  // figure the one and only variable under test.
  function mockStock(rmAvailableQty: number) {
    prisma.stockBalance.findUnique.mockImplementation(({ where }: any) => {
      const itemCode = where.companyId_itemCode_warehouseId.itemCode;
      return Promise.resolve({ availableQty: itemCode === 'FG-1' ? 0 : rmAvailableQty });
    });
  }

  it('reports complete=true when stock fully covers the SO\'s pending quantity (reuses the BOM-explosion engine, not a parallel calculation)', async () => {
    // pendingQty 50 x effectiveQty 2 = 100 required; plenty of RM-1 in stock.
    mockStock(1000);

    const result = await service.checkSoMaterialCompleteness('so-1', 'company-1', 'wh-1');

    expect(prisma.salesOrder.findFirst).toHaveBeenCalledWith({
      where: { id: 'so-1', companyId: 'company-1' },
      include: { items: { where: { isActive: true } } },
    });
    expect(result.complete).toBe(true);
    expect(result.shortItems).toEqual([]);
    expect(result.soNumber).toBe('SO-2026-0001');
  });

  it('reports complete=false with the short raw material when stock does not cover the requirement', async () => {
    // Need 100, only 10 of RM-1 available -> shortage of 90.
    mockStock(10);

    const result = await service.checkSoMaterialCompleteness('so-1', 'company-1', 'wh-1');

    expect(result.complete).toBe(false);
    expect(result.shortItems).toHaveLength(1);
    expect(result.shortItems[0]).toMatchObject({ itemCode: 'RM-1', shortQty: 90 });
  });

  it('checks the still-PENDING quantity, not the full original order qty, when pendingQty is set', async () => {
    // 1 short of covering pendingQty(50)*2=100 required - proves qty=100 (full order) was NOT used,
    // which would show a much larger shortage instead.
    mockStock(99);
    const result = await service.checkSoMaterialCompleteness('so-1', 'company-1', 'wh-1');
    expect(result.shortItems[0].shortQty).toBe(1);
  });

  it('falls back to the full ordered qty when pendingQty is not set (0)', async () => {
    prisma.salesOrder.findFirst.mockResolvedValue({
      ...so, items: [{ ...so.items[0], pendingQty: 0, qty: 75 }],
    });
    // 75 x effectiveQty 2 = 150 required; 149 of RM-1 available -> short by exactly 1,
    // proving qty=75 (not pendingQty=0, which would skip the item entirely) was used.
    mockStock(149);

    const result = await service.checkSoMaterialCompleteness('so-1', 'company-1', 'wh-1');

    expect(result.complete).toBe(false);
    expect(result.shortItems[0]).toMatchObject({ itemCode: 'RM-1', requiredQty: 150, shortQty: 1 });
  });

  it('skips a line item with no producible BOM (a raw material sold as-is) instead of blocking on it', async () => {
    prisma.bom.findFirst.mockResolvedValue(null);
    prisma.routingStage.findFirst.mockResolvedValue(null);

    const result = await service.checkSoMaterialCompleteness('so-1', 'company-1', 'wh-1');

    expect(result.complete).toBe(true);
    expect(result.shortItems).toEqual([]);
    expect(prisma.stockBalance.findUnique).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the Sales Order does not exist (or belongs to another company)', async () => {
    prisma.salesOrder.findFirst.mockResolvedValue(null);
    await expect(service.checkSoMaterialCompleteness('missing-so', 'company-1', 'wh-1')).rejects.toThrow(NotFoundException);
  });
});
