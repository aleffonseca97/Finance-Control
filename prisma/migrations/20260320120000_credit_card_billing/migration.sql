-- AlterTable: totalLimit (backfill from disponível + gastos no cartão)
ALTER TABLE "CreditCard" ADD COLUMN "totalLimit" DOUBLE PRECISION;

UPDATE "CreditCard" c
SET "totalLimit" = c."limit" + COALESCE(
  (
    SELECT SUM(t.amount)
    FROM "Transaction" t
    WHERE t."creditCardId" = c.id AND t.type = 'expense'
  ),
  0
);

ALTER TABLE "CreditCard" ALTER COLUMN "totalLimit" SET NOT NULL;

-- AlterTable Transaction
ALTER TABLE "Transaction" ADD COLUMN "paysCreditCardId" TEXT,
ADD COLUMN "creditCarryoverCardId" TEXT,
ADD COLUMN "creditCarryoverPeriodEnd" TIMESTAMP(3);

CREATE INDEX "Transaction_paysCreditCardId_idx" ON "Transaction"("paysCreditCardId");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paysCreditCardId_fkey" FOREIGN KEY ("paysCreditCardId") REFERENCES "CreditCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Transaction_credit_carryover_key" ON "Transaction"("userId", "creditCarryoverCardId", "creditCarryoverPeriodEnd");
