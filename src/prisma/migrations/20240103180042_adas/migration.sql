/*
  Warnings:

  - You are about to drop the column `hour` on the `WeatherForecast` table. All the data in the column will be lost.
  - Added the required column `currentHour` to the `WeatherForecast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WeatherForecast" DROP COLUMN "hour",
ADD COLUMN     "currentHour" TEXT NOT NULL;
