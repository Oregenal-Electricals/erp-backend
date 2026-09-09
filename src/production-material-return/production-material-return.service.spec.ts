import { NotFoundException } from '@nestjs/common';
import { ProductionMaterialReturnService } from './production-material-return.service';

describe('ProductionMaterialReturnService', () => {
  let service: ProductionMaterialReturnService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;

  const user = { id: 'user-1', companyId: 'company-1' };
  const wo = { id: 'wo-1', companyId: 'company-1', woNumber: 'WO-001', warehouseId: 'wh-1' };

  beforeEach(() => {
    prisma = {
      workOrder: { findFirst: jest.fn().mockResolvedValue(wo) },
      warehouse: { findFirst: jest.fn().mockResolvedValue({ id: 'wh-1' }) },
      productionMaterialReturn: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'mret-1', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
      },
      productionIssueItem: { findMany: jest.fn().mockResolvedValue([]) },
      productionEntry: { findMany: jest.fn().mockResolvedValue([]) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = { postTransaction: jest.fn().mockResolvedValue({}) };
    service = new ProductionMaterialReturnService(prisma, audit, stockLedger);
  });

  describe('create - returning material to Store', () => {
    it('creates the return record and posts a RETURN stock-ledger transaction', async () => {
      const r = await service.create({ workOrderId: 'wo-1', warehouseId: 'wh-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', qty: 20, reason: 'EXCESS_UNUSED' } as any, user);
      expect(r.qty).toBe(20);
      expect(stockLedger.postTransaction).toHaveBeenCalledWith(expect.objectContaining({
        itemCode: 'DRIVER-01', warehouseId: 'wh-1', transactionType: 'RETURN', inQty: 20,
      }));
    });

    it('throws NotFoundException for a work order that does not exist', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(null);
      await expect(service.create({ workOrderId: 'missing', warehouseId: 'wh-1', itemCode: 'X', itemName: 'X', uom: 'PCS', qty: 1 } as any, user))
        .rejects.toThrow(NotFoundException);
      expect(stockLedger.postTransaction).not.toHaveBeenCalled();
    });

    it('logs the audit trail', async () => {
      const r = await service.create({ workOrderId: 'wo-1', warehouseId: 'wh-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', qty: 20 } as any, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'production_material_returns', action: 'CREATE', recordId: r.id }));
    });
  });

  describe('getPreviousMaterialStatus - the reconciliation check', () => {
    const woWithBom = {
      ...wo,
      bom: { items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', quantity: 1, effectiveQty: 1.05 }] },
    };

    it('is CLEAR when standard consumption (from summed processed output x BOM ratio) covers the issued qty', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(woWithBom);
      prisma.productionIssueItem.findMany.mockResolvedValue([
        { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', issuedQty: 1000 },
      ]);
      // two entries, summed before multiplying by the BOM ratio - not applied entry-by-entry
      prisma.productionEntry.findMany.mockResolvedValue([{ totalQty: 500 }, { totalQty: 452 }]);
      const r = await service.getPreviousMaterialStatus('wo-1', user);
      // (500+452) * 1.05 = 999.6, close enough that outstanding rounds to ~0.4, still flags as pending at this exact number
      expect(r.items[0].standardConsumed).toBeCloseTo(999.6, 1);
    });

    it('is PENDING when issued qty exceeds what was processed + returned', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(woWithBom);
      prisma.productionIssueItem.findMany.mockResolvedValue([
        { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', issuedQty: 1000 },
      ]);
      prisma.productionEntry.findMany.mockResolvedValue([{ totalQty: 800 }]); // 800*1.05=840, far short of 1000
      const r = await service.getPreviousMaterialStatus('wo-1', user);
      expect(r.items[0].status).toBe('PENDING');
      expect(r.items[0].outstandingQty).toBeGreaterThan(0);
      expect(r.overallStatus).toBe('PENDING');
    });

    it('reduces outstanding when material has been physically returned', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(woWithBom);
      prisma.productionIssueItem.findMany.mockResolvedValue([
        { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', issuedQty: 1000 },
      ]);
      prisma.productionEntry.findMany.mockResolvedValue([{ totalQty: 800 }]); // consumed 840
      prisma.productionMaterialReturn.findMany.mockResolvedValue([{ itemCode: 'DRIVER-01', qty: 160 }]); // returns the rest
      const r = await service.getPreviousMaterialStatus('wo-1', user);
      expect(r.items[0].status).toBe('CLEAR');
      expect(r.items[0].outstandingQty).toBe(0);
    });

    it('is CLEAR with an empty items array when nothing has been issued to this WO yet', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(woWithBom);
      const r = await service.getPreviousMaterialStatus('wo-1', user);
      expect(r.items).toEqual([]);
      expect(r.overallStatus).toBe('CLEAR');
    });

    it('flags overallStatus PENDING if ANY one of multiple items is unreconciled, even if others are clear', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({
        ...wo,
        bom: { items: [
          { itemCode: 'DRIVER-01', itemName: 'LED Driver', quantity: 1, effectiveQty: 1 },
          { itemCode: 'PCB-01', itemName: 'PCB', quantity: 1, effectiveQty: 1 },
        ] },
      });
      prisma.productionIssueItem.findMany.mockResolvedValue([
        { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', issuedQty: 1000 },
        { itemCode: 'PCB-01', itemName: 'PCB', uom: 'PCS', issuedQty: 1000 },
      ]);
      prisma.productionEntry.findMany.mockResolvedValue([{ totalQty: 1000 }]); // fully accounts for both at ratio 1
      prisma.productionMaterialReturn.findMany.mockResolvedValue([{ itemCode: 'PCB-01', qty: -1000 }]); // artificially force PCB pending via negative return offset for the test
      const r = await service.getPreviousMaterialStatus('wo-1', user);
      const pcb = r.items.find((i: any) => i.itemCode === 'PCB-01');
      expect(pcb.status).toBe('PENDING');
      expect(r.overallStatus).toBe('PENDING');
    });

    it('sums issuedQty across multiple ProductionIssueItem rows for the same item code', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(woWithBom);
      prisma.productionIssueItem.findMany.mockResolvedValue([
        { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', issuedQty: 400 },
        { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', issuedQty: 600 },
      ]);
      prisma.productionEntry.findMany.mockResolvedValue([]);
      const r = await service.getPreviousMaterialStatus('wo-1', user);
      expect(r.items[0].issuedQty).toBe(1000);
    });

    it('only counts CONFIRMED production entries and ISSUED production issues', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(woWithBom);
      await service.getPreviousMaterialStatus('wo-1', user);
      expect(prisma.productionEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'CONFIRMED' }) }),
      );
      expect(prisma.productionIssueItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ productionIssue: expect.objectContaining({ status: 'ISSUED' }) }) }),
      );
    });

    it('throws NotFoundException for a work order that does not exist', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(null);
      await expect(service.getPreviousMaterialStatus('missing', user)).rejects.toThrow(NotFoundException);
    });
  });
});
