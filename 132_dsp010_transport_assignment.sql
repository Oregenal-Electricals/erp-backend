CREATE TABLE "dispatch_transport_assignments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assignmentNumber" TEXT NOT NULL,
    "dispatchPlanId" TEXT NOT NULL,
    "soId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "transportType" TEXT NOT NULL DEFAULT 'TRANSPORTER_VEHICLE',
    "transporterName" TEXT,
    "vehicleId" TEXT,
    "vehicleNumber" TEXT,
    "vehicleType" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "lrNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_transport_assignments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dispatch_packages" ADD COLUMN "assignedTransportAssignmentId" TEXT;

ALTER TABLE "dispatch_transport_assignments" ADD CONSTRAINT "dta_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_transport_assignments" ADD CONSTRAINT "dta_dispatchPlanId_fkey" FOREIGN KEY ("dispatchPlanId") REFERENCES "dispatch_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_transport_assignments" ADD CONSTRAINT "dta_soId_fkey" FOREIGN KEY ("soId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_transport_assignments" ADD CONSTRAINT "dta_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dispatch_packages" ADD CONSTRAINT "dispatch_packages_assignedTransportAssignmentId_fkey" FOREIGN KEY ("assignedTransportAssignmentId") REFERENCES "dispatch_transport_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "dta_dispatchPlanId_idx" ON "dispatch_transport_assignments"("dispatchPlanId");
CREATE INDEX "dispatch_packages_assignedTransportAssignmentId_idx" ON "dispatch_packages"("assignedTransportAssignmentId");
