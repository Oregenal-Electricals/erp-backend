ALTER TABLE "gate_inward_entries" ADD COLUMN "holdResolution" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "holdResolvedById" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "holdResolvedAt" TIMESTAMP(3);
ALTER TABLE "gate_inward_entries" ADD COLUMN "holdResolutionRemarks" TEXT;
ALTER TABLE "gate_inward_entries" ADD CONSTRAINT "gate_inward_entries_holdResolvedById_fkey" FOREIGN KEY ("holdResolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
