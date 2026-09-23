import { WorkflowsService } from './workflows.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('WorkflowsService - configurable multi-level approval engine (BOM/Product approval workflow)', () => {
  let service: WorkflowsService;
  let prisma: any;
  let bomService: any;
  let productService: any;
  const user = { id: 'user-1', companyId: 'company-1', role: 'RND' };
  const superAdmin = { id: 'super-1', companyId: 'company-1', role: 'SUPER_ADMIN' };

  const fourLevelWorkflow = {
    id: 'wf-bom', documentType: 'BOM', triggerCondition: 'ALWAYS', levels: 4,
    steps: [
      { level: 1, stepName: 'Level 1 Review', approverUserId: 'approver-1' },
      { level: 2, stepName: 'Level 2 Review', approverUserId: null },
      { level: 3, stepName: 'Level 3 Review', approverUserId: 'approver-3' },
      { level: 4, stepName: 'Final Approval', approverUserId: 'approver-4' },
    ],
  };

  beforeEach(() => {
    prisma = {
      workflowDefinition: {
        findFirst: jest.fn().mockResolvedValue(fourLevelWorkflow),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      workflowStep: { deleteMany: jest.fn() },
      approvalRequest: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      approvalAction: { create: jest.fn() },
      user: { findMany: jest.fn().mockResolvedValue([
        { id: 'approver-1', firstName: 'Priya', lastName: 'Sharma', email: 'priya@example.com' },
        { id: 'user-1', firstName: 'RND', lastName: 'User', email: 'rnd@example.com' },
      ]) },
    };
    bomService = { onWorkflowApproved: jest.fn(), onWorkflowRejected: jest.fn() };
    productService = { onWorkflowApproved: jest.fn(), onWorkflowRejected: jest.fn() };
    service = new WorkflowsService(prisma, { log: jest.fn() } as any, bomService, productService);
  });

  it('submit() creates a PENDING ApprovalRequest at level 1 with totalLevels taken from the matching workflow definition', async () => {
    prisma.approvalRequest.findFirst.mockResolvedValue(null); // no existing pending
    prisma.approvalRequest.create.mockResolvedValue({ id: 'req-1', currentLevel: 1, totalLevels: 4, status: 'PENDING' });
    const result = await service.submit({ documentType: 'BOM', documentId: 'bom-1', documentNumber: 'GEN-0001' }, user);
    expect(result.requiresApproval).toBe(true);
    expect(prisma.approvalRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currentLevel: 1, totalLevels: 4, documentType: 'BOM', documentId: 'bom-1' }),
    }));
  });

  it('submit() blocks a second submission while one is already PENDING for the same document', async () => {
    prisma.approvalRequest.findFirst.mockResolvedValue({ id: 'existing-req', status: 'PENDING' });
    await expect(service.submit({ documentType: 'BOM', documentId: 'bom-1', documentNumber: 'GEN-0001' }, user))
      .rejects.toThrow(BadRequestException);
  });

  it('CRITICAL PER-STEP APPROVER ENFORCEMENT: a user who is not the assigned approver for the current level is blocked, even with the generic WORKFLOW_ACT permission already granted at the controller', async () => {
    const request = { id: 'req-1', status: 'PENDING', currentLevel: 1, totalLevels: 4, documentType: 'BOM', documentId: 'bom-1', workflow: fourLevelWorkflow };
    prisma.approvalRequest.findFirst.mockResolvedValue(request);
    const wrongUser = { id: 'not-the-approver', companyId: 'company-1', role: 'RND' };
    await expect(service.act('req-1', { action: 'APPROVED' }, wrongUser)).rejects.toThrow(ForbiddenException);
    expect(prisma.approvalAction.create).not.toHaveBeenCalled();
  });

  it('the correctly assigned approver for the current level CAN act', async () => {
    const request = { id: 'req-1', status: 'PENDING', currentLevel: 1, totalLevels: 4, documentType: 'BOM', documentId: 'bom-1', workflow: fourLevelWorkflow };
    prisma.approvalRequest.findFirst.mockResolvedValue(request);
    prisma.approvalRequest.update.mockResolvedValue({ id: 'req-1', status: 'PENDING', currentLevel: 2 });
    const rightUser = { id: 'approver-1', companyId: 'company-1', role: 'RND' };
    const result = await service.act('req-1', { action: 'APPROVED' }, rightUser);
    expect(result.currentLevel).toBe(2);
  });

  it('SUPER_ADMIN can act on any level regardless of who is assigned', async () => {
    const request = { id: 'req-1', status: 'PENDING', currentLevel: 1, totalLevels: 4, documentType: 'BOM', documentId: 'bom-1', workflow: fourLevelWorkflow };
    prisma.approvalRequest.findFirst.mockResolvedValue(request);
    prisma.approvalRequest.update.mockResolvedValue({ id: 'req-1', status: 'PENDING', currentLevel: 2 });
    await expect(service.act('req-1', { action: 'APPROVED' }, superAdmin)).resolves.toBeDefined();
  });

  it('an unassigned level (no approverUserId configured yet) is open to any user with WORKFLOW_ACT - lets a freshly-seeded workflow be usable before Admin assigns specific approvers', async () => {
    const request = { id: 'req-1', status: 'PENDING', currentLevel: 2, totalLevels: 4, documentType: 'BOM', documentId: 'bom-1', workflow: fourLevelWorkflow };
    prisma.approvalRequest.findFirst.mockResolvedValue(request);
    prisma.approvalRequest.update.mockResolvedValue({ id: 'req-1', status: 'PENDING', currentLevel: 3 });
    const anyUser = { id: 'anyone-at-all', companyId: 'company-1', role: 'RND' };
    await expect(service.act('req-1', { action: 'APPROVED' }, anyUser)).resolves.toBeDefined();
  });

  it('CRITICAL SEQUENTIAL ADVANCE: approving a non-final level advances currentLevel by one and keeps status PENDING - does not skip levels', async () => {
    const request = { id: 'req-1', status: 'PENDING', currentLevel: 2, totalLevels: 4, documentType: 'BOM', documentId: 'bom-1', workflow: fourLevelWorkflow };
    prisma.approvalRequest.findFirst.mockResolvedValue(request);
    prisma.approvalRequest.update.mockResolvedValue({ id: 'req-1', status: 'PENDING', currentLevel: 3 });
    const anyUser = { id: 'anyone-at-all', companyId: 'company-1', role: 'RND' };
    await service.act('req-1', { action: 'APPROVED' }, anyUser);
    expect(prisma.approvalRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PENDING', currentLevel: 3 }),
    }));
    expect(bomService.onWorkflowApproved).not.toHaveBeenCalled();
  });

  it('CRITICAL FINAL-LEVEL COMPLETION: approving the last level (4 of 4) marks the request APPROVED and syncs the BOM via bomService.onWorkflowApproved - not before', async () => {
    const request = { id: 'req-1', status: 'PENDING', currentLevel: 4, totalLevels: 4, documentType: 'BOM', documentId: 'bom-1', workflow: fourLevelWorkflow };
    prisma.approvalRequest.findFirst.mockResolvedValue(request);
    prisma.approvalRequest.update.mockResolvedValue({ id: 'req-1', status: 'APPROVED', currentLevel: 4 });
    const finalApprover = { id: 'approver-4', companyId: 'company-1', role: 'RND' };
    await service.act('req-1', { action: 'APPROVED' }, finalApprover);
    expect(prisma.approvalRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'APPROVED' }),
    }));
    expect(bomService.onWorkflowApproved).toHaveBeenCalledWith('bom-1', finalApprover);
    expect(bomService.onWorkflowRejected).not.toHaveBeenCalled();
  });

  it('CRITICAL PRODUCT ROUTING: a PRODUCT document type dispatches to productService, not bomService, on final approval', async () => {
    const request = { id: 'req-2', status: 'PENDING', currentLevel: 4, totalLevels: 4, documentType: 'PRODUCT', documentId: 'product-1', workflow: fourLevelWorkflow };
    prisma.approvalRequest.findFirst.mockResolvedValue(request);
    prisma.approvalRequest.update.mockResolvedValue({ id: 'req-2', status: 'APPROVED', currentLevel: 4 });
    const finalApprover = { id: 'approver-4', companyId: 'company-1', role: 'RND' };
    await service.act('req-2', { action: 'APPROVED' }, finalApprover);
    expect(productService.onWorkflowApproved).toHaveBeenCalledWith('product-1', finalApprover);
    expect(bomService.onWorkflowApproved).not.toHaveBeenCalled();
  });

  it('CRITICAL REJECTION: rejecting at ANY level (not just the last) immediately sets REJECTED and syncs the document, without needing to reach the final level', async () => {
    const request = { id: 'req-1', status: 'PENDING', currentLevel: 2, totalLevels: 4, documentType: 'BOM', documentId: 'bom-1', workflow: fourLevelWorkflow };
    prisma.approvalRequest.findFirst.mockResolvedValue(request);
    prisma.approvalRequest.update.mockResolvedValue({ id: 'req-1', status: 'REJECTED', currentLevel: 2 });
    const anyUser = { id: 'anyone-at-all', companyId: 'company-1', role: 'RND' };
    await service.act('req-1', { action: 'REJECTED', comments: 'Missing spec sheet' }, anyUser);
    expect(prisma.approvalRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'REJECTED' }),
    }));
    expect(bomService.onWorkflowRejected).toHaveBeenCalledWith('bom-1', anyUser);
    expect(bomService.onWorkflowApproved).not.toHaveBeenCalled();
  });

  it('blocks acting twice on the same request once it is no longer PENDING', async () => {
    prisma.approvalRequest.findFirst.mockResolvedValue({ id: 'req-1', status: 'APPROVED', currentLevel: 4, totalLevels: 4, workflow: fourLevelWorkflow });
    await expect(service.act('req-1', { action: 'APPROVED' }, superAdmin)).rejects.toThrow(BadRequestException);
  });

  it('update() replaces a workflow definition\'s step list wholesale and recomputes levels from the new step count - this is how Admin reconfigures approver count/sequence after the fact', async () => {
    prisma.workflowDefinition.findFirst.mockResolvedValue({ id: 'wf-bom', companyId: 'company-1' });
    prisma.workflowDefinition.update.mockResolvedValue({ id: 'wf-bom', levels: 2, steps: [] });
    const dto = { steps: [
      { level: 1, stepName: 'Quick Review', approverUserId: 'u1' },
      { level: 2, stepName: 'Final Approval', approverUserId: 'u2' },
    ] };
    await service.update('wf-bom', dto as any, user);
    expect(prisma.workflowStep.deleteMany).toHaveBeenCalledWith({ where: { workflowId: 'wf-bom' } });
    expect(prisma.workflowDefinition.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ levels: 2 }),
    }));
  });

  it('update() on a workflow definition that does not exist for this company throws NotFoundException', async () => {
    prisma.workflowDefinition.findFirst.mockResolvedValue(null);
    await expect(service.update('nonexistent', {} as any, user)).rejects.toThrow(NotFoundException);
  });

  it('CRITICAL: findOneRequest() attaches real names for every actor - requester, assigned approvers, and anyone who has acted - so the panel can show who did what, not just a bare id', async () => {
    prisma.approvalRequest.findFirst.mockResolvedValue({
      id: 'req-1', requestedBy: 'user-1', status: 'PENDING', currentLevel: 2, totalLevels: 4,
      workflow: fourLevelWorkflow,
      actions: [{ level: 1, action: 'APPROVED', actionBy: 'approver-1', comments: 'Fine' }],
    });
    const result = await service.findOneRequest('req-1', user);
    expect(result.actorNames['approver-1']).toEqual(expect.objectContaining({ firstName: 'Priya', lastName: 'Sharma' }));
    expect(result.actorNames['user-1']).toEqual(expect.objectContaining({ firstName: 'RND' }));
  });

  it('findAllRequests() supports filtering by documentId - lets a BOM/Product detail page look up its own approval history directly', async () => {
    prisma.approvalRequest.findMany.mockResolvedValue([]);
    await service.findAllRequests(user, { documentType: 'BOM', documentId: 'bom-1' });
    expect(prisma.approvalRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ documentType: 'BOM', documentId: 'bom-1' }),
    }));
  });

  it('CRITICAL: findMyApprovals() returns a PENDING request when the current level is specifically assigned to this user', async () => {
    prisma.approvalRequest.findMany.mockResolvedValue([
      { id: 'req-1', currentLevel: 1, workflow: { steps: [{ level: 1, approverUserId: 'user-1' }] } },
    ]);
    const result = await service.findMyApprovals(user);
    expect(result.map((r: any) => r.id)).toEqual(['req-1']);
  });

  it('findMyApprovals() excludes a PENDING request assigned to someone else', async () => {
    prisma.approvalRequest.findMany.mockResolvedValue([
      { id: 'req-1', currentLevel: 1, workflow: { steps: [{ level: 1, approverUserId: 'someone-else' }] } },
    ]);
    const result = await service.findMyApprovals(user);
    expect(result).toEqual([]);
  });

  it('findMyApprovals() includes a PENDING request whose current level is unassigned - open to any approver', async () => {
    prisma.approvalRequest.findMany.mockResolvedValue([
      { id: 'req-1', currentLevel: 1, workflow: { steps: [{ level: 1, approverUserId: null }] } },
    ]);
    const result = await service.findMyApprovals(user);
    expect(result.map((r: any) => r.id)).toEqual(['req-1']);
  });

  it('findMyApprovals() returns everything PENDING for SUPER_ADMIN, unfiltered by assignment', async () => {
    prisma.approvalRequest.findMany.mockResolvedValue([
      { id: 'req-1', currentLevel: 1, workflow: { steps: [{ level: 1, approverUserId: 'someone-else' }] } },
      { id: 'req-2', currentLevel: 1, workflow: { steps: [{ level: 1, approverUserId: 'another-person' }] } },
    ]);
    const result = await service.findMyApprovals(superAdmin);
    expect(result.map((r: any) => r.id)).toEqual(['req-1', 'req-2']);
  });
});
