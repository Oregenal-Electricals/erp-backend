-- 150_user_default_plant.sql
-- Ties a user to a home plant so plant-specific screens (starting with
-- Gate Inward Entry) can auto-select/lock it instead of asking every
-- time. Nullable - not every role needs one, and existing users have
-- none assigned until an admin sets it via Settings -> User Management.
ALTER TABLE "users" ADD COLUMN "plantId" TEXT;

ALTER TABLE "users"
  ADD CONSTRAINT "users_plantId_fkey"
  FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "users_plantId_idx" ON "users"("plantId");
