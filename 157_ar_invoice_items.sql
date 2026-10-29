-- Task #53: itemize the AR Invoice. Previously ar_invoices was a
-- header-only record (subtotal/totalGst/totalAmount only, no per-line
-- breakdown). This adds the child line-item table, carrying the
-- customer's own original item wording per line (resolved from
-- customer_item_mappings at invoice-creation time, with a fallback to
-- our internal itemName when no mapping exists).

CREATE TABLE "ar_invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dispatchItemId" TEXT,
    "soItemId" TEXT,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "productId" TEXT,
    "rawMaterialId" TEXT,
    "customerItemWording" TEXT NOT NULL,
    "customerItemCode" TEXT,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'PCS',
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "ar_invoice_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ar_invoice_items" ADD CONSTRAINT "ar_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ar_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ar_invoice_items_invoiceId_idx" ON "ar_invoice_items"("invoiceId");
