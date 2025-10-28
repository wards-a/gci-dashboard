/*
  Warnings:

  - The values [COURIER,JNE,LALAMOVE] on the enum `ShipOption` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ShipOption_new" AS ENUM ('PICKUP', 'SOUVIA', 'LALAMOVE_MOTOR', 'LALAMOVE_MOBIL', 'BARAKA', 'JNE_REG', 'JNE_YES', 'JNE_JTR', 'JNT', 'SICEPAT', 'GOJEK', 'GRAB', 'POS', 'OTHER');
ALTER TABLE "PreOrder" ALTER COLUMN "shipOption" TYPE "ShipOption_new" USING ("shipOption"::text::"ShipOption_new");
ALTER TYPE "ShipOption" RENAME TO "ShipOption_old";
ALTER TYPE "ShipOption_new" RENAME TO "ShipOption";
DROP TYPE "public"."ShipOption_old";
COMMIT;
