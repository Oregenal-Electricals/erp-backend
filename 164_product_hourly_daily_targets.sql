-- Task #59: real Hourly/Daily Target fields per product, and removal of
-- the dead HourlyProductionReport model.
--
-- 1) Product.hourlyTarget / Product.dailyTarget - explicit stored target
--    output numbers (pieces/hour, pieces/day) per product, independent of
--    (though typically set with reference to) the piecesPerManHour rate
--    on product_standard_productivity. Nullable: not every product has a
--    target set yet. Editing is gated by PRODUCTION_TARGET_MANAGE in the
--    application layer (src/products/product.service.ts), same permission
--    already used by the standard-productivity target endpoints.
--
-- 2) hourly_production_reports - dropped as dead code. It was defined in
--    schema.prisma (model HourlyProductionReport) with FKs to companies,
--    users and work_orders, but grep across src/ and test/ turns up zero
--    references anywhere outside the schema itself: no service, no
--    controller, no module, no DTO, no repository call ever created or
--    read a row in this table. The hour-by-hour target-vs-actual capture
--    it was clearly meant for is instead done today outside the ERP, in
--    the separate Google Sheets hourly production board. Rather than
--    leave an unused table (and now-stale FKs) sitting half-wired against
--    the new Product target fields, it is dropped cleanly here.

ALTER TABLE "products"
  ADD COLUMN "hourlyTarget" DOUBLE PRECISION,
  ADD COLUMN "dailyTarget" DOUBLE PRECISION;

DROP TABLE IF EXISTS "hourly_production_reports";
