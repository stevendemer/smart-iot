/*
  Warnings:

  - Changed the type of `currentHour` on the `WeatherForecast` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "WeatherForecast" DROP COLUMN "currentHour",
ADD COLUMN     "currentHour" INTEGER NOT NULL;
