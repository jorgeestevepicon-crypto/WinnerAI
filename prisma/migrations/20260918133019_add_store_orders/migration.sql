-- CreateEnum
CREATE TYPE "StoreOrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED', 'REFUNDED');

-- CreateTable
CREATE TABLE "StoreOrder" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "shippingAddress" JSONB,
    "status" "StoreOrderStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreOrder_stripeCheckoutSessionId_key" ON "StoreOrder"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "StoreOrder_storeId_idx" ON "StoreOrder"("storeId");

-- CreateIndex
CREATE INDEX "StoreOrder_userId_idx" ON "StoreOrder"("userId");

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
