-- AlterTable
ALTER TABLE "Goal" ADD COLUMN "reserveCategoryId" TEXT;

-- CreateIndex
CREATE INDEX "Goal_reserveCategoryId_idx" ON "Goal"("reserveCategoryId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_reserveCategoryId_fkey" FOREIGN KEY ("reserveCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
