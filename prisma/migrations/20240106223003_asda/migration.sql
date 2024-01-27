/*
  Warnings:

  - You are about to alter the column `price` on the `energy_prices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,4)`.

*/
-- AlterTable
ALTER TABLE "energy_prices" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,4);
