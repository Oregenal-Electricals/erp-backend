ALTER TABLE "work_orders" ADD COLUMN "requiredDate" TIMESTAMP(3);
ALTER TABLE "work_orders" ADD COLUMN "releasedById" TEXT;
ALTER TABLE "work_orders" ADD COLUMN "releasedAt" TIMESTAMP(3);
ALTER TABLE "work_orders" ADD COLUMN "materialAvailability" TEXT;
ALTER TABLE "work_orders" ADD COLUMN "plannedManpower" INTEGER;
ALTER TABLE "work_orders" ADD COLUMN "plannedLabourHours" DOUBLE PRECISION;
ALTER TABLE "work_orders" ADD COLUMN "plannedLabourCost" DOUBLE PRECISION;
ALTER TABLE "work_orders" ADD COLUMN "plannedLabourCostPerPc" DOUBLE PRECISION;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "product_standard_productivity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "piecesPerManHour" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "product_standard_productivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "product_standard_productivity_companyId_productId_idx" ON "product_standard_productivity"("companyId", "productId");
ALTER TABLE "product_standard_productivity" ADD CONSTRAINT "product_standard_productivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_standard_productivity" ADD CONSTRAINT "product_standard_productivity_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
