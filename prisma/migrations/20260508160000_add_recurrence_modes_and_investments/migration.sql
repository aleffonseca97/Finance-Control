-- Add flexible recurring payments (fixed amount or percentage)
ALTER TABLE "RecurringPayment"
ADD COLUMN "amountType" TEXT NOT NULL DEFAULT 'fixed',
ADD COLUMN "percentage" DOUBLE PRECISION;

ALTER TABLE "RecurringPayment"
ALTER COLUMN "amount" SET DEFAULT 0;

-- Recurring investments templates
CREATE TABLE "RecurringInvestment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reserveCategoryId" TEXT NOT NULL,
  "walletCategoryId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amountType" TEXT NOT NULL DEFAULT 'fixed',
  "percentage" DOUBLE PRECISION,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecurringInvestment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecurringInvestmentOccurrence" (
  "id" TEXT NOT NULL,
  "recurringInvestmentId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL,
  "investmentId" TEXT,
  CONSTRAINT "RecurringInvestmentOccurrence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecurringInvestmentOccurrence_investmentId_key"
ON "RecurringInvestmentOccurrence"("investmentId");

CREATE UNIQUE INDEX "RecurringInvestmentOccurrence_recurringInvestmentId_year_month_key"
ON "RecurringInvestmentOccurrence"("recurringInvestmentId", "year", "month");

CREATE INDEX "RecurringInvestment_userId_idx"
ON "RecurringInvestment"("userId");

CREATE INDEX "RecurringInvestment_reserveCategoryId_idx"
ON "RecurringInvestment"("reserveCategoryId");

CREATE INDEX "RecurringInvestment_walletCategoryId_idx"
ON "RecurringInvestment"("walletCategoryId");

CREATE INDEX "RecurringInvestmentOccurrence_year_month_idx"
ON "RecurringInvestmentOccurrence"("year", "month");

ALTER TABLE "RecurringInvestment"
ADD CONSTRAINT "RecurringInvestment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringInvestment"
ADD CONSTRAINT "RecurringInvestment_reserveCategoryId_fkey"
FOREIGN KEY ("reserveCategoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringInvestment"
ADD CONSTRAINT "RecurringInvestment_walletCategoryId_fkey"
FOREIGN KEY ("walletCategoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringInvestmentOccurrence"
ADD CONSTRAINT "RecurringInvestmentOccurrence_recurringInvestmentId_fkey"
FOREIGN KEY ("recurringInvestmentId") REFERENCES "RecurringInvestment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringInvestmentOccurrence"
ADD CONSTRAINT "RecurringInvestmentOccurrence_investmentId_fkey"
FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
