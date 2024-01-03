/*
  Warnings:

  - Added the required column `devTypeId` to the `PVReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalInputPower` to the `PVReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalYield` to the `PVReading` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PVReading" ADD COLUMN     "devTypeId" INTEGER NOT NULL,
ADD COLUMN     "totalInputPower" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalYield" DOUBLE PRECISION NOT NULL;
