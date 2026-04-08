ALTER TABLE "Category"
ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "Category"
ADD COLUMN "group" TEXT,
ADD COLUMN "isCustom" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Category"
SET "isCustom" = true
WHERE "userId" IS NOT NULL;

CREATE INDEX "Category_type_group_idx" ON "Category"("type", "group");
CREATE INDEX "Category_type_investmentSubtype_idx" ON "Category"("type", "investmentSubtype");
