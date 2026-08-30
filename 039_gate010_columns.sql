ALTER TABLE "gate_inward_entries" ADD COLUMN "packageCountExpected" INTEGER;
ALTER TABLE "gate_inward_entries" ADD COLUMN "packageCountActual" INTEGER;
ALTER TABLE "gate_inward_entries" ADD COLUMN "packageCountDifference" INTEGER;
ALTER TABLE "gate_inward_entries" ADD COLUMN "packageCountVerifiedById" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "packageCountVerifiedAt" TIMESTAMP(3);
ALTER TABLE "gate_inward_entries" ADD COLUMN "packageCountEscalated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "gate_inward_entries" ADD COLUMN "packageCountEscalatedAt" TIMESTAMP(3);
ALTER TABLE "gate_inward_entries" ADD CONSTRAINT "gate_inward_entries_packageCountVerifiedById_fkey" FOREIGN KEY ("packageCountVerifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
