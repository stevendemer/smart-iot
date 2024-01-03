/*
  Warnings:

  - The `runState` column on the `PVReading` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PVReading" DROP COLUMN "runState",
ADD COLUMN     "runState" BOOLEAN NOT NULL DEFAULT false;
