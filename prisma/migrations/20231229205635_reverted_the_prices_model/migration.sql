/*
  Warnings:

  - You are about to drop the column `currentTime` on the `EnergyPrice` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `EnergyPrice` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `EnergyPrice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EnergyPrice" DROP COLUMN "currentTime",
DROP COLUMN "position",
DROP COLUMN "price",
ADD COLUMN     "prices" JSONB[];
