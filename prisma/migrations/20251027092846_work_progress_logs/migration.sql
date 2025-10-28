-- CreateEnum
CREATE TYPE "ProgressStage" AS ENUM ('CUTTING', 'BRANDING', 'SEWING', 'REWORK', 'REJECT');

-- CreateTable
CREATE TABLE "WorkProgress" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "stage" "ProgressStage" NOT NULL,
    "qty" INTEGER NOT NULL,
    "note" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkProgress_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkProgress" ADD CONSTRAINT "WorkProgress_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
