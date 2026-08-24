-- Main Gate Module Phase 1: masters + universal immutable event log

CREATE TABLE "gate_types" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT, "updatedBy" TEXT,
  CONSTRAINT "gate_types_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "gate_types" ADD CONSTRAINT "gate_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "gate_types_companyId_code_key" ON "gate_types"("companyId", "code");

CREATE TABLE "gates" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "plantId" TEXT NOT NULL, "gateTypeId" TEXT,
  "code" TEXT NOT NULL, "name" TEXT NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true, "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT, "updatedBy" TEXT,
  CONSTRAINT "gates_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "gates" ADD CONSTRAINT "gates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gates" ADD CONSTRAINT "gates_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gates" ADD CONSTRAINT "gates_gateTypeId_fkey" FOREIGN KEY ("gateTypeId") REFERENCES "gate_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "gates_companyId_code_key" ON "gates"("companyId", "code");
CREATE INDEX "gates_companyId_plantId_idx" ON "gates"("companyId", "plantId");

CREATE TABLE "parking_areas" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "plantId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "areaType" TEXT NOT NULL, "totalSlots" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true, "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT, "updatedBy" TEXT,
  CONSTRAINT "parking_areas_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "parking_areas" ADD CONSTRAINT "parking_areas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parking_areas" ADD CONSTRAINT "parking_areas_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "parking_areas_companyId_code_key" ON "parking_areas"("companyId", "code");
CREATE INDEX "parking_areas_companyId_plantId_idx" ON "parking_areas"("companyId", "plantId");

CREATE TABLE "parking_slots" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "parkingAreaId" TEXT NOT NULL, "slotCode" TEXT NOT NULL,
  "vehicleType" TEXT, "isReserved" BOOLEAN NOT NULL DEFAULT false, "isOccupied" BOOLEAN NOT NULL DEFAULT false,
  "currentVehicleLogId" TEXT, "occupiedAt" TIMESTAMP(3), "isActive" BOOLEAN NOT NULL DEFAULT true, "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT, "updatedBy" TEXT,
  CONSTRAINT "parking_slots_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "parking_slots" ADD CONSTRAINT "parking_slots_parkingAreaId_fkey" FOREIGN KEY ("parkingAreaId") REFERENCES "parking_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parking_slots" ADD CONSTRAINT "parking_slots_currentVehicleLogId_fkey" FOREIGN KEY ("currentVehicleLogId") REFERENCES "vehicle_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "parking_slots_parkingAreaId_slotCode_key" ON "parking_slots"("parkingAreaId", "slotCode");
CREATE INDEX "parking_slots_companyId_parkingAreaId_idx" ON "parking_slots"("companyId", "parkingAreaId");
CREATE INDEX "parking_slots_companyId_isOccupied_idx" ON "parking_slots"("companyId", "isOccupied");

CREATE TABLE "visit_purposes" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT, "updatedBy" TEXT,
  CONSTRAINT "visit_purposes_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "visit_purposes" ADD CONSTRAINT "visit_purposes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "visit_purposes_companyId_code_key" ON "visit_purposes"("companyId", "code");

CREATE TABLE "gate_pass_type_masters" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "mapsToType" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT, "updatedBy" TEXT,
  CONSTRAINT "gate_pass_type_masters_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "gate_pass_type_masters" ADD CONSTRAINT "gate_pass_type_masters_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "gate_pass_type_masters_companyId_code_key" ON "gate_pass_type_masters"("companyId", "code");

CREATE TABLE "security_reasons" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "category" TEXT NOT NULL DEFAULT 'DENIAL',
  "isActive" BOOLEAN NOT NULL DEFAULT true, "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT, "updatedBy" TEXT,
  CONSTRAINT "security_reasons_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "security_reasons" ADD CONSTRAINT "security_reasons_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "security_reasons_companyId_code_key" ON "security_reasons"("companyId", "code");

CREATE TABLE "gate_events" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "plantId" TEXT NOT NULL, "gateId" TEXT,
  "eventType" TEXT NOT NULL, "referenceType" TEXT, "referenceId" TEXT,
  "personId" TEXT, "personName" TEXT, "vehicleId" TEXT, "vehicleNumber" TEXT,
  "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "securityUserId" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'MANUAL', "remarks" TEXT, "correctionOfEventId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT, "updatedBy" TEXT,
  CONSTRAINT "gate_events_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "gates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_securityUserId_fkey" FOREIGN KEY ("securityUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_correctionOfEventId_fkey" FOREIGN KEY ("correctionOfEventId") REFERENCES "gate_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "gate_events_companyId_plantId_eventTime_idx" ON "gate_events"("companyId", "plantId", "eventTime");
CREATE INDEX "gate_events_companyId_eventType_idx" ON "gate_events"("companyId", "eventType");
CREATE INDEX "gate_events_companyId_gateId_idx" ON "gate_events"("companyId", "gateId");
CREATE INDEX "gate_events_companyId_personId_idx" ON "gate_events"("companyId", "personId");
CREATE INDEX "gate_events_companyId_vehicleId_idx" ON "gate_events"("companyId", "vehicleId");
CREATE INDEX "gate_events_companyId_referenceType_referenceId_idx" ON "gate_events"("companyId", "referenceType", "referenceId");
