import { ProductService } from './product.service';
import { ConflictException, ForbiddenException } from '@nestjs/common';

describe('ProductService - create() auto-submits into the generic approval workflow; onWorkflowApproved/onWorkflowRejected sync the outcome back', () => {
  let service: ProductService;
  let prisma: any;
  let workflows: any;
  const user = { id: 'user-1', companyId: 'company-1', role: 'RND' };

  beforeEach(() => {
    prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      role: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    workflows = { submit: jest.fn().mockResolvedValue({ requiresApproval: true }) };
    service = new ProductService(prisma, { log: jest.fn() } as any, workflows);
  });

  it('blocks creating a product whose code already exists for this company', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.create({ code: 'LED9W', name: 'LED Bulb' } as any, user)).rejects.toThrow(ConflictException);
  });

  it('CRITICAL: create() starts the product as DRAFT, then immediately submits it for approval and moves it to PENDING_APPROVAL - a new product is never immediately usable', async () => {
    prisma.product.create.mockResolvedValue({ id: 'product-1', code: 'LED9W', status: 'DRAFT' });
    prisma.product.update.mockResolvedValue({ id: 'product-1', code: 'LED9W', status: 'PENDING_APPROVAL' });
    const result = await service.create({ code: 'led9w', name: 'LED Bulb' } as any, user);
    expect(prisma.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'DRAFT' }),
    }));
    expect(workflows.submit).toHaveBeenCalledWith(
      expect.objectContaining({ documentType: 'PRODUCT', documentId: 'product-1', documentNumber: 'LED9W' }),
      user,
    );
    expect(result.status).toBe('PENDING_APPROVAL');
  });

  it('CRITICAL: onWorkflowApproved() marks the product APPROVED - only called by the workflow engine after all configured levels pass', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'product-1', status: 'PENDING_APPROVAL' });
    prisma.product.update.mockResolvedValue({ id: 'product-1', status: 'APPROVED' });
    const result = await service.onWorkflowApproved('product-1', user);
    expect(prisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'product-1' },
      data: expect.objectContaining({ status: 'APPROVED', approvedBy: user.id }),
    }));
    expect(result.status).toBe('APPROVED');
  });

  it('CRITICAL: onWorkflowRejected() marks the product REJECTED, never APPROVED', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'product-1', status: 'PENDING_APPROVAL' });
    prisma.product.update.mockResolvedValue({ id: 'product-1', status: 'REJECTED' });
    const result = await service.onWorkflowRejected('product-1', user);
    expect(result.status).toBe('REJECTED');
  });

  it('onWorkflowApproved() on a product that no longer exists is a safe no-op, not a crash', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(service.onWorkflowApproved('gone', user)).resolves.toBeUndefined();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});

describe('ProductService - hourlyTarget/dailyTarget are management-only, gated by PRODUCTION_TARGET_MANAGE', () => {
  let service: ProductService;
  let prisma: any;
  let workflows: any;
  const user = { id: 'user-1', companyId: 'company-1', role: 'RND' };

  beforeEach(() => {
    prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn().mockResolvedValue({ id: 'product-1', code: 'LED9W' }),
      },
      role: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    workflows = { submit: jest.fn().mockResolvedValue({ requiresApproval: true }) };
    service = new ProductService(prisma, { log: jest.fn() } as any, workflows);
  });

  it('CRITICAL: update() blocks a caller with no PRODUCTION_TARGET_MANAGE from setting hourlyTarget', async () => {
    prisma.role.findMany.mockResolvedValue([{ permissions: [] }]);
    await expect(
      service.update('product-1', { hourlyTarget: 120 } as any, user),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('CRITICAL: update() blocks a caller with no PRODUCTION_TARGET_MANAGE from setting dailyTarget', async () => {
    prisma.role.findMany.mockResolvedValue([{ permissions: [] }]);
    await expect(
      service.update('product-1', { dailyTarget: 960 } as any, user),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('lets a caller with PRODUCTION_TARGET_MANAGE set and read back hourlyTarget/dailyTarget', async () => {
    prisma.role.findMany.mockResolvedValue([{ permissions: [{ permission: 'PRODUCTION_TARGET_MANAGE' }] }]);
    prisma.product.update.mockResolvedValue({
      id: 'product-1', code: 'LED9W', hourlyTarget: 120, dailyTarget: 960,
    });
    const result = await service.update('product-1', { hourlyTarget: 120, dailyTarget: 960 } as any, user);
    expect(prisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'product-1' },
      data: expect.objectContaining({ hourlyTarget: 120, dailyTarget: 960 }),
    }));
    expect(result.hourlyTarget).toBe(120);
    expect(result.dailyTarget).toBe(960);
  });

  it('SUPER_ADMIN always passes the target gate, without a role lookup matching a granted permission', async () => {
    const superAdmin = { id: 'user-2', companyId: 'company-1', role: 'SUPER_ADMIN' };
    prisma.product.update.mockResolvedValue({ id: 'product-1', hourlyTarget: 50 });
    await expect(
      service.update('product-1', { hourlyTarget: 50 } as any, superAdmin),
    ).resolves.toEqual(expect.objectContaining({ hourlyTarget: 50 }));
  });

  it('does not touch the permission lookup at all when neither target field is in the payload', async () => {
    prisma.product.update.mockResolvedValue({ id: 'product-1', name: 'LED Bulb Updated' });
    await service.update('product-1', { name: 'LED Bulb Updated' } as any, user);
    expect(prisma.role.findMany).not.toHaveBeenCalled();
  });

  it('CRITICAL: create() also blocks setting hourlyTarget/dailyTarget without PRODUCTION_TARGET_MANAGE', async () => {
    prisma.role.findMany.mockResolvedValue([{ permissions: [] }]);
    await expect(
      service.create({ code: 'led9w', name: 'LED Bulb', hourlyTarget: 100 } as any, user),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });
});
