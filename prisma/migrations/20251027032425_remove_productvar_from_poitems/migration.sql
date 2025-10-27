/*
  Warnings:

  - You are about to drop the column `productVarId` on the `PreOrderItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PreOrderItem" DROP CONSTRAINT "PreOrderItem_productVarId_fkey";

-- AlterTable
ALTER TABLE "PreOrderItem" DROP COLUMN "productVarId";
