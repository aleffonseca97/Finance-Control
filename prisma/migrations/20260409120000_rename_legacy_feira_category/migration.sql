-- One-time rename: global default category was previously seeded as "Feira" in app runtime.
UPDATE "Category"
SET "name" = 'Feira/Hortifruti'
WHERE "userId" IS NULL
  AND "isCustom" = false
  AND "type" = 'expense'
  AND "name" = 'Feira'
  AND "group" = 'Alimentação';
