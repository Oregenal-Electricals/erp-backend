import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductionIssueService } from './production-issue.service';

describe('ProductionIssueService.create - previous material status gate', () => {
  let service: ProductionIssueService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;
  let mrpService: any;
  let materialReturnService: any;
  let overrideService: any;

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
      materialReservation: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { reservedQty: 0, issuedQty: 0 } }),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = { postTransaction: jest.fn().mockResolvedValue({}) };
    mrpService = { calculateMrp: jest.fn() };
    materialReturnService = { getPreviousMaterialStatus: jest.fn().mockResolvedValue({ overallStatus: 'CLEAR', items: [] }) };
    overrideService = { findActiveApprovedOverride: jest.fn().mockResolvedValue(null), consume: jest.fn().mockResolvedValue(500) };
    const materialReservation = { recordIssueAgainstReservations: jest.fn().mockResolvedValue(0) };
    // Default: original remaining is effectively unlimited, so the
    // STORE-013 additional-material gate never triggers unless a test
    // explicitly overrides getOriginalRemaining to a smaller value.
    const additionalMaterialRequest = {
      getOriginalRemaining: jest.fn().mockResolvedValue({ originalRequirement: 100000, totalIssued: 0, originalRemaining: 100000 }),
      findActiveApprovedRequest: jest.fn().mockResolvedValue(null),
      consume: jest.fn().mockResolvedValue(0),
    };
    service = new ProductionIssueService(prisma, audit, stockLedger, mrpService, materialReturnService, overrideService, materialReservation as any, additionalMaterialRequest as any);
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
    await expect(service.create(dto as any, user)).rejects.toThrow(/DRIVER-01 - 50 PCS unreconciled/);
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

  it('allows the issue through a valid APPROVED override even while PENDING, and consumes it afterward', async () => {
    materialReturnService.getPreviousMaterialStatus.mockResolvedValue({
      overallStatus: 'PENDING',
      items: [{ itemCode: 'DRIVER-01', outstandingQty: 50, uom: 'PCS', status: 'PENDING' }],
    });
    overrideService.findActiveApprovedOverride.mockResolvedValue({ id: 'override-1', approvedQty: 500, usedQty: 0 });
    const r = await service.create(dto as any, user);
    expect(r.id).toBe('pi-1');
    expect(overrideService.consume).toHaveBeenCalledWith('override-1', 'pi-1', 500, user);
  });

  it('checks for an override for the correct work order and item before blocking', async () => {
    materialReturnService.getPreviousMaterialStatus.mockResolvedValue({ overallStatus: 'PENDING', items: [{ itemCode: 'DRIVER-01', outstandingQty: 50, uom: 'PCS', status: 'PENDING' }] });
    overrideService.findActiveApprovedOverride.mockResolvedValue(null);
    await expect(service.create(dto as any, user)).rejects.toThrow(BadRequestException);
    expect(overrideService.findActiveApprovedOverride).toHaveBeenCalledWith('wo-1', 'DRIVER-01', user);
  });

  it('does not consume an override on the CLEAR path (nothing to consume)', async () => {
    await service.create(dto as any, user);
    expect(overrideService.consume).not.toHaveBeenCalled();
  });

  it('only mentions the specific PENDING items in the block message, not an unrelated clear item', async () => {
    const twoItemDto = {
      ...dto,
      items: [
        { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', requiredQty: 500, issuedQty: 500, unitCost: 0 },
        { itemCode: 'PCB-01', itemName: 'PCB', uom: 'PCS', requiredQty: 30, issuedQty: 30, unitCost: 0 },
      ],
    };
    materialReturnService.getPreviousMaterialStatus.mockResolvedValue({
      overallStatus: 'PENDING',
      items: [
        { itemCode: 'DRIVER-01', outstandingQty: 0, uom: 'PCS', status: 'CLEAR' },
        { itemCode: 'PCB-01', outstandingQty: 30, uom: 'PCS', status: 'PENDING' },
      ],
    });
    try {
      await service.create(twoItemDto as any, user);
      fail('expected to throw');
    } catch (e: any) {
      expect(e.message).toContain('PCB-01');
      expect(e.message).not.toContain('DRIVER-01: 0');
    }
  });

  it('does not block an unrelated material when only a different material is PENDING', async () => {
    materialReturnService.getPreviousMaterialStatus.mockResolvedValue({
      overallStatus: 'PENDING',
      items: [{ itemCode: 'PCB-01', outstandingQty: 30, uom: 'PCS', status: 'PENDING' }],
    });
    const r = await service.create(dto as any, user);
    expect(r.id).toBe('pi-1');
  });

  it('blocks the issue if the reserved qty for this WO/item is less than the requested issue qty', async () => {
    prisma.materialReservation.aggregate.mockResolvedValue({ _sum: { reservedQty: 400, issuedQty: 0 } });
    await expect(service.create(dto as any, user)).rejects.toThrow(/exceeds the remaining reserved qty/);
  });

  it('allows the issue when it is within the remaining reserved qty', async () => {
    prisma.materialReservation.aggregate.mockResolvedValue({ _sum: { reservedQty: 500, issuedQty: 0 } });
    const r = await service.create(dto as any, user);
    expect(r.id).toBe('pi-1');
  });

  it('accounts for already-issued qty against the reservation when checking remaining capacity', async () => {
    prisma.materialReservation.aggregate.mockResolvedValue({ _sum: { reservedQty: 500, issuedQty: 200 } });
    await expect(service.create(dto as any, user)).rejects.toThrow(/exceeds the remaining reserved qty/);
  });

  it('does not require a reservation at all for a material with none (e.g. not on the BOM)', async () => {
    prisma.materialReservation.aggregate.mockResolvedValue({ _sum: { reservedQty: null, issuedQty: null } });
    const r = await service.create(dto as any, user);
    expect(r.id).toBe('pi-1');
  });
});

