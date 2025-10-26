-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "pin" TEXT;

-- AlterTable
ALTER TABLE "public"."WoOperation" ADD COLUMN     "qtyGood" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qtyReject" INTEGER NOT NULL DEFAULT 0;
