ALTER TABLE rejected_stock ALTER COLUMN "iqcId" DROP NOT NULL;
ALTER TABLE rejected_stock ALTER COLUMN "grnId" DROP NOT NULL;
ALTER TABLE rejected_stock ADD COLUMN IF NOT EXISTS "fgReceiptId" TEXT;
ALTER TABLE rejected_stock ADD CONSTRAINT rejected_stock_fgreceiptid_fkey FOREIGN KEY ("fgReceiptId") REFERENCES fg_receipts(id) ON DELETE RESTRICT ON UPDATE CASCADE;
