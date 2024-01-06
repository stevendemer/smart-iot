/*
  Warnings:

  - You are about to drop the column `prices` on the `energy_prices` table. All the data in the column will be lost.
  - You are about to drop the column `today` on the `energy_prices` table. All the data in the column will be lost.
  - You are about to drop the column `tomorrow` on the `energy_prices` table. All the data in the column will be lost.
  - Added the required column `date` to the `energy_prices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `energy_prices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "energy_prices" DROP COLUMN "prices",
DROP COLUMN "today",
DROP COLUMN "tomorrow",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;
