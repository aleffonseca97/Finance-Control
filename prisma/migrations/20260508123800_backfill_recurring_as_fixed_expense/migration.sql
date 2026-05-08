-- Backfill: align recurring payments with fixed expenses.
-- For each category used by recurring payments, mark as fixed and
-- use the most recently created recurring payment amount as defaultValue.
WITH latest_recurring AS (
  SELECT DISTINCT ON (rp."categoryId")
    rp."categoryId",
    rp.amount
  FROM "RecurringPayment" rp
  ORDER BY rp."categoryId", rp."createdAt" DESC
)
UPDATE "Category" c
SET
  "isFixed" = true,
  "defaultValue" = lr.amount
FROM latest_recurring lr
WHERE c.id = lr."categoryId"
  AND c.type = 'expense';
