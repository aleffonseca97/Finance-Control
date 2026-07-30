-- AlterTable
ALTER TABLE "InstallmentPlan" ADD COLUMN     "creditCardId" TEXT;

-- CreateIndex
CREATE INDEX "InstallmentPlan_creditCardId_idx" ON "InstallmentPlan"("creditCardId");

-- AddForeignKey
ALTER TABLE "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
