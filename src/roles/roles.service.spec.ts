import { RolesService } from './roles.service';
import { NotFoundException } from '@nestjs/common';

describe('RolesService - protected-role visibility (Super Admin is invisible to non-Super-Admins)', () => {
  let service: RolesService;
  let prisma: any;
  const admin = { id: 'admin-1', companyId: 'co-1', role: 'ADMIN' };
  const superAdmin = { id: 'sa-1', companyId: 'co-1', role: 'SUPER_ADMIN' };

  beforeEach(() => {
    prisma = {
      role: { findMany: jest.fn(), findFirst: jest.fn() },
      user: { count: jest.fn().mockResolvedValue(0), groupBy: jest.fn().mockResolvedValue([]) },
    };
    service = new RolesService(prisma as any, { log: jest.fn() } as any);
  });

  it('CRITICAL: findAll() filters isProtected=false into the query for a non-SUPER_ADMIN caller', async () => {
    prisma.role.findMany.mockResolvedValue([]);
    await service.findAll(admin);
    expect(prisma.role.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ isProtected: false }),
    }));
  });

  it('findAll() does NOT filter by isProtected for SUPER_ADMIN - sees every role including protected ones', async () => {
    prisma.role.findMany.mockResolvedValue([]);
    await service.findAll(superAdmin);
    const calledWhere = prisma.role.findMany.mock.calls[0][0].where;
    expect(calledWhere.isProtected).toBeUndefined();
  });

  it('CRITICAL: findOne() on a protected role throws NotFoundException (not Forbidden) for a non-SUPER_ADMIN caller - the role appears not to exist at all, not merely off-limits', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 'role-1', name: 'SUPER_ADMIN', label: 'Super Admin', isProtected: true, permissions: [] });
    await expect(service.findOne('role-1', admin)).rejects.toThrow(NotFoundException);
  });

  it('findOne() on a protected role succeeds for SUPER_ADMIN', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 'role-1', name: 'SUPER_ADMIN', label: 'Super Admin', isProtected: true, permissions: [] });
    const result = await service.findOne('role-1', superAdmin);
    expect(result.name).toBe('SUPER_ADMIN');
  });

  it('findOne() on a non-protected role succeeds for a non-SUPER_ADMIN caller as before', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 'role-2', name: 'QUALITY_MANAGER', label: 'Quality Manager', isProtected: false, permissions: [] });
    const result = await service.findOne('role-2', admin);
    expect(result.name).toBe('QUALITY_MANAGER');
  });
});
