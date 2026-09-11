ALTER TABLE "grn_headers" ADD COLUMN "physicallyVerifiedAt" TIMESTAMP(3);
ALTER TABLE "grn_headers" ADD COLUMN "reversedById" TEXT;
ALTER TABLE "grn_headers" ADD COLUMN "reversedAt" TIMESTAMP(3);
ALTER TABLE "grn_headers" ADD COLUMN "reversalReason" TEXT;
ALTER TABLE "grn_headers" ADD CONSTRAINT "grn_headers_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
