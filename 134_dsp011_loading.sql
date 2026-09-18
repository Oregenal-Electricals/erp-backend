CREATE TABLE "dispatch_loadings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "loadingNumber" TEXT NOT NULL,
    "transportAssignmentId" TEXT NOT NULL,
    "dispatchPlanId" TEXT NOT NULL,
    "soId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3),
    "startedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_loadings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatch_loading_items" (
    "id" TEXT NOT NULL,
    "loadingId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOADED',
    "exceptionReason" TEXT,
    "loadedBy" TEXT,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unloadedBy" TEXT,
    "unloadedAt" TIMESTAMP(3),
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_loading_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dispatch_packages" ADD COLUMN "loadedInLoadingId" TEXT;

ALTER TABLE "dispatch_loadings" ADD CONSTRAINT "dl_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_loadings" ADD CONSTRAINT "dl_transportAssignmentId_fkey" FOREIGN KEY ("transportAssignmentId") REFERENCES "dispatch_transport_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_loadings" ADD CONSTRAINT "dl_dispatchPlanId_fkey" FOREIGN KEY ("dispatchPlanId") REFERENCES "dispatch_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_loadings" ADD CONSTRAINT "dl_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatch_loading_items" ADD CONSTRAINT "dli_loadingId_fkey" FOREIGN KEY ("loadingId") REFERENCES "dispatch_loadings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatch_loading_items" ADD CONSTRAINT "dli_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "dispatch_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatch_packages" ADD CONSTRAINT "dispatch_packages_loadedInLoadingId_fkey" FOREIGN KEY ("loadedInLoadingId") REFERENCES "dispatch_loadings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "dl_transportAssignmentId_idx" ON "dispatch_loadings"("transportAssignmentId");
CREATE INDEX "dli_loadingId_idx" ON "dispatch_loading_items"("loadingId");
CREATE INDEX "dli_packageId_idx" ON "dispatch_loading_items"("packageId");
CREATE INDEX "dispatch_packages_loadedInLoadingId_idx" ON "dispatch_packages"("loadedInLoadingId");
