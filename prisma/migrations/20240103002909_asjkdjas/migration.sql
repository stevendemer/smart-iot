/*
  Warnings:

  - Added the required column `devId` to the `PVReading` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PVReading" ADD COLUMN     "devId" INTEGER NOT NULL;
