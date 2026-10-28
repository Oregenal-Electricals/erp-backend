import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OqcService } from './oqc.service';

// TASK-060: OQC split into PRE_PACK (full-product: visual/dimensional/
// functional) and POST_PACK (packing-specific: packaging/labelling)
// stages. FG stock must only be credited once BOTH stages have PASSed
// and been RELEASED.
describe('OqcService - TASK-060 pre-pack/post-pack split', () => {
  let service: OqcService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  const fgReceipt = { id: 'fgr-1', companyId: 'company-1', status: 'RECEIVED', itemCode: 'LED-9W', itemName: '9W LED Bulb' };

  const prePackReleased = {
    id: 'oqc-pre-1', companyId: 'company-1', fgReceiptId: 'fgr-1', stage: 'PRE_PACK',
    result: 'PASS', status: 'RELEASED',
  };
  const prePackPending = {
    id: 'oqc-pre-1', companyId: 'company-1', fgReceiptId: 'fgr-1', stage: 'PRE_PACK',
    result: 'PENDING', status: 'PENDING',
  };

  beforeEach(() => {
    prisma = {
      fgReceipt: { findFirst: jest.fn().mockResolvedValue(fgReceipt) },
      oqcInspection: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'oqc-new', ...data })),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'oqc-updated', ...data })),
        aggregate: jest.fn().mockResolvedValue({ _sum: { sampleSize: 0, passQty: 0, failQty: 0 } }),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = { receiveFromOqc: jest.fn().mockResolvedValue({ message: 'ok' }) };
    service = new OqcService(prisma, audit, stockLedger);
  });

  describe('create() - stage dependency', () => {
    it('allows PRE_PACK to be raised directly against a RECEIVED FG Receipt', async () => {
      const result = await service.create({
        stage: 'PRE_PACK', fgReceiptId: 'fgr-1', itemCode: 'LED-9W', itemName: '9W LED Bulb',
        sampleSize: 10, passQty: 10, failQty: 0, visualCheck: 'PASS',
      } as any, user);
      expect(result.stage).toBe('PRE_PACK');
      expect(result.oqcNumber).toContain('OQC-PRE-');
    });

    it('blocks POST_PACK when no PRE_PACK inspection exists yet for the receipt', async () => {
      prisma.oqcInspection.findFirst.mockResolvedValue(null);
      await expect(
        service.create({ stage: 'POST_PACK', fgReceiptId: 'fgr-1', itemCode: 'LED-9W', itemName: '9W LED Bulb', sampleSize: 10, passQty: 10, failQty: 0 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks POST_PACK when PRE_PACK exists but has not been RELEASED+PASS yet', async () => {
      // First call: no existing POST_PACK duplicate. Second call: the
      // PRE_PACK dependency lookup, still PENDING.
      prisma.oqcInspection.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(prePackPending);
      await expect(
        service.create({ stage: 'POST_PACK', fgReceiptId: 'fgr-1', itemCode: 'LED-9W', itemName: '9W LED Bulb', sampleSize: 10, passQty: 10, failQty: 0 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows POST_PACK once PRE_PACK is RELEASED with a PASS result', async () => {
      // First findFirst call: duplicate-existing check for this stage -> none.
      // Second findFirst call: the PRE_PACK dependency lookup -> released+pass.
      prisma.oqcInspection.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(prePackReleased);
      const result = await service.create({
        stage: 'POST_PACK', fgReceiptId: 'fgr-1', itemCode: 'LED-9W', itemName: '9W LED Bulb',
        sampleSize: 10, passQty: 10, failQty: 0, packagingCheck: 'PASS', labellingCheck: 'PASS',
      } as any, user);
      expect(result.stage).toBe('POST_PACK');
      expect(result.oqcNumber).toContain('OQC-POST-');
    });

    it('rejects a duplicate inspection for a stage that already exists on this receipt', async () => {
      prisma.oqcInspection.findFirst.mockResolvedValue({ ...prePackReleased, oqcNumber: 'OQC-PRE-2026-0001' });
      await expect(
        service.create({ stage: 'PRE_PACK', fgReceiptId: 'fgr-1', itemCode: 'LED-9W', itemName: '9W LED Bulb', sampleSize: 10, passQty: 10, failQty: 0 } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create() - stage-appropriate checklist fields', () => {
    it('rejects packagingCheck/labellingCheck on a PRE_PACK inspection', async () => {
      await expect(
        service.create({ stage: 'PRE_PACK', fgReceiptId: 'fgr-1', itemCode: 'LED-9W', itemName: '9W LED Bulb', sampleSize: 10, passQty: 10, failQty: 0, packagingCheck: 'PASS' } as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects visualCheck/dimensionalCheck/functionalCheck on a POST_PACK inspection', async () => {
      prisma.oqcInspection.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(prePackReleased);
      await expect(
        service.create({ stage: 'POST_PACK', fgReceiptId: 'fgr-1', itemCode: 'LED-9W', itemName: '9W LED Bulb', sampleSize: 10, passQty: 10, failQty: 0, visualCheck: 'PASS' } as any, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('release() - FG stock is only credited once BOTH stages have passed', () => {
    it('releases PRE_PACK without crediting any FG stock', async () => {
      prisma.oqcInspection.findFirst.mockResolvedValue({ id: 'oqc-pre-1', companyId: 'company-1', stage: 'PRE_PACK', result: 'PASS', status: 'COMPLETED', fgReceiptId: 'fgr-1' });
      await service.release('oqc-pre-1', user);
      expect(stockLedger.receiveFromOqc).not.toHaveBeenCalled();
    });

    it('releases POST_PACK and credits FG stock once its PRE_PACK sibling is RELEASED+PASS', async () => {
      prisma.oqcInspection.findFirst
        .mockResolvedValueOnce({ id: 'oqc-post-1', companyId: 'company-1', stage: 'POST_PACK', result: 'PASS', status: 'COMPLETED', fgReceiptId: 'fgr-1' })
        .mockResolvedValueOnce(prePackReleased);
      await service.release('oqc-post-1', user);
      expect(stockLedger.receiveFromOqc).toHaveBeenCalledWith('oqc-post-1', user);
    });

    // Regression guard: without this check, releasing POST_PACK alone
    // (e.g. PRE_PACK still PENDING, never actually RELEASED) would have
    // credited FG stock off a single stage - exactly the bug this split
    // must not allow. This is the "only checked one stage" regression
    // this test suite exists to catch.
    it('blocks POST_PACK release (and therefore stock crediting) when PRE_PACK has not actually been RELEASED+PASS', async () => {
      prisma.oqcInspection.findFirst
        .mockResolvedValueOnce({ id: 'oqc-post-1', companyId: 'company-1', stage: 'POST_PACK', result: 'PASS', status: 'COMPLETED', fgReceiptId: 'fgr-1' })
        .mockResolvedValueOnce(prePackPending);
      await expect(service.release('oqc-post-1', user)).rejects.toThrow(BadRequestException);
      expect(stockLedger.receiveFromOqc).not.toHaveBeenCalled();
    });

    it('blocks POST_PACK release when no PRE_PACK record exists at all for the receipt', async () => {
      prisma.oqcInspection.findFirst
        .mockResolvedValueOnce({ id: 'oqc-post-1', companyId: 'company-1', stage: 'POST_PACK', result: 'PASS', status: 'COMPLETED', fgReceiptId: 'fgr-1' })
        .mockResolvedValueOnce(null);
      await expect(service.release('oqc-post-1', user)).rejects.toThrow(BadRequestException);
      expect(stockLedger.receiveFromOqc).not.toHaveBeenCalled();
    });

    it('still enforces the pre-existing PASS/COMPLETED requirements regardless of stage', async () => {
      prisma.oqcInspection.findFirst.mockResolvedValue({ id: 'oqc-pre-1', companyId: 'company-1', stage: 'PRE_PACK', result: 'FAIL', status: 'COMPLETED', fgReceiptId: 'fgr-1' });
      await expect(service.release('oqc-pre-1', user)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for a nonexistent OQC record', async () => {
      prisma.oqcInspection.findFirst.mockResolvedValue(null);
      await expect(service.release('oqc-missing', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('isDispatchReady() - the explicit two-gate check', () => {
    it('is false when only PRE_PACK has passed', async () => {
      prisma.oqcInspection.findMany.mockResolvedValue([prePackReleased]);
      const result = await service.isDispatchReady('fgr-1', user);
      expect(result.prePackPassed).toBe(true);
      expect(result.postPackPassed).toBe(false);
      expect(result.dispatchReady).toBe(false);
    });

    it('is false when only POST_PACK somehow passed without PRE_PACK (defensive - should never occur given release() guards)', async () => {
      const postPackReleased = { id: 'oqc-post-1', fgReceiptId: 'fgr-1', stage: 'POST_PACK', result: 'PASS', status: 'RELEASED' };
      prisma.oqcInspection.findMany.mockResolvedValue([postPackReleased]);
      const result = await service.isDispatchReady('fgr-1', user);
      expect(result.prePackPassed).toBe(false);
      expect(result.dispatchReady).toBe(false);
    });

    it('is true only once both PRE_PACK and POST_PACK are RELEASED with a PASS result', async () => {
      const postPackReleased = { id: 'oqc-post-1', fgReceiptId: 'fgr-1', stage: 'POST_PACK', result: 'PASS', status: 'RELEASED' };
      prisma.oqcInspection.findMany.mockResolvedValue([prePackReleased, postPackReleased]);
      const result = await service.isDispatchReady('fgr-1', user);
      expect(result.prePackPassed).toBe(true);
      expect(result.postPackPassed).toBe(true);
      expect(result.dispatchReady).toBe(true);
    });

    it('is false when neither stage has been raised yet', async () => {
      prisma.oqcInspection.findMany.mockResolvedValue([]);
      const result = await service.isDispatchReady('fgr-1', user);
      expect(result.dispatchReady).toBe(false);
    });
  });

  describe('getPendingFgReceipts() - next-action stage per receipt', () => {
    it('tags a receipt with no OQC yet as needing PRE_PACK', async () => {
      prisma.fgReceipt.findMany = jest.fn().mockResolvedValue([{ id: 'fgr-1' }]);
      prisma.oqcInspection.findMany.mockResolvedValue([]);
      const result = await service.getPendingFgReceipts(user);
      expect(result.data[0].nextStage).toBe('PRE_PACK');
    });

    it('tags a receipt whose PRE_PACK passed and has no POST_PACK yet as needing POST_PACK', async () => {
      prisma.fgReceipt.findMany = jest.fn().mockResolvedValue([{ id: 'fgr-1' }]);
      prisma.oqcInspection.findMany.mockResolvedValue([prePackReleased]);
      const result = await service.getPendingFgReceipts(user);
      expect(result.data[0].nextStage).toBe('POST_PACK');
    });

    it('omits a receipt whose PRE_PACK is still pending (nothing new to create yet)', async () => {
      prisma.fgReceipt.findMany = jest.fn().mockResolvedValue([{ id: 'fgr-1' }]);
      prisma.oqcInspection.findMany.mockResolvedValue([prePackPending]);
      const result = await service.getPendingFgReceipts(user);
      expect(result.data).toHaveLength(0);
    });

    it('omits a receipt where both stages already exist', async () => {
      const postPackReleased = { id: 'oqc-post-1', fgReceiptId: 'fgr-1', stage: 'POST_PACK', result: 'PASS', status: 'RELEASED' };
      prisma.fgReceipt.findMany = jest.fn().mockResolvedValue([{ id: 'fgr-1' }]);
      prisma.oqcInspection.findMany.mockResolvedValue([prePackReleased, postPackReleased]);
      const result = await service.getPendingFgReceipts(user);
      expect(result.data).toHaveLength(0);
    });
  });
});
