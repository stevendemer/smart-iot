/*
  Warnings:

  - You are about to drop the column `currentTime` on the `WeatherForecast` table. All the data in the column will be lost.
  - Added the required column `expiration` to the `PVReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hour` to the `WeatherForecast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PVReading" ADD COLUMN     "expiration" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "WeatherForecast" DROP COLUMN "currentTime",
ADD COLUMN     "hour" TEXT NOT NULL;
