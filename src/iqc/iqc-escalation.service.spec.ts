import { IqcEscalationService } from './iqc-escalation.service';
import { ForbiddenException } from '@nestjs/common';

describe('IqcEscalationService.submitStageResult - IQC-054 suggestion-only escalation', () => {
  let service: IqcEscalationService;
  let prisma: any;
  let audit: any;
  let notifications: any;
  let rejectedStockSvc: any;
  let stockLedger: any;

  const baseItem = {
    id: 'iqc-item-1',
    iqcId: 'iqc-1',
    itemName: 'LED Driver',
    receivedQty: 100,
    template: null,
    stageResults: [],
    iqc: { iqcNumber: 'IQC-2026-0001', grn: { grnNumber: 'GRN-1', po: null } },
  };

  function userWith(role: string, additionalRoles: string[] = []) {
    return { id: 'u-1', companyId: 'company-1', role, additionalRoles };
  }

  beforeEach(() => {
    prisma = {
      iqcItem: {
        findFirst: jest.fn().mockResolvedValue({ ...baseItem }),
        update: jest.fn().mockResolvedValue({}),
      },
      iqcStageResult: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'sr-1', ...data })),
      },
      iqcInspection: {
        findFirst: jest.fn().mockResolvedValue({ id: 'iqc-1', items: [{ currentStage: 'CLOSED' }] }),
        update: jest.fn().mockResolvedValue({}),
      },
      grnItem: { update: jest.fn().mockResolvedValue({}) },
      grnHeader: { update: jest.fn().mockResolvedValue({}) },
      rejectedStock: { findFirst: jest.fn().mockResolvedValue(null) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    rejectedStockSvc = { createFromIqc: jest.fn().mockResolvedValue({ id: 'rs-1', rejectionNumber: 'RS-1' }) };
    stockLedger = { receiveFromIqc: jest.fn().mockResolvedValue(undefined) };
    service = new IqcEscalationService(prisma, audit, notifications, rejectedStockSvc, stockLedger);
  });

  function setStage(stage: string) {
    prisma.iqcItem.findFirst.mockResolvedValue({ ...baseItem, currentStage: stage });
  }

  it('QUALITY_MANAGER recording PASS does NOT close the item - it is a suggestion that escalates to PLANT_HEAD', async () => {
    setStage('QUALITY_MANAGER');
    await service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'Looks fine, recommend deviation' } as any, userWith('QUALITY_MANAGER'));

    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'iqc-item-1' },
      data: expect.objectContaining({ currentStage: 'PLANT_HEAD' }),
    }));
    // Must never reach the stock-crediting / closing path for a suggestion.
    expect(stockLedger.receiveFromIqc).not.toHaveBeenCalled();
    expect(prisma.iqcItem.update).not.toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ finalOutcome: 'PASS' }),
    }));
  });

  it('QUALITY_MANAGER recording FAIL also only escalates to PLANT_HEAD (unchanged prior behavior)', async () => {
    setStage('QUALITY_MANAGER');
    await service.submitStageResult('iqc-item-1', { outcome: 'FAIL', remarks: 'Recommend reject' } as any, userWith('QC_MANAGER'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'PLANT_HEAD' }),
    }));
  });

  it('PLANT_HEAD recording PASS does NOT close the item - it escalates to FINAL_AUTHORITY instead of granting a deviation', async () => {
    setStage('PLANT_HEAD');
    await service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'Recommend deviation' } as any, userWith('PLANT_MANAGER'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'FINAL_AUTHORITY' }),
    }));
    expect(stockLedger.receiveFromIqc).not.toHaveBeenCalled();
  });

  it('QUALITY_MANAGER (legacy QC_MANAGER role user) cannot act once the item reaches FINAL_AUTHORITY', async () => {
    setStage('FINAL_AUTHORITY');
    await expect(
      service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'try to grant deviation' } as any, userWith('QC_MANAGER')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('PLANT_HEAD (current PLANT_MANAGER role user) cannot act once the item reaches FINAL_AUTHORITY', async () => {
    setStage('FINAL_AUTHORITY');
    await expect(
      service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'try to grant deviation' } as any, userWith('PLANT_MANAGER')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('ADMIN (management tier) at FINAL_AUTHORITY can grant the deviation - PASS actually closes the item and credits stock', async () => {
    setStage('FINAL_AUTHORITY');
    await service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'Deviation granted', acceptedQty: 100, rejectedQty: 0 } as any, userWith('ADMIN'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'CLOSED', finalOutcome: 'PASS' }),
    }));
  });

  it('ADMIN (management tier) at FINAL_AUTHORITY can confirm the fail - FAIL closes the item as rejected, not escalated further', async () => {
    setStage('FINAL_AUTHORITY');
    await service.submitStageResult('iqc-item-1', { outcome: 'FAIL', remarks: 'Fail confirmed, return to vendor', rejectionReason: 'Out of spec' } as any, userWith('ADMIN'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'CLOSED', finalOutcome: 'FAIL' }),
    }));
  });

  it('SUPER_ADMIN is still universally authorized but still only closes once the item is actually at FINAL_AUTHORITY', async () => {
    setStage('QUALITY_MANAGER');
    await service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'super admin acting as QC suggestion' } as any, userWith('SUPER_ADMIN'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'PLANT_HEAD' }),
    }));
  });

  it('the dedicated IQC role can perform the initial inspection stage (additive fix - was previously excluded)', async () => {
    setStage('IQC');
    await service.submitStageResult('iqc-item-1', { outcome: 'FAIL', remarks: 'Fails parameter check', rejectionReason: 'Dimension out of spec' } as any, userWith('IQC'));
    expect(prisma.iqcItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentStage: 'QUALITY_MANAGER' }),
    }));
  });

  it('an unrelated role (e.g. STORE) is forbidden at every stage', async () => {
    setStage('QUALITY_MANAGER');
    await expect(
      service.submitStageResult('iqc-item-1', { outcome: 'PASS', remarks: 'not my call' } as any, userWith('STORE')),
    ).rejects.toThrow(ForbiddenException);
  });
});
