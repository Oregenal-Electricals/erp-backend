ALTER TABLE "gate_inward_entries" ADD COLUMN "mismatchType" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "mismatchExpectedValue" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "mismatchActualValue" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "mismatchFlaggedById" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "mismatchFlaggedAt" TIMESTAMP(3);
ALTER TABLE "gate_inward_entries" ADD CONSTRAINT "gate_inward_entries_mismatchFlaggedById_fkey" FOREIGN KEY ("mismatchFlaggedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
