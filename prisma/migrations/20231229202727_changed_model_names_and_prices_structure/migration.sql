/*
  Warnings:

  - You are about to drop the `EVReadings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EnergyPrices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Forecasts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PV` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "EVReadings";

-- DropTable
DROP TABLE "EnergyPrices";

-- DropTable
DROP TABLE "Forecasts";

-- DropTable
DROP TABLE "PV";

-- CreateTable
CREATE TABLE "EVReading" (
    "id" SERIAL NOT NULL,
    "minChargeLevel" INTEGER NOT NULL,
    "durationStay" INTEGER NOT NULL,
    "currentChargeLevel" INTEGER NOT NULL,
    "carBatteryCapacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EVReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherForecast" (
    "id" SERIAL NOT NULL,
    "temperature" INTEGER NOT NULL,
    "currentTime" INTEGER NOT NULL,
    "directRadiation" INTEGER NOT NULL,
    "diffuseRadiation" INTEGER NOT NULL,
    "isDay" BOOLEAN NOT NULL DEFAULT true,
    "cloudCover" DOUBLE PRECISION NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyPrice" (
    "id" SERIAL NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currentTime" TIMESTAMP(3) NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnergyPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PVReading" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "PVReading_pkey" PRIMARY KEY ("id")
);
