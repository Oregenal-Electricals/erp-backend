CREATE TABLE "rtv_requests" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "rtvNumber" TEXT NOT NULL,
  "rejectedStockItemId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "uom" TEXT NOT NULL,
  "batchId" TEXT,
  "reason" TEXT NOT NULL,
  "requestedQty" DOUBLE PRECISION NOT NULL,
  "approvedQty" DOUBLE PRECISION,
  "preparedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gateOutQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "approvalRequestId" TEXT,
  "requestedById" TEXT NOT NULL,
  "authorizedById" TEXT,
  "authorizedAt" TIMESTAMP(3),
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "rtv_requests_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "rtv_gate_outs" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "rtvRequestId" TEXT NOT NULL,
  "qty" DOUBLE PRECISION NOT NULL,
  "vehicleNumber" TEXT,
  "challanNumber" TEXT,
  "gatedOutById" TEXT NOT NULL,
  "gatedOutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "rtv_gate_outs_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "rtv_requests" ADD CONSTRAINT "rtv_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rtv_requests" ADD CONSTRAINT "rtv_requests_rejectedStockItemId_fkey" FOREIGN KEY ("rejectedStockItemId") REFERENCES "rejected_stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rtv_requests" ADD CONSTRAINT "rtv_requests_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rtv_requests" ADD CONSTRAINT "rtv_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rtv_requests" ADD CONSTRAINT "rtv_requests_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rtv_gate_outs" ADD CONSTRAINT "rtv_gate_outs_rtvRequestId_fkey" FOREIGN KEY ("rtvRequestId") REFERENCES "rtv_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rtv_gate_outs" ADD CONSTRAINT "rtv_gate_outs_gatedOutById_fkey" FOREIGN KEY ("gatedOutById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "rtv_requests_companyId_rejectedStockItemId_idx" ON "rtv_requests"("companyId", "rejectedStockItemId");
CREATE INDEX "rtv_requests_companyId_status_idx" ON "rtv_requests"("companyId", "status");
CREATE INDEX "rtv_gate_outs_companyId_rtvRequestId_idx" ON "rtv_gate_outs"("companyId", "rtvRequestId");
