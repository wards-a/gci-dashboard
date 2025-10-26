/*
  Warnings:

  - You are about to drop the column `pin` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "pin";

-- CreateTable
CREATE TABLE "public"."ProductionEntry" (
    "id" TEXT NOT NULL,
    "woOperationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shift" TEXT,
    "qtyGood" INTEGER NOT NULL DEFAULT 0,
    "qtyReject" INTEGER NOT NULL DEFAULT 0,
    "defects" TEXT,
    "note" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ProductionEntry" ADD CONSTRAINT "ProductionEntry_woOperationId_fkey" FOREIGN KEY ("woOperationId") REFERENCES "public"."WoOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
