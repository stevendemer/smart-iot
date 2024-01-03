/*
  Warnings:

  - A unique constraint covering the columns `[forecastDate]` on the table `WeatherForecast` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WeatherForecast" ALTER COLUMN "forecastDate" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "WeatherForecast_forecastDate_key" ON "WeatherForecast"("forecastDate");
