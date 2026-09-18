CREATE TABLE "dispatch_confirmations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "confirmationNumber" TEXT NOT NULL,
    "loadingId" TEXT NOT NULL,
    "transportAssignmentId" TEXT NOT NULL,
    "dispatchPlanId" TEXT NOT NULL,
    "soId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "confirmationType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_confirmations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatch_confirmation_items" (
    "id" TEXT NOT NULL,
    "confirmationId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "exceptionReason" TEXT,
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedBy" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_confirmation_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dispatch_packages" ADD COLUMN "confirmedInConfirmationId" TEXT;

ALTER TABLE "dispatch_confirmations" ADD CONSTRAINT "dc_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_confirmations" ADD CONSTRAINT "dc_loadingId_fkey" FOREIGN KEY ("loadingId") REFERENCES "dispatch_loadings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_confirmations" ADD CONSTRAINT "dc_transportAssignmentId_fkey" FOREIGN KEY ("transportAssignmentId") REFERENCES "dispatch_transport_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_confirmations" ADD CONSTRAINT "dc_dispatchPlanId_fkey" FOREIGN KEY ("dispatchPlanId") REFERENCES "dispatch_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_confirmations" ADD CONSTRAINT "dc_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatch_confirmation_items" ADD CONSTRAINT "dci_confirmationId_fkey" FOREIGN KEY ("confirmationId") REFERENCES "dispatch_confirmations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatch_confirmation_items" ADD CONSTRAINT "dci_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "dispatch_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatch_packages" ADD CONSTRAINT "dispatch_packages_confirmedInConfirmationId_fkey" FOREIGN KEY ("confirmedInConfirmationId") REFERENCES "dispatch_confirmations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "dc_loadingId_idx" ON "dispatch_confirmations"("loadingId");
CREATE INDEX "dci_confirmationId_idx" ON "dispatch_confirmation_items"("confirmationId");
CREATE INDEX "dci_packageId_idx" ON "dispatch_confirmation_items"("packageId");
CREATE INDEX "dispatch_packages_confirmedInConfirmationId_idx" ON "dispatch_packages"("confirmedInConfirmationId");
