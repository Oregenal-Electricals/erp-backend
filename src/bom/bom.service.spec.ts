import { BomService } from './bom.service';
import { BadRequestException } from '@nestjs/common';

describe('BomService - submitForApproval / onWorkflowApproved / onWorkflowRejected (generic workflow engine replaces the old fixed Verify->Approve step)', () => {
  let service: BomService;
  let prisma: any;
  let workflows: any;
  const user = { id: 'user-1', companyId: 'company-1', role: 'RND' };

  const draftBom = {
    id: 'bom-1', bomNumber: 'GEN-0001', status: 'DRAFT', bomType: 'MASTER', companyId: 'company-1',
    items: [{ id: 'item-1' }],
  };

  beforeEach(() => {
    prisma = {
      bom: {
        findFirst: jest.fn().mockResolvedValue(draftBom),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      bomQuery: { findFirst: jest.fn().mockResolvedValue(null) },
      bomItem: { createMany: jest.fn() },
    };
    workflows = { submit: jest.fn().mockResolvedValue({ requiresApproval: true }) };
    service = new BomService(prisma, { log: jest.fn() } as any, { create: jest.fn() } as any, workflows);
  });

  it('submitForApproval() only accepts a DRAFT BOM', async () => {
    prisma.bom.findFirst.mockResolvedValue({ ...draftBom, status: 'PENDING_APPROVAL' });
    await expect(service.submitForApproval('bom-1', user)).rejects.toThrow(BadRequestException);
  });

  it('submitForApproval() blocks a BOM with no items - cannot submit an empty recipe for approval', async () => {
    prisma.bom.findFirst.mockResolvedValue({ ...draftBom, items: [] });
    await expect(service.submitForApproval('bom-1', user)).rejects.toThrow(BadRequestException);
  });

  it('submitForApproval() blocks submission while a query on the BOM is still open', async () => {
    prisma.bomQuery.findFirst.mockResolvedValue({ id: 'q-1', status: 'OPEN' });
    await expect(service.submitForApproval('bom-1', user)).rejects.toThrow(BadRequestException);
  });

  it('CRITICAL: submitForApproval() calls workflows.submit() with documentType BOM and sets the BOM to PENDING_APPROVAL', async () => {
    prisma.bom.update.mockResolvedValue({ ...draftBom, status: 'PENDING_APPROVAL' });
    await service.submitForApproval('bom-1', user);
    expect(workflows.submit).toHaveBeenCalledWith(
      expect.objectContaining({ documentType: 'BOM', documentId: 'bom-1', documentNumber: 'GEN-0001' }),
      user,
    );
    expect(prisma.bom.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PENDING_APPROVAL' }),
    }));
  });

  it('submitForApproval() cascades a MASTER BOM\'s DRAFT stage-BOMs to PENDING_APPROVAL too, so master and stages move together', async () => {
    prisma.bom.update.mockResolvedValue({ ...draftBom, status: 'PENDING_APPROVAL' });
    await service.submitForApproval('bom-1', user);
    expect(prisma.bom.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ sourceBomId: 'bom-1', bomType: 'STAGE', status: 'DRAFT' }),
      data: expect.objectContaining({ status: 'PENDING_APPROVAL' }),
    }));
  });

  it('CRITICAL: onWorkflowApproved() is only called by the workflow engine after all levels pass - it marks the BOM APPROVED', async () => {
    prisma.bom.findFirst.mockResolvedValue({ id: 'bom-1', bomNumber: 'GEN-0001', status: 'PENDING_APPROVAL', bomType: 'MASTER', companyId: 'company-1' });
    prisma.bom.update.mockResolvedValue({ id: 'bom-1', status: 'APPROVED' });
    await service.onWorkflowApproved('bom-1', user);
    expect(prisma.bom.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'bom-1' },
      data: expect.objectContaining({ status: 'APPROVED', approvedBy: user.id }),
    }));
  });

  it('onWorkflowApproved() obsoletes a previously-approved version of the same BOM number - never leaves two APPROVED versions active at once', async () => {
    prisma.bom.findFirst.mockResolvedValue({ id: 'bom-2', bomNumber: 'GEN-0001', status: 'PENDING_APPROVAL', bomType: 'MASTER', companyId: 'company-1' });
    prisma.bom.update.mockResolvedValueOnce({ id: 'bom-2', status: 'APPROVED' });
    prisma.bom.findMany
      .mockResolvedValueOnce([]) // pendingStages for the new one
      .mockResolvedValueOnce([{ id: 'bom-1-old', bomNumber: 'GEN-0001' }]); // previousApproved
    await service.onWorkflowApproved('bom-2', user);
    expect(prisma.bom.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'bom-1-old' }, data: expect.objectContaining({ status: 'OBSOLETE' }),
    }));
  });

  it('CRITICAL: onWorkflowRejected() marks the BOM REJECTED (never APPROVED) and cascades PENDING_APPROVAL stages to REJECTED too', async () => {
    prisma.bom.findFirst.mockResolvedValue({ id: 'bom-1', status: 'PENDING_APPROVAL', bomType: 'MASTER', companyId: 'company-1' });
    prisma.bom.update.mockResolvedValue({ id: 'bom-1', status: 'REJECTED' });
    await service.onWorkflowRejected('bom-1', user);
    expect(prisma.bom.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'bom-1' }, data: expect.objectContaining({ status: 'REJECTED' }),
    }));
    expect(prisma.bom.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ sourceBomId: 'bom-1', status: 'PENDING_APPROVAL' }),
      data: expect.objectContaining({ status: 'REJECTED' }),
    }));
  });
});
