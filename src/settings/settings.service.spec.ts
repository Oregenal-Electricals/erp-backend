import { SettingsService } from './settings.service';

describe('SettingsService - WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE (SO material-completeness gate setting)', () => {
  let service: SettingsService;
  let prisma: any;
  let audit: any;
  const userId = 'user-1';

  beforeEach(() => {
    prisma = {
      systemSetting: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new SettingsService(prisma, audit);
  });

  describe('read path - default OFF when never configured', () => {
    it('getSettingValue returns the supplied default ("false") when the key has never been seeded/set', async () => {
      prisma.systemSetting.findUnique.mockResolvedValue(null);
      const value = await service.getSettingValue('WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE', 'false');
      expect(value).toBe('false');
    });

    it('getSettingValue returns the persisted value once the migration-seeded row exists', async () => {
      prisma.systemSetting.findUnique.mockResolvedValue({ key: 'WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE', value: 'false' });
      const value = await service.getSettingValue('WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE', 'false');
      expect(value).toBe('false');
    });
  });

  describe('write path - explicit opt-in', () => {
    it('updateSetting persists an explicit "true" value and records an audit entry', async () => {
      const existing = { id: 'setting-1', key: 'WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE', value: 'false' };
      prisma.systemSetting.findUnique.mockResolvedValue(existing);
      prisma.systemSetting.update.mockResolvedValue({ ...existing, value: 'true', updatedBy: userId });

      const result = await service.updateSetting('WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE', { value: 'true' }, userId);

      expect(prisma.systemSetting.update).toHaveBeenCalledWith({
        where: { key: 'WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE' },
        data: { value: 'true', description: undefined, updatedBy: userId },
      });
      expect(result.value).toBe('true');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'system_settings',
          action: 'UPDATE',
          oldValues: { key: 'WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE', value: 'false' },
          newValues: { key: 'WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE', value: 'true' },
          changedBy: userId,
        }),
      );
    });

    it('creates the setting row on first write if the migration seed has not run yet', async () => {
      prisma.systemSetting.findUnique.mockResolvedValue(null);
      prisma.systemSetting.create.mockResolvedValue({ id: 'setting-2', key: 'WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE', value: 'true' });

      const result = await service.updateSetting('WO_BLOCK_START_ON_SO_MATERIAL_INCOMPLETE', { value: 'true' }, userId);

      expect(prisma.systemSetting.create).toHaveBeenCalled();
      expect(result.value).toBe('true');
    });
  });
});

describe('SettingsController - permission gating on the generic settings read/write routes', () => {
  it('gates the system-setting update route (used to flip this gate) behind SETTINGS_MANAGE', () => {
    const source = require('fs').readFileSync(require.resolve('./settings.controller.ts'), 'utf8');
    const idx = source.indexOf("@Put('system/:key')");
    expect(idx).toBeGreaterThan(-1);
    const section = source.slice(idx, idx + 200);
    expect(section).toContain('@RequirePermissions(Permission.SETTINGS_MANAGE)');
  });

  it('gates the system-setting read route behind SETTINGS_VIEW, not SETTINGS_MANAGE', () => {
    const source = require('fs').readFileSync(require.resolve('./settings.controller.ts'), 'utf8');
    const idx = source.indexOf("@Get('system/:key')");
    expect(idx).toBeGreaterThan(-1);
    const section = source.slice(idx, idx + 200);
    expect(section).toContain('@RequirePermissions(Permission.SETTINGS_VIEW)');
  });

  it('every settings route is behind JwtAuthGuard and PermissionsGuard', () => {
    const source = require('fs').readFileSync(require.resolve('./settings.controller.ts'), 'utf8');
    expect(source).toContain('@UseGuards(JwtAuthGuard, PermissionsGuard)');
  });
});
