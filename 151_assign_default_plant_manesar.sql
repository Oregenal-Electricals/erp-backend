-- 151_assign_default_plant_manesar.sql
-- One-time data fix: give every existing user the (currently only) plant -
-- OREGENAL MANESAR PLANT (code 25117) - as their home plant, so the
-- Gate Inward auto-lock (and any future plant-scoped screen) has something
-- to work with immediately. Safe to run even before the plantId-dependent
-- application code is deployed - it only touches data, nothing the running
-- code reads yet. Also safe to re-run: it only fills rows that are still
-- NULL, so assigning someone to a different plant later via
-- Settings -> User Management is never overwritten by this script.
UPDATE "users"
SET "plantId" = (SELECT "id" FROM "plants" WHERE "code" = '25117')
WHERE "plantId" IS NULL;
