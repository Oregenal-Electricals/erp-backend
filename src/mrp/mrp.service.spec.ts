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
