CREATE TABLE "dispatch_gate_outs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gateOutNumber" TEXT NOT NULL,
    "dispatchConfirmationId" TEXT NOT NULL,
    "transportAssignmentId" TEXT NOT NULL,
    "dispatchPlanId" TEXT NOT NULL,
    "soId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "gateOutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gateOutBy" TEXT,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_gate_outs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "dispatch_gate_outs_dispatchConfirmationId_key" ON "dispatch_gate_outs"("dispatchConfirmationId");

CREATE TABLE "dispatch_gate_out_items" (
    "id" TEXT NOT NULL,
    "gateOutId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "soItemId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "saleType" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "warehouseId" TEXT,
    "workOrderId" TEXT,
    "dispatchReservationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_gate_out_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dispatch_packages" ADD COLUMN "gateOutId" TEXT;

ALTER TABLE "dispatch_gate_outs" ADD CONSTRAINT "dgo_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_gate_outs" ADD CONSTRAINT "dgo_dispatchConfirmationId_fkey" FOREIGN KEY ("dispatchConfirmationId") REFERENCES "dispatch_confirmations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_gate_outs" ADD CONSTRAINT "dgo_transportAssignmentId_fkey" FOREIGN KEY ("transportAssignmentId") REFERENCES "dispatch_transport_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_gate_outs" ADD CONSTRAINT "dgo_dispatchPlanId_fkey" FOREIGN KEY ("dispatchPlanId") REFERENCES "dispatch_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_gate_outs" ADD CONSTRAINT "dgo_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatch_gate_out_items" ADD CONSTRAINT "dgoi_gateOutId_fkey" FOREIGN KEY ("gateOutId") REFERENCES "dispatch_gate_outs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatch_gate_out_items" ADD CONSTRAINT "dgoi_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "dispatch_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatch_packages" ADD CONSTRAINT "dispatch_packages_gateOutId_fkey" FOREIGN KEY ("gateOutId") REFERENCES "dispatch_gate_outs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "dgo_dispatchPlanId_idx" ON "dispatch_gate_outs"("dispatchPlanId");
CREATE INDEX "dgoi_gateOutId_idx" ON "dispatch_gate_out_items"("gateOutId");
CREATE INDEX "dgoi_packageId_idx" ON "dispatch_gate_out_items"("packageId");
CREATE INDEX "dispatch_packages_gateOutId_idx" ON "dispatch_packages"("gateOutId");
