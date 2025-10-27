-- CreateEnum
CREATE TYPE "PreOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PreOrderChannel" AS ENUM ('ONLINE', 'OFFLINE', 'MARKETPLACE', 'OTHER');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreOrder" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerId" TEXT,
    "channel" "PreOrderChannel" NOT NULL DEFAULT 'ONLINE',
    "status" "PreOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promisedShip" TIMESTAMP(3),
    "depositAmt" INTEGER,
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreOrderItem" (
    "id" TEXT NOT NULL,
    "preOrderId" TEXT NOT NULL,
    "productVarId" TEXT NOT NULL,
    "qtyOrdered" INTEGER NOT NULL,
    "qtyAllocated" INTEGER NOT NULL DEFAULT 0,
    "qtyFulfilled" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" INTEGER,
    "note" TEXT,

    CONSTRAINT "PreOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "preOrderItemId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "preOrderId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL,
    "method" TEXT,
    "note" TEXT,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PreOrder_code_key" ON "PreOrder"("code");

-- AddForeignKey
ALTER TABLE "PreOrder" ADD CONSTRAINT "PreOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOrderItem" ADD CONSTRAINT "PreOrderItem_preOrderId_fkey" FOREIGN KEY ("preOrderId") REFERENCES "PreOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOrderItem" ADD CONSTRAINT "PreOrderItem_productVarId_fkey" FOREIGN KEY ("productVarId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_preOrderItemId_fkey" FOREIGN KEY ("preOrderItemId") REFERENCES "PreOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_preOrderId_fkey" FOREIGN KEY ("preOrderId") REFERENCES "PreOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
