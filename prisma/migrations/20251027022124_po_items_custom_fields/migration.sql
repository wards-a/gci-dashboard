-- DropForeignKey
ALTER TABLE "public"."PreOrderItem" DROP CONSTRAINT "PreOrderItem_productVarId_fkey";

-- AlterTable
ALTER TABLE "PreOrderItem" ADD COLUMN     "accessories" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "finishing" TEXT,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "partition" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "specsJson" TEXT,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "productVarId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PreOrderItem" ADD CONSTRAINT "PreOrderItem_productVarId_fkey" FOREIGN KEY ("productVarId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
