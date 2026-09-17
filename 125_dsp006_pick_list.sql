CREATE TABLE "pick_lists" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pickListNumber" TEXT NOT NULL,
    "dispatchPlanId" TEXT NOT NULL,
    "soId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "pick_lists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pick_list_items" (
    "id" TEXT NOT NULL,
    "pickListId" TEXT NOT NULL,
    "dispatchReservationId" TEXT NOT NULL,
    "soItemId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "saleType" TEXT NOT NULL,
    "batchId" TEXT,
    "pickedQty" DOUBLE PRECISION NOT NULL,
    "reversedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "pick_list_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_dispatchPlanId_fkey" FOREIGN KEY ("dispatchPlanId") REFERENCES "dispatch_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pick_list_items" ADD CONSTRAINT "pick_list_items_pickListId_fkey" FOREIGN KEY ("pickListId") REFERENCES "pick_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pick_list_items" ADD CONSTRAINT "pick_list_items_dispatchReservationId_fkey" FOREIGN KEY ("dispatchReservationId") REFERENCES "dispatch_reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pick_list_items" ADD CONSTRAINT "pick_list_items_soItemId_fkey" FOREIGN KEY ("soItemId") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pick_list_items" ADD CONSTRAINT "pick_list_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "stock_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "pick_list_items_dispatchReservationId_idx" ON "pick_list_items"("dispatchReservationId");
CREATE INDEX "pick_list_items_pickListId_idx" ON "pick_list_items"("pickListId");
