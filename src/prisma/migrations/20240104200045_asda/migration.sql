/*
  Warnings:

  - Added the required column `hour` to the `energy_prices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "energy_prices" ADD COLUMN     "hour" TEXT NOT NULL;
