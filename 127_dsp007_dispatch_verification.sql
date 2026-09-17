CREATE TABLE "dispatch_verifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "verificationNumber" TEXT NOT NULL,
    "pickListId" TEXT NOT NULL,
    "soId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatch_verification_items" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "pickListItemId" TEXT NOT NULL,
    "soItemId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "saleType" TEXT NOT NULL,
    "verifiedQty" DOUBLE PRECISION NOT NULL,
    "exceptionQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exceptionReason" TEXT,
    "reversedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_verification_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dispatch_verifications" ADD CONSTRAINT "dispatch_verifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_verifications" ADD CONSTRAINT "dispatch_verifications_pickListId_fkey" FOREIGN KEY ("pickListId") REFERENCES "pick_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_verifications" ADD CONSTRAINT "dispatch_verifications_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatch_verification_items" ADD CONSTRAINT "dvi_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "dispatch_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatch_verification_items" ADD CONSTRAINT "dvi_pickListItemId_fkey" FOREIGN KEY ("pickListItemId") REFERENCES "pick_list_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_verification_items" ADD CONSTRAINT "dvi_soItemId_fkey" FOREIGN KEY ("soItemId") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "dvi_pickListItemId_idx" ON "dispatch_verification_items"("pickListItemId");
CREATE INDEX "dvi_verificationId_idx" ON "dispatch_verification_items"("verificationId");
