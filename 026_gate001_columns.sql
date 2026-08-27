ALTER TABLE "gate_inward_entries" ADD COLUMN "driverName" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "vehicleNumber" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "gateInById" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "gateInAt" TIMESTAMP(3);
ALTER TABLE "gate_inward_entries" ADD CONSTRAINT "gate_inward_entries_gateInById_fkey" FOREIGN KEY ("gateInById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
