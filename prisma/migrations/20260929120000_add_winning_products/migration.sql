-- CreateEnum
CREATE TYPE "WinningProductStatus" AS ENUM ('CANDIDATE', 'IN_TEST', 'WINNER', 'DISCARDED');

-- CreateEnum
CREATE TYPE "DiscoveryOrigin" AS ENUM ('TIKTOK', 'INSTAGRAM', 'META_ADS', 'OTHER');

-- CreateEnum
CREATE TYPE "CompetitionLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('RISING', 'STABLE', 'FALLING');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "winningStatus" "WinningProductStatus",
ADD COLUMN     "weightGrams" INTEGER,
ADD COLUMN     "shippingDays" INTEGER,
ADD COLUMN     "storeRating" DOUBLE PRECISION,
ADD COLUMN     "reviewCount" INTEGER,
ADD COLUMN     "discoveryOrigin" "DiscoveryOrigin",
ADD COLUMN     "discoveryUrl" TEXT;

-- CreateTable
CREATE TABLE "ProductSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "orders" INTEGER,
    "rating" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductManualSignal" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "wowEffect" INTEGER,
    "foundInPhysicalStores" BOOLEAN,
    "competitionLevel" "CompetitionLevel",
    "googleTrendsManual" "TrendDirection",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductManualSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAdTest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT,
    "platform" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "dailyBudget" DOUBLE PRECISION,
    "totalSpend" DOUBLE PRECISION,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "addToCarts" INTEGER,
    "purchases" INTEGER,
    "revenue" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAdTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSupplierChecklist" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sampleOrdered" BOOLEAN NOT NULL DEFAULT false,
    "sampleReceived" BOOLEAN NOT NULL DEFAULT false,
    "qualityOk" BOOLEAN NOT NULL DEFAULT false,
    "actualShippingDays" INTEGER,
    "notes" TEXT,
    "readyToScale" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSupplierChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WinningScoreConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightMargin" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "weightPriceRangeFit" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "weightDemand" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "weightDemandGrowth" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "weightProviderQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "weightLogistics" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "weightWowEffect" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "weightPhysicalStores" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "weightCompetitionLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "weightGoogleTrends" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "marginTargetMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "idealPriceMin" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "idealPriceMax" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "priceCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "targetCountry" TEXT NOT NULL DEFAULT 'ES',
    "maxIdealWeightGrams" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "minRoasForWinner" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WinningScoreConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_winningStatus_idx" ON "Product"("winningStatus");

-- CreateIndex
CREATE INDEX "ProductSnapshot_productId_capturedAt_idx" ON "ProductSnapshot"("productId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductManualSignal_productId_key" ON "ProductManualSignal"("productId");

-- CreateIndex
CREATE INDEX "ProductAdTest_productId_idx" ON "ProductAdTest"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupplierChecklist_productId_key" ON "ProductSupplierChecklist"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WinningScoreConfig_userId_key" ON "WinningScoreConfig"("userId");

-- AddForeignKey
ALTER TABLE "ProductSnapshot" ADD CONSTRAINT "ProductSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductManualSignal" ADD CONSTRAINT "ProductManualSignal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAdTest" ADD CONSTRAINT "ProductAdTest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplierChecklist" ADD CONSTRAINT "ProductSupplierChecklist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WinningScoreConfig" ADD CONSTRAINT "WinningScoreConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
