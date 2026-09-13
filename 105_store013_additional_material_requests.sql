CREATE TABLE "additional_material_requests" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "approvalRequestId" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "requestedQty" DOUBLE PRECISION NOT NULL,
  "approvedQty" DOUBLE PRECISION,
  "usedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reasonCategory" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "approverComments" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "additional_material_requests_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "additional_material_requests" ADD CONSTRAINT "additional_material_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "additional_material_requests" ADD CONSTRAINT "additional_material_requests_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "additional_material_requests" ADD CONSTRAINT "additional_material_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "additional_material_requests" ADD CONSTRAINT "additional_material_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "additional_material_requests_companyId_workOrderId_idx" ON "additional_material_requests"("companyId", "workOrderId");
CREATE INDEX "additional_material_requests_companyId_status_idx" ON "additional_material_requests"("companyId", "status");
