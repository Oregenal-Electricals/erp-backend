import { MaterialHoldDaysService } from './material-hold-days.service';

describe('MaterialHoldDaysService', () => {
  let service: MaterialHoldDaysService;
  let prisma: any;
  const audit = { log: jest.fn() };
  const companyId = 'company-1';
  const rawMaterialId = 'rm-1';
  const vendorId = 'vendor-1';

  beforeEach(() => {
    prisma = {
      materialHoldDaysRule: { findFirst: jest.fn() },
      systemSetting: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    service = new MaterialHoldDaysService(prisma, audit as any);
  });

  describe('resolveHoldDays - most specific rule wins', () => {
    it('uses the material+vendor rule when one exists', async () => {
      prisma.materialHoldDaysRule.findFirst.mockImplementation(({ where }: any) =>
        Promise.resolve(where.vendorId === vendorId ? { id: 'rule-vendor', holdDays: 14 } : null),
      );
      const resolved = await service.resolveHoldDays(companyId, rawMaterialId, vendorId);
      expect(resolved).toEqual({ holdDays: 14, source: 'MATERIAL_VENDOR', ruleId: 'rule-vendor' });
    });

    it('falls back to the material-level default when no vendor-specific rule exists', async () => {
      prisma.materialHoldDaysRule.findFirst.mockImplementation(({ where }: any) =>
        Promise.resolve(where.vendorId === null ? { id: 'rule-default', holdDays: 21 } : null),
      );
      const resolved = await service.resolveHoldDays(companyId, rawMaterialId, vendorId);
      expect(resolved).toEqual({ holdDays: 21, source: 'MATERIAL_DEFAULT', ruleId: 'rule-default' });
    });

    it('falls back to the global SystemSetting default when neither rule exists', async () => {
      prisma.materialHoldDaysRule.findFirst.mockResolvedValue(null);
      prisma.systemSetting.findUnique.mockResolvedValue({ value: '45' });
      const resolved = await service.resolveHoldDays(companyId, rawMaterialId, vendorId);
      expect(resolved).toEqual({ holdDays: 45, source: 'GLOBAL_DEFAULT', ruleId: null });
    });

    it('falls back to the hardcoded 30-day default when the SystemSetting row has never been seeded', async () => {
      prisma.materialHoldDaysRule.findFirst.mockResolvedValue(null);
      prisma.systemSetting.findUnique.mockResolvedValue(null);
      const resolved = await service.resolveHoldDays(companyId, rawMaterialId, vendorId);
      expect(resolved).toEqual({ holdDays: 30, source: 'GLOBAL_DEFAULT', ruleId: null });
    });

    it('skips the vendor lookup entirely when no vendorId is given, going straight to the material default', async () => {
      prisma.materialHoldDaysRule.findFirst.mockResolvedValue({ id: 'rule-default', holdDays: 10 });
      const resolved = await service.resolveHoldDays(companyId, rawMaterialId, null);
      expect(resolved.source).toBe('MATERIAL_DEFAULT');
      // Only the material-default lookup should have run, not a vendor one.
      expect(prisma.materialHoldDaysRule.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('getGlobalDefault', () => {
    it('reports HARDCODED_FALLBACK when the setting is missing', async () => {
      const result = await service.getGlobalDefault();
      expect(result).toEqual({ holdDays: 30, source: 'HARDCODED_FALLBACK' });
    });

    it('reports SYSTEM_SETTING when a valid positive value is configured', async () => {
      prisma.systemSetting.findUnique.mockResolvedValue({ value: '60' });
      const result = await service.getGlobalDefault();
      expect(result).toEqual({ holdDays: 60, source: 'SYSTEM_SETTING' });
    });

    it('ignores a corrupt/non-numeric setting value and falls back', async () => {
      prisma.systemSetting.findUnique.mockResolvedValue({ value: 'not-a-number' });
      const result = await service.getGlobalDefault();
      expect(result).toEqual({ holdDays: 30, source: 'HARDCODED_FALLBACK' });
    });
  });
});
