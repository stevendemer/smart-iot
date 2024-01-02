-- CreateTable
CREATE TABLE "EVReadings" (
    "id" SERIAL NOT NULL,
    "minChargeLevel" INTEGER NOT NULL,
    "durationStay" INTEGER NOT NULL,
    "currentChargeLevel" INTEGER NOT NULL,
    "carBatteryCapacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EVReadings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forecasts" (
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

    CONSTRAINT "Forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyPrices" (
    "id" SERIAL NOT NULL,
    "prices" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnergyPrices_pkey" PRIMARY KEY ("id")
);
