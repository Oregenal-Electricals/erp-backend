import { DispatchGateOutService } from './dispatch-gate-out.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DispatchGateOutService - DSP-013', () => {
  let service: DispatchGateOutService;
  let prisma: any;
  let audit: any;
  let readiness: any;
  let stockLedger: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function baseConfirmation(overrides: any = {}) {
    return {
      id: 'dc-1', status: 'READY_FOR_GATE_OUT', dispatchPlanId: 'plan-1', soId: 'so-1', customerName: 'ABC Corp',
      transportAssignmentId: 'ta-1', transportAssignment: { vehicleNumber: 'HR55AB1234' },
      items: [{ isActive: true, status: 'CONFIRMED', packageId: 'pkg-1' }],
      ...overrides,
    };
  }

  function rmPackage() {
    return {
      id: 'pkg-1', packageNumber: 'PKG-000001', status: 'ACTIVE', isActive: true,
      items: [{ verificationItemId: 'dvi-1', packedQty: 100, reversedQty: 0 }],
    };
  }

  beforeEach(() => {
    prisma = {
      dispatchGateOut: {
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'go-1', ...data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'go-1', gateOutNumber: 'GO-2026-0001' }),
      },
      dispatchConfirmation: {
        findFirst: jest.fn().mockResolvedValue(baseConfirmation()),
        update: jest.fn().mockResolvedValue({}),
      },
      dispatchPackage: {
        findMany: jest.fn().mockResolvedValue([rmPackage()]),
      },
      dispatchVerificationItem: { findUnique: jest.fn().mockResolvedValue({ pickListItemId: 'pli-1', saleType: 'RM', itemCode: 'ITM-001', itemName: 'LED Driver' }) },
      pickListItem: { findUnique: jest.fn().mockResolvedValue({ batchId: 'batch-1', dispatchReservationId: 'res-1', soItemId: 'soi-1' }) },
      stockBatch: { findUnique: jest.fn().mockResolvedValue({ status: 'ACTIVE', warehouseId: 'wh-1' }) },
      stockBalance: { findFirst: jest.fn().mockResolvedValue({ unitCost: 10, warehouseId: 'wh-1' }) },
      salesOrderItem: { findUnique: jest.fn().mockResolvedValue({ id: 'soi-1', qty: 500, dispatchedQty: 0, pendingQty: 500 }), update: jest.fn().mockResolvedValue({}) },
      dispatchReservation: { findUnique: jest.fn().mockResolvedValue({ id: 'res-1', reservedQty: 100, releasedQty: 0, workOrderId: null }), update: jest.fn().mockResolvedValue({}) },
      workOrder: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      dispatchGateOutItem: { create: jest.fn().mockResolvedValue({ id: 'dgoi-1' }) },
      salesOrder: { findFirst: jest.fn().mockResolvedValue({ id: 'so-1', items: [{ pendingQty: 400 }] }), update: jest.fn().mockResolvedValue({}) },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    readiness = { checkReadiness: jest.fn().mockResolvedValue({ overall: 'DOCUMENTS_READY' }) };
    stockLedger = { postTransaction: jest.fn().mockResolvedValue({}) };
    service = new DispatchGateOutService(prisma, audit, readiness, stockLedger);
  });

  it('IDEMPOTENCY TEST (section 51-52): a retried request for an already-Gated-Out confirmation returns the existing event, never creates a second one', async () => {
    prisma.dispatchGateOut.findUnique.mockResolvedValue({ id: 'go-existing', gateOutNumber: 'GO-2026-0001' });
    const result = await service.confirmGateOut('dc-1', undefined, user);
    expect(result.id).toBe('go-existing');
    expect(prisma.dispatchGateOut.create).not.toHaveBeenCalled();
  });

  it('blocks Gate-Out when the Confirmation is not READY_FOR_GATE_OUT', async () => {
    prisma.dispatchConfirmation.findFirst.mockResolvedValue(baseConfirmation({ status: 'PARTIALLY_CONFIRMED' }));
    await expect(service.confirmGateOut('dc-1', undefined, user)).rejects.toThrow(/not READY FOR GATE-OUT/);
  });

  it('CRITICAL WRONG VEHICLE PROOF (section 9-10): blocks Gate-Out when actual vehicle does not match', async () => {
    await expect(service.confirmGateOut('dc-1', 'HR55ZZ9999', user)).rejects.toThrow(/Vehicle mismatch/);
  });

  it('CRITICAL DOCUMENT REVALIDATION PROOF (section 43-44): blocks Gate-Out when documents are no longer ready, never trusting the DSP-012 snapshot', async () => {
    readiness.checkReadiness.mockResolvedValue({ overall: 'BLOCKED' });
    await expect(service.confirmGateOut('dc-1', undefined, user)).rejects.toThrow(/commercial documents are BLOCKED/);
  });

  it('MANDATORY: a Quality Hold placed after DSP-012 confirmation blocks the entire Gate-Out (section 46-47)', async () => {
    prisma.stockBatch.findUnique.mockResolvedValue({ status: 'QUARANTINED', warehouseId: 'wh-1' });
    await expect(service.confirmGateOut('dc-1', undefined, user)).rejects.toThrow(/package quality is QUALITY_HOLD/);
  });

  it('CRITICAL RM PROOF: successful Gate-Out posts the exact quantity through the authoritative StockLedgerService.postTransaction() - the same mechanism the pre-existing Dispatch module uses', async () => {
    await service.confirmGateOut('dc-1', 'HR55AB1234', user);
    expect(stockLedger.postTransaction).toHaveBeenCalledWith(expect.objectContaining({
      itemCode: 'ITM-001', warehouseId: 'wh-1', transactionType: 'ISSUE', outQty: 100,
    }));
  });

  it('REGRESSION GUARD (live UAT finding): a non-batch-tracked RM item still posts through the stock ledger via the itemCode-only fallback - matching the pre-existing dispatch.service.ts convention exactly, rather than silently skipping the physical deduction', async () => {
    prisma.pickListItem.findUnique.mockResolvedValue({ batchId: null, dispatchReservationId: 'res-1', soItemId: 'soi-1' });
    await service.confirmGateOut('dc-1', undefined, user);
    expect(stockLedger.postTransaction).toHaveBeenCalledWith(expect.objectContaining({
      itemCode: 'ITM-001', transactionType: 'ISSUE', outQty: 100,
    }));
  });

  it('CRITICAL SFG PROOF: SFG packages permanently decrement WorkOrder.dispatchReservedQty instead of posting to StockBalance - never returns to Production, never becomes FG', async () => {
    prisma.pickListItem.findUnique.mockResolvedValue({ batchId: null, dispatchReservationId: 'res-1', soItemId: 'soi-1' });
    prisma.dispatchVerificationItem.findUnique.mockResolvedValue({ pickListItemId: 'pli-1', saleType: 'SFG', itemCode: 'SFG-001', itemName: '9W LED Bulb' });
    prisma.dispatchReservation.findUnique.mockResolvedValue({ id: 'res-1', reservedQty: 100, releasedQty: 0, workOrderId: 'wo-1' });
    prisma.workOrder.findUnique.mockResolvedValue({ stageStatus: 'ACTIVE' });
    await service.confirmGateOut('dc-1', undefined, user);
    expect(prisma.workOrder.update).toHaveBeenCalledWith({ where: { id: 'wo-1' }, data: { dispatchReservedQty: { decrement: 100 } } });
    expect(stockLedger.postTransaction).not.toHaveBeenCalled();
  });

  it('CRITICAL SALES DISPATCH PROOF (section 35-38): SalesOrderItem.dispatchedQty/pendingQty are updated line-wise only on successful Gate-Out', async () => {
    await service.confirmGateOut('dc-1', undefined, user);
    expect(prisma.salesOrderItem.update).toHaveBeenCalledWith({ where: { id: 'soi-1' }, data: { dispatchedQty: 100, pendingQty: 400, updatedBy: user.id } });
  });

  it('CRITICAL RESERVATION CONSUMPTION PROOF (section 32-34, 66): reservation is FULFILLED (consumed), never returned to free stock via RELEASED', async () => {
    await service.confirmGateOut('dc-1', undefined, user);
    expect(prisma.dispatchReservation.update).toHaveBeenCalledWith({ where: { id: 'res-1' }, data: { releasedQty: 100, status: 'FULFILLED' } });
  });

  it('CRITICAL PACKAGE DUPLICATE GATE-OUT PROOF (section 55): the atomic conditional UPDATE blocks a package that has already Gated-Out', async () => {
    prisma.$executeRaw.mockResolvedValue(0);
    await expect(service.confirmGateOut('dc-1', undefined, user)).rejects.toThrow(/already been Gated-Out/);
  });

  it('marks the Dispatch Confirmation GATED_OUT to block any further DSP-012 reversal (section 65)', async () => {
    await service.confirmGateOut('dc-1', undefined, user);
    expect(prisma.dispatchConfirmation.update).toHaveBeenCalledWith({ where: { id: 'dc-1' }, data: { status: 'GATED_OUT', updatedBy: user.id } });
  });

  it('PARTIAL SALES ORDER TEST (section 40): SO rolls up to PARTIALLY_DISPATCHED when other lines remain pending', async () => {
    await service.confirmGateOut('dc-1', undefined, user);
    expect(prisma.salesOrder.update).toHaveBeenCalledWith({ where: { id: 'so-1' }, data: { status: 'PARTIALLY_DISPATCHED', updatedBy: user.id } });
  });

  it('FULL SALES ORDER TEST (section 41): SO rolls up to DISPATCHED once every line has pendingQty <= 0', async () => {
    prisma.salesOrder.findFirst.mockResolvedValue({ id: 'so-1', items: [{ pendingQty: 0 }] });
    await service.confirmGateOut('dc-1', undefined, user);
    expect(prisma.salesOrder.update).toHaveBeenCalledWith({ where: { id: 'so-1' }, data: { status: 'DISPATCHED', updatedBy: user.id } });
  });
});
