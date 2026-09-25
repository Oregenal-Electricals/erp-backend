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
      bomQuery: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'q-1' }) },
      bomItem: { createMany: jest.fn() },
      approvalRequest: { findFirst: jest.fn().mockResolvedValue(null) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };
    workflows = { submit: jest.fn().mockResolvedValue({ requiresApproval: true }), restartForEdit: jest.fn().mockResolvedValue({ requiresApproval: true }) };
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

  it('CRITICAL: raiseQuery() allows targeting an assigned approver whose level has already received the request (at or before the current level)', async () => {
    prisma.bom.findFirst.mockResolvedValue({ ...draftBom, createdBy: 'creator-1' });
    prisma.approvalRequest.findFirst.mockResolvedValue({
      currentLevel: 2,
      workflow: { steps: [{ level: 1, approverUserId: 'qm-1' }, { level: 2, approverUserId: 'plant-mgr-1' }] },
    });
    const result = await service.raiseQuery({ bomId: 'bom-1', raisedToUserId: 'plant-mgr-1', message: 'Please check this' }, user);
    expect(result.id).toBe('q-1');
    expect(prisma.bomQuery.create).toHaveBeenCalled();
  });

  it('CRITICAL: raiseQuery() rejects a level further down the chain that has not received the request yet - nobody there to ask', async () => {
    prisma.bom.findFirst.mockResolvedValue({ ...draftBom, createdBy: 'creator-1' });
    prisma.approvalRequest.findFirst.mockResolvedValue({
      currentLevel: 1,
      workflow: { steps: [{ level: 1, approverUserId: 'qm-1' }, { level: 2, approverUserId: 'plant-mgr-1' }] },
    });
    await expect(service.raiseQuery({ bomId: 'bom-1', raisedToUserId: 'plant-mgr-1', message: 'Hi' }, user)).rejects.toThrow(BadRequestException);
  });

  it('raiseQuery() still rejects a target who is neither the creator nor an assigned approver anywhere in the chain', async () => {
    prisma.bom.findFirst.mockResolvedValue({ ...draftBom, createdBy: 'creator-1' });
    prisma.approvalRequest.findFirst.mockResolvedValue({
      currentLevel: 1,
      workflow: { steps: [{ level: 1, approverUserId: 'qm-1' }] },
    });
    await expect(service.raiseQuery({ bomId: 'bom-1', raisedToUserId: 'random-person', message: 'Hi' }, user)).rejects.toThrow(BadRequestException);
  });

  it('raiseQuery() skips an unassigned level - no valid target from a level open to anyone', async () => {
    prisma.bom.findFirst.mockResolvedValue({ ...draftBom, createdBy: 'creator-1' });
    prisma.approvalRequest.findFirst.mockResolvedValue({
      currentLevel: 1,
      workflow: { steps: [{ level: 1, approverUserId: null }] },
    });
    await expect(service.raiseQuery({ bomId: 'bom-1', raisedToUserId: 'anyone', message: 'Hi' }, user)).rejects.toThrow(BadRequestException);
  });

  it('CRITICAL: update() blocks editing a PENDING_APPROVAL BOM when no query is open, even for the creator', async () => {
    prisma.bom.findFirst.mockResolvedValue({ ...draftBom, status: 'PENDING_APPROVAL', createdBy: user.id });
    prisma.bomQuery.findFirst.mockResolvedValue(null);
    await expect(service.update('bom-1', {} as any, user)).rejects.toThrow(BadRequestException);
  });

  it('update() blocks a non-creator from editing even while a query on the BOM is open', async () => {
    prisma.bom.findFirst.mockResolvedValue({ ...draftBom, status: 'PENDING_APPROVAL', createdBy: 'someone-else' });
    prisma.bomQuery.findFirst.mockResolvedValue({ id: 'q-1', status: 'OPEN' });
    await expect(service.update('bom-1', {} as any, user)).rejects.toThrow(BadRequestException);
  });

  it('CRITICAL: update() allows the creator to edit a PENDING_APPROVAL BOM while a query is open, and restarts the approval chain from level 1', async () => {
    prisma.bom.findFirst.mockResolvedValue({ ...draftBom, status: 'PENDING_APPROVAL', createdBy: user.id });
    prisma.bomQuery.findFirst.mockResolvedValue({ id: 'q-1', status: 'OPEN' });
    prisma.bom.update.mockResolvedValue({ ...draftBom, status: 'PENDING_APPROVAL' });
    await service.update('bom-1', { description: 'fixed' } as any, user);
    expect(workflows.restartForEdit).toHaveBeenCalledWith('BOM', 'bom-1', 'GEN-0001', user);
  });
});
