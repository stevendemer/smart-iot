/*
  Warnings:

  - A unique constraint covering the columns `[forecastDate]` on the table `forecasts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "forecasts_forecastDate_key" ON "forecasts"("forecastDate");
