ALTER TABLE "work_orders" ADD COLUMN "dispatchReservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "dispatch_reservations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reservationNumber" TEXT NOT NULL,
    "dispatchPlanId" TEXT NOT NULL,
    "dispatchPlanItemId" TEXT NOT NULL,
    "soId" TEXT NOT NULL,
    "soItemId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "reservationType" TEXT NOT NULL,
    "warehouseId" TEXT,
    "workOrderId" TEXT,
    "requiredStageId" TEXT,
    "reservedQty" DOUBLE PRECISION NOT NULL,
    "releasedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "releaseReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_reservations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dispatch_reservations" ADD CONSTRAINT "dispatch_reservations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_reservations" ADD CONSTRAINT "dispatch_reservations_dispatchPlanId_fkey" FOREIGN KEY ("dispatchPlanId") REFERENCES "dispatch_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_reservations" ADD CONSTRAINT "dispatch_reservations_dispatchPlanItemId_fkey" FOREIGN KEY ("dispatchPlanItemId") REFERENCES "dispatch_plan_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_reservations" ADD CONSTRAINT "dispatch_reservations_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_reservations" ADD CONSTRAINT "dispatch_reservations_soItemId_fkey" FOREIGN KEY ("soItemId") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_reservations" ADD CONSTRAINT "dispatch_reservations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispatch_reservations" ADD CONSTRAINT "dispatch_reservations_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispatch_reservations" ADD CONSTRAINT "dispatch_reservations_requiredStageId_fkey" FOREIGN KEY ("requiredStageId") REFERENCES "routing_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "dispatch_reservations_dispatchPlanItemId_idx" ON "dispatch_reservations"("dispatchPlanItemId");
CREATE INDEX "dispatch_reservations_soItemId_idx" ON "dispatch_reservations"("soItemId");
CREATE INDEX "dispatch_reservations_workOrderId_idx" ON "dispatch_reservations"("workOrderId");
