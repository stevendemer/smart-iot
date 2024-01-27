/*
  Warnings:

  - You are about to drop the column `token` on the `PVReading` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `PVReading` table. All the data in the column will be lost.
  - Added the required column `activePower` to the `PVReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `efficiency` to the `PVReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inverterState` to the `PVReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reactivePower` to the `PVReading` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PVReading_username_key";

-- AlterTable
ALTER TABLE "PVReading" DROP COLUMN "token",
DROP COLUMN "username",
ADD COLUMN     "accountId" INTEGER,
ADD COLUMN     "activePower" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "efficiency" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "inverterState" INTEGER NOT NULL,
ADD COLUMN     "reactivePower" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "PVAccount" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PVAccount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PVReading" ADD CONSTRAINT "PVReading_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PVAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
