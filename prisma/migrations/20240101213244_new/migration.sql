/*
  Warnings:

  - You are about to drop the column `createdAt` on the `PVReading` table. All the data in the column will be lost.
  - You are about to drop the column `expiration` on the `PVReading` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PVReading` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PVReading" DROP COLUMN "createdAt",
DROP COLUMN "expiration",
DROP COLUMN "updatedAt";
