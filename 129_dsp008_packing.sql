CREATE TABLE "dispatch_packings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "packingNumber" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "soId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_packings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatch_packages" (
    "id" TEXT NOT NULL,
    "packingId" TEXT NOT NULL,
    "packageNumber" TEXT NOT NULL,
    "packageType" TEXT NOT NULL DEFAULT 'CARTON',
    "netWeight" DOUBLE PRECISION,
    "grossWeight" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatch_package_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "verificationItemId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "saleType" TEXT NOT NULL,
    "packedQty" DOUBLE PRECISION NOT NULL,
    "reversedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PACKED',
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_package_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dispatch_packings" ADD CONSTRAINT "dispatch_packings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_packings" ADD CONSTRAINT "dispatch_packings_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "dispatch_verifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_packings" ADD CONSTRAINT "dispatch_packings_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatch_packages" ADD CONSTRAINT "dispatch_packages_packingId_fkey" FOREIGN KEY ("packingId") REFERENCES "dispatch_packings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispatch_package_items" ADD CONSTRAINT "dpi_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "dispatch_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatch_package_items" ADD CONSTRAINT "dpi_verificationItemId_fkey" FOREIGN KEY ("verificationItemId") REFERENCES "dispatch_verification_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "dpi_verificationItemId_idx" ON "dispatch_package_items"("verificationItemId");
CREATE INDEX "dpi_packageId_idx" ON "dispatch_package_items"("packageId");
CREATE UNIQUE INDEX "dispatch_packages_packageNumber_key" ON "dispatch_packages"("packageNumber");
