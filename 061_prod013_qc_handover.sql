ALTER TABLE "stage_transfer_notes" ALTER COLUMN "toWorkOrderId" DROP NOT NULL;
ALTER TABLE "stage_transfer_notes" DROP CONSTRAINT IF EXISTS "stage_transfer_notes_toWorkOrderId_fkey";
ALTER TABLE "stage_transfer_notes" ADD CONSTRAINT "stage_transfer_notes_toWorkOrderId_fkey" FOREIGN KEY ("toWorkOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stage_transfer_notes" ADD COLUMN "isQcHandover" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "stage_transfer_notes" ADD COLUMN "batchLot" TEXT;