describe('ProductionIssueService.confirm - STORE-011 reserved-and-available move together on actual physical issue', () => {
  let service: ProductionIssueService;
  let prisma: any;
  let stockLedger: any;
  let materialReservation: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      productionIssue: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'pi-1', companyId: 'company-1', status: 'DRAFT', warehouseId: 'wh-1', issueNumber: 'PI-2026-0001', workOrderId: 'wo-1',
          items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', issuedQty: 300, unitCost: 0, batchId: null }],
        }),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'pi-1', ...data })),
      },
      stockBalance: {
        findFirst: jest.fn().mockResolvedValue({ id: 'bal-1', availableQty: 1300, reservedQty: 1200 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    stockLedger = { postTransaction: jest.fn().mockResolvedValue({}) };
    materialReservation = { recordIssueAgainstReservations: jest.fn().mockResolvedValue(0) };
    service = new ProductionIssueService(
      prisma, { log: jest.fn().mockResolvedValue(undefined) } as any, stockLedger,
      {} as any, {} as any, {} as any, materialReservation, {} as any,
    );
  });

  it('decrements StockBalance.reservedQty by the issued qty, capped at what is actually reserved', async () => {
    await service.confirm('pi-1', user);
    expect(prisma.stockBalance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { reservedQty: { decrement: 300 } } }),
    );
  });

  it('caps the reservedQty decrement so an over-issue never drives it negative', async () => {
    prisma.stockBalance.findFirst.mockResolvedValue({ id: 'bal-1', availableQty: 1300, reservedQty: 100 });
    await service.confirm('pi-1', user);
    expect(prisma.stockBalance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { reservedQty: { decrement: 100 } } }),
    );
  });

  it('allocates the issued qty against this Work Order own active reservations', async () => {
    await service.confirm('pi-1', user);
    expect(materialReservation.recordIssueAgainstReservations).toHaveBeenCalledWith('wo-1', 'DRIVER-01', 300, user);
  });

  it('still posts the ISSUE ledger entry that decrements availableQty (existing behavior preserved)', async () => {
    await service.confirm('pi-1', user);
    expect(stockLedger.postTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ transactionType: 'ISSUE', outQty: 300 }),
    );
  });
});

