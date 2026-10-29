-- Task #56: vertical-first rack/bin location numbering.
--
-- Physical storage racks are vertical (bay/column x shelf level), so
-- auto-generated bin location codes must increment down a bay's levels
-- before moving to the next bay (vertical-first), not across all bays at
-- one level before moving down (horizontal-first).
--
-- warehouse_bins previously had no bay/level/position columns at all -
-- the only existing auto-generator (RackBinService.bulkCreateBins) produced
-- a flat one-dimensional sequence ("PREFIX-01", "PREFIX-02", ...) with no
-- spatial meaning. These columns back the new generateRackLocations()
-- vertical-first generator. All three are nullable so every existing
-- manually-entered bin code keeps working unchanged (bay/level/
-- sequenceOrder simply stay NULL for those rows).
ALTER TABLE "warehouse_bins" ADD COLUMN "bay" TEXT;
ALTER TABLE "warehouse_bins" ADD COLUMN "level" INTEGER;
ALTER TABLE "warehouse_bins" ADD COLUMN "sequenceOrder" INTEGER;

-- Lets a rack's bin list be fetched already ordered in true vertical-first
-- display order (ORDER BY sequenceOrder) instead of string-sorting on code.
CREATE INDEX "warehouse_bins_rackId_sequenceOrder_idx" ON "warehouse_bins"("rackId", "sequenceOrder");
