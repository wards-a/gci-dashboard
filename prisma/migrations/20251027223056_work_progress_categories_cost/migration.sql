/*
  Warnings:

  - You are about to drop the column `productVarId` on the `Bom` table. All the data in the column will be lost.
  - You are about to drop the column `woOperationId` on the `ProductionEntry` table. All the data in the column will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Operation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductVariant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockMove` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WoOperation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkCenter` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProgressCategory" AS ENUM ('LINE_IN_HOUSE', 'BORONGAN_IN_HOUSE', 'BORONGAN_OUT_HOUSE', 'CMT_VENDOR');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('IDR', 'USD');

-- DropForeignKey
ALTER TABLE "public"."Bom" DROP CONSTRAINT "Bom_productVarId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Operation" DROP CONSTRAINT "Operation_workCenterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductionEntry" DROP CONSTRAINT "ProductionEntry_woOperationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StockMove" DROP CONSTRAINT "StockMove_fromLocId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StockMove" DROP CONSTRAINT "StockMove_materialId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StockMove" DROP CONSTRAINT "StockMove_toLocId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WoOperation" DROP CONSTRAINT "WoOperation_operationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WoOperation" DROP CONSTRAINT "WoOperation_woId_fkey";

-- DropIndex
DROP INDEX "public"."Bom_productVarId_key";

-- AlterTable
ALTER TABLE "Bom" DROP COLUMN "productVarId";

-- AlterTable
ALTER TABLE "ProductionEntry" DROP COLUMN "woOperationId";

-- AlterTable
ALTER TABLE "WorkProgress" ADD COLUMN     "amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "category" "ProgressCategory" NOT NULL DEFAULT 'LINE_IN_HOUSE',
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'IDR',
ADD COLUMN     "extraCost" INTEGER,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "partnerId" TEXT,
ADD COLUMN     "payable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentRef" TEXT,
ADD COLUMN     "unitCost" INTEGER;

-- DropTable
DROP TABLE "public"."Location";

-- DropTable
DROP TABLE "public"."Operation";

-- DropTable
DROP TABLE "public"."Product";

-- DropTable
DROP TABLE "public"."ProductVariant";

-- DropTable
DROP TABLE "public"."StockMove";

-- DropTable
DROP TABLE "public"."WoOperation";

-- DropTable
DROP TABLE "public"."WorkCenter";

-- DropEnum
DROP TYPE "public"."OpStatus";

-- DropEnum
DROP TYPE "public"."WoStatus";

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkProgress" ADD CONSTRAINT "WorkProgress_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