describe('ProductionIssueService.create - STORE-013 original vs additional demand', () => {
  let service: ProductionIssueService;
  let prisma: any;
  let materialReturnService: any;
  let additionalMaterialRequest: any;
  const user = { id: 'user-1', companyId: 'company-1' };
  const wo = { id: 'wo-1', companyId: 'company-1', status: 'RELEASED' };

  function makeDto(issuedQty: number) {
    return { workOrderId: 'wo-1', warehouseId: 'wh-1', items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', requiredQty: issuedQty, issuedQty, unitCost: 0 }], issueMethod: 'FIFO' };
  }

  beforeEach(() => {
    prisma = {
      workOrder: { findFirst: jest.fn().mockResolvedValue(wo), update: jest.fn().mockResolvedValue(wo) },
      productionIssue: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'pi-1', ...data, items: data.items?.create || [] })),
      },
      materialReservation: { aggregate: jest.fn().mockResolvedValue({ _sum: { reservedQty: 0, issuedQty: 0 } }) },
    };
    materialReturnService = { getPreviousMaterialStatus: jest.fn().mockResolvedValue({ overallStatus: 'CLEAR', items: [] }) };
    additionalMaterialRequest = {
      getOriginalRemaining: jest.fn().mockResolvedValue({ originalRequirement: 1000, totalIssued: 600, originalRemaining: 400 }),
      findActiveApprovedRequest: jest.fn().mockResolvedValue(null),
      consume: jest.fn().mockResolvedValue(0),
    };
    service = new ProductionIssueService(
      prisma, { log: jest.fn().mockResolvedValue(undefined) } as any, { postTransaction: jest.fn() } as any,
      {} as any, materialReturnService, { findActiveApprovedOverride: jest.fn().mockResolvedValue(null), consume: jest.fn() } as any,
      { recordIssueAgainstReservations: jest.fn() } as any, additionalMaterialRequest,
    );
  });

  it('allows a normal partial issue fully within the original remaining requirement, no additional approval needed', async () => {
    const r = await service.create(makeDto(300) as any, user);
    expect(r.id).toBe('pi-1');
    expect(additionalMaterialRequest.findActiveApprovedRequest).not.toHaveBeenCalled();
  });

  it('allows the exact remaining original qty (400) with no additional approval', async () => {
    const r = await service.create(makeDto(400) as any, user);
    expect(r.id).toBe('pi-1');
  });

  it('blocks any qty over the original remaining requirement without an approved additional request', async () => {
    await expect(service.create(makeDto(500) as any, user)).rejects.toThrow(/Additional material approval required for 100/);
  });

  it('allows the over-requirement portion when a sufficient approved additional request exists', async () => {
    additionalMaterialRequest.findActiveApprovedRequest.mockResolvedValue({ id: 'amr-1', approvedQty: 150, usedQty: 0 });
    additionalMaterialRequest.consume.mockResolvedValue(100);
    const r = await service.create(makeDto(500) as any, user);
    expect(r.id).toBe('pi-1');
    expect(additionalMaterialRequest.consume).toHaveBeenCalledWith('amr-1', 'pi-1', 100, user);
  });

  it('blocks when the approved additional request does not have enough remaining capacity for the extra portion', async () => {
    additionalMaterialRequest.findActiveApprovedRequest.mockResolvedValue({ id: 'amr-1', approvedQty: 150, usedQty: 100 });
    // Remaining approved capacity is 50, but extra portion needed is 100.
    await expect(service.create(makeDto(500) as any, user)).rejects.toThrow(/Additional material approval required/);
  });

  it('correctly computes the extra portion in a mixed issue (partial original + partial additional)', async () => {
    additionalMaterialRequest.getOriginalRemaining.mockResolvedValue({ originalRequirement: 1000, totalIssued: 950, originalRemaining: 50 });
    additionalMaterialRequest.findActiveApprovedRequest.mockResolvedValue({ id: 'amr-1', approvedQty: 100, usedQty: 0 });
    additionalMaterialRequest.consume.mockResolvedValue(70);
    const r = await service.create(makeDto(120) as any, user);
    expect(r.id).toBe('pi-1');
    // 120 requested, 50 within original -> 70 is the extra portion consumed from the additional approval.
    expect(additionalMaterialRequest.consume).toHaveBeenCalledWith('amr-1', 'pi-1', 70, user);
  });

  it('fails loud if the additional approval capacity changed concurrently and could not fully cover the extra portion', async () => {
    additionalMaterialRequest.findActiveApprovedRequest.mockResolvedValue({ id: 'amr-1', approvedQty: 150, usedQty: 0 });
    additionalMaterialRequest.consume.mockResolvedValue(50); // less than the 100 needed
    await expect(service.create(makeDto(500) as any, user)).rejects.toThrow(/capacity changed concurrently/);
  });
});
