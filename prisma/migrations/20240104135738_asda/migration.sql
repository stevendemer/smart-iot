/*
  Warnings:

  - Added the required column `startedAt` to the `AmpecoSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stoppedAt` to the `AmpecoSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AmpecoSession" ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "stoppedAt" TIMESTAMP(3) NOT NULL;
