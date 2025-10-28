/*
  Warnings:

  - You are about to drop the column `createdBy` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `productVarId` on the `WorkOrder` table. All the data in the column will be lost.
  - The `status` column on the `WorkOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELED');

-- DropForeignKey
ALTER TABLE "public"."WorkOrder" DROP CONSTRAINT "WorkOrder_productVarId_fkey";

-- AlterTable
ALTER TABLE "WorkOrder" DROP COLUMN "createdBy",
DROP COLUMN "productVarId",
ADD COLUMN     "note" TEXT,
ADD COLUMN     "preOrderId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "WorkOrderStatus" NOT NULL DEFAULT 'PLANNED';

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_preOrderId_fkey" FOREIGN KEY ("preOrderId") REFERENCES "PreOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
