CREATE TABLE "material_issue_overrides" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "approvalRequestId" TEXT NOT NULL,
  "itemsSnapshot" JSONB NOT NULL,
  "reason" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deadlineAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "approverComments" TEXT,
  "consumedByIssueId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "material_issue_overrides_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "material_issue_overrides_companyId_workOrderId_idx" ON "material_issue_overrides"("companyId", "workOrderId");
CREATE INDEX "material_issue_overrides_companyId_status_idx" ON "material_issue_overrides"("companyId", "status");
ALTER TABLE "material_issue_overrides" ADD CONSTRAINT "material_issue_overrides_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_issue_overrides" ADD CONSTRAINT "material_issue_overrides_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_issue_overrides" ADD CONSTRAINT "material_issue_overrides_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_issue_overrides" ADD CONSTRAINT "material_issue_overrides_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
