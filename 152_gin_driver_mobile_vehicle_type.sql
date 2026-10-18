-- 152_gin_driver_mobile_vehicle_type.sql
-- Gate Inward Entry currently only captures Vehicle Number and Driver
-- Name when a vehicle isn't already checked in via Gate -> Vehicles.
-- Adds Driver Mobile and Vehicle Type so security can capture the full
-- picture inline. Both nullable - existing rows are unaffected, and
-- these are optional fields on the form going forward.
ALTER TABLE "gate_inward_entries" ADD COLUMN "driverMobile" TEXT;
ALTER TABLE "gate_inward_entries" ADD COLUMN "vehicleType" "VehicleType";
