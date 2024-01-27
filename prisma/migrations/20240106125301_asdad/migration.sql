/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `charging_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionId` to the `charging_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "charging_sessions" ADD COLUMN     "sessionId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "charging_sessions_sessionId_key" ON "charging_sessions"("sessionId");
