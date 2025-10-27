-- CreateEnum
CREATE TYPE "ShipOption" AS ENUM ('PICKUP', 'COURIER', 'JNE', 'JNT', 'SICEPAT', 'GOJEK', 'GRAB', 'POS', 'LALAMOVE', 'BARAKA', 'OTHER');

-- AlterTable
ALTER TABLE "PreOrder" ADD COLUMN     "brandingReq" TEXT,
ADD COLUMN     "csNotes" TEXT,
ADD COLUMN     "salesName" TEXT,
ADD COLUMN     "shipAddress" TEXT,
ADD COLUMN     "shipOption" "ShipOption";
