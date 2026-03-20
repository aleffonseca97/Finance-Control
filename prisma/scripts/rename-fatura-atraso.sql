-- Normaliza textos antigos gerados pela regra "Fatura em atraso"
UPDATE "Transaction"
SET description = REPLACE(description, 'Fatura em atraso', 'Fatura fechada')
WHERE description LIKE '%Fatura em atraso%';
