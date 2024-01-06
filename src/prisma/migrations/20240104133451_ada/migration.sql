/*
  Warnings:

  - Added the required column `amount` to the `AmpecoSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AmpecoSession" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "userId" TEXT;
