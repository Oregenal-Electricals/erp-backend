import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductionIssueService } from './production-issue.service';

describe('ProductionIssueService.create - previous material status gate', () => {
  let service: ProductionIssueService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;
  let mrpService: any;
  let materialReturnService: any;

  const user = { id: 'user-1', companyId: 'company-1' };
  const wo = { id: 'wo-1', companyId: 'company-1', status: 'RELEASED' };
  const dto = { workOrderId: 'wo-1', warehouseId: 'wh-1', items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', requiredQty: 500, issuedQty: 500, unitCost: 0 }], issueMethod: 'FIFO' };

  beforeEach(() => {
    prisma = {
      workOrder: { findFirst: jest.fn().mockResolvedValue(wo), update: jest.fn().mockResolvedValue(wo) },
      productionIssue: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'pi-1', ...data, items: data.items?.create || [] })),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = { postTransaction: jest.fn().mockResolvedValue({}) };
    mrpService = { calculateMrp: jest.fn() };
    materialReturnService = { getPreviousMaterialStatus: jest.fn().mockResolvedValue({ overallStatus: 'CLEAR', items: [] }) };
    service = new ProductionIssueService(prisma, audit, stockLedger, mrpService, materialReturnService);
  });

  it('allows the new issue when previous material status is CLEAR', async () => {
    const r = await service.create(dto as any, user);
    expect(r.id).toBe('pi-1');
    expect(prisma.productionIssue.create).toHaveBeenCalled();
  });

  it('blocks the new issue when previous material status is PENDING, with the outstanding qty in the message', async () => {
    materialReturnService.getPreviousMaterialStatus.mockResolvedValue({
      overallStatus: 'PENDING',
      items: [{ itemCode: 'DRIVER-01', outstandingQty: 50, uom: 'PCS', status: 'PENDING' }],
    });
    await expect(service.create(dto as any, user)).rejects.toThrow(BadRequestException);
    await expect(service.create(dto as any, user)).rejects.toThrow(/DRIVER-01: 50 PCS unreconciled/);
    expect(prisma.productionIssue.create).not.toHaveBeenCalled();
  });

  it('checks the previous material status for the correct work order and user', async () => {
    await service.create(dto as any, user);
    expect(materialReturnService.getPreviousMaterialStatus).toHaveBeenCalledWith('wo-1', user);
  });

  it('validates work order existence before checking material status', async () => {
    prisma.workOrder.findFirst.mockResolvedValue(null);
    await expect(service.create(dto as any, user)).rejects.toThrow(NotFoundException);
    expect(materialReturnService.getPreviousMaterialStatus).not.toHaveBeenCalled();
  });

  it('validates work order status before checking material status', async () => {
    prisma.workOrder.findFirst.mockResolvedValue({ ...wo, status: 'DRAFT' });
    await expect(service.create(dto as any, user)).rejects.toThrow(/RELEASED or IN_PROGRESS/);
    expect(materialReturnService.getPreviousMaterialStatus).not.toHaveBeenCalled();
  });

  it('only mentions the specific PENDING items in the block message, not every issued item', async () => {
    materialReturnService.getPreviousMaterialStatus.mockResolvedValue({
      overallStatus: 'PENDING',
      items: [
        { itemCode: 'DRIVER-01', outstandingQty: 0, uom: 'PCS', status: 'CLEAR' },
        { itemCode: 'PCB-01', outstandingQty: 30, uom: 'PCS', status: 'PENDING' },
      ],
    });
    try {
      await service.create(dto as any, user);
      fail('expected to throw');
    } catch (e: any) {
      expect(e.message).toContain('PCB-01');
      expect(e.message).not.toContain('DRIVER-01: 0');
    }
  });
});
