-- DropForeignKey
ALTER TABLE "Investment" DROP CONSTRAINT "Investment_categoryId_fkey";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "investmentSubtype" TEXT;

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "reserveCategoryId" TEXT,
ADD COLUMN     "walletCategoryId" TEXT,
ALTER COLUMN "categoryId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Investment_reserveCategoryId_idx" ON "Investment"("reserveCategoryId");

-- CreateIndex
CREATE INDEX "Investment_walletCategoryId_idx" ON "Investment"("walletCategoryId");

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_reserveCategoryId_fkey" FOREIGN KEY ("reserveCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_walletCategoryId_fkey" FOREIGN KEY ("walletCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
