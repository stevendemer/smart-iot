/*
  Warnings:

  - You are about to drop the `AmpecoSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EVReading` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EnergyPrice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PVAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PVReading` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeatherForecast` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PVReading" DROP CONSTRAINT "PVReading_accountId_fkey";

-- DropTable
DROP TABLE "AmpecoSession";

-- DropTable
DROP TABLE "EVReading";

-- DropTable
DROP TABLE "EnergyPrice";

-- DropTable
DROP TABLE "PVAccount";

-- DropTable
DROP TABLE "PVReading";

-- DropTable
DROP TABLE "WeatherForecast";

-- CreateTable
CREATE TABLE "ev_readings" (
    "id" SERIAL NOT NULL,
    "minChargeLevel" INTEGER NOT NULL,
    "durationStay" INTEGER NOT NULL,
    "currentChargeLevel" INTEGER NOT NULL,
    "carBatteryCapacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ev_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecasts" (
    "id" SERIAL NOT NULL,
    "temperature" INTEGER NOT NULL,
    "directRadiation" INTEGER NOT NULL,
    "diffuseRadiation" INTEGER NOT NULL,
    "isDay" BOOLEAN NOT NULL DEFAULT true,
    "cloudCover" DOUBLE PRECISION NOT NULL,
    "forecastDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_prices" (
    "id" SERIAL NOT NULL,
    "prices" JSONB[],
    "today" TEXT,
    "tomorrow" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energy_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pv_accounts" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pv_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pv_readings" (
    "id" SERIAL NOT NULL,
    "inverterState" INTEGER NOT NULL,
    "efficiency" DOUBLE PRECISION NOT NULL,
    "activePower" DOUBLE PRECISION NOT NULL,
    "reactivePower" DOUBLE PRECISION NOT NULL,
    "devId" INTEGER NOT NULL,
    "devTypeId" INTEGER NOT NULL,
    "totalYield" DOUBLE PRECISION NOT NULL,
    "totalInputPower" DOUBLE PRECISION NOT NULL,
    "runState" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" INTEGER,

    CONSTRAINT "pv_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charging_sessions" (
    "id" SERIAL NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "evseId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "stoppedAt" TIMESTAMP(3) NOT NULL,
    "energy" DOUBLE PRECISION NOT NULL,
    "powerKw" INTEGER NOT NULL,
    "socPercent" DOUBLE PRECISION NOT NULL,
    "electricityCost" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charging_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "hashedRt" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pv_accounts_username_key" ON "pv_accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "pv_readings" ADD CONSTRAINT "pv_readings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "pv_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
