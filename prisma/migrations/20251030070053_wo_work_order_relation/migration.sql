/*
  Warnings:

  - A unique constraint covering the columns `[preOrderId]` on the table `WorkOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_preOrderId_key" ON "WorkOrder"("preOrderId");
