-- CreateTable
CREATE TABLE "AmpecoSession" (
    "id" SERIAL NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "evseId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "energy" INTEGER NOT NULL,
    "powerKw" INTEGER NOT NULL,
    "socPercent" DOUBLE PRECISION NOT NULL,
    "electricityCost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AmpecoSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AmpecoSession_chargePointId_key" ON "AmpecoSession"("chargePointId");

-- CreateIndex
CREATE UNIQUE INDEX "AmpecoSession_evseId_key" ON "AmpecoSession"("evseId");
