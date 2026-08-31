ALTER TABLE "visitor_logs" ADD COLUMN "vehicleLogId" TEXT;
ALTER TABLE "visitor_logs" ADD CONSTRAINT "visitor_logs_vehicleLogId_fkey" FOREIGN KEY ("vehicleLogId") REFERENCES "vehicle_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
