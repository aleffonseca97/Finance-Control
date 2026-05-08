-- =============================================================================
-- Usuário de teste com 3 meses de dados financeiros
-- Login: teste.3meses@exemplo.local  |  Senha: Teste123!
-- Execute no banco apontado por DATABASE_URL (PostgreSQL).
-- =============================================================================

BEGIN;

-- Reexecucao segura (Subscription depende de User)
DELETE FROM "Subscription" WHERE "userId" = 'cm_test_3months_user';
DELETE FROM "User" WHERE "id" = 'cm_test_3months_user';

INSERT INTO "User" (
  "id",
  "email",
  "passwordHash",
  "name",
  "hasSeenWelcome",
  "marketingOptIn",
  "createdAt"
) VALUES (
  'cm_test_3months_user',
  'teste.3meses@exemplo.local',
  '$2a$12$TyL8.gQ8Jal3XIG7FRrZee0.Khy2gE/RsKetPZsxvuSaxllynTl7S',
  'Usuario Teste 3 Meses',
  true,
  false,
  NOW()
);

INSERT INTO "Subscription" (
  "id",
  "userId",
  "stripeSubscriptionId",
  "stripePriceId",
  "status",
  "currentPeriodEnd",
  "trialEnd",
  "cancelAtPeriodEnd",
  "createdAt",
  "updatedAt"
) VALUES (
  'cm_test_3months_sub',
  'cm_test_3months_user',
  'sub_test_3months_001',
  'price_test_placeholder',
  'active',
  (NOW() + INTERVAL '365 days'),
  NULL,
  false,
  NOW(),
  NOW()
);

-- Categorias base
INSERT INTO "Category" ("id", "userId", "name", "group", "icon", "type", "investmentSubtype", "isCustom", "isFixed", "defaultValue", "color")
VALUES
  ('cm_t3m_cat_income_salary', 'cm_test_3months_user', 'Salario', 'Receitas', 'Wallet', 'income', NULL, true, false, NULL, '#22c55e'),
  ('cm_t3m_cat_income_freela', 'cm_test_3months_user', 'Freelance', 'Receitas', 'Briefcase', 'income', NULL, true, false, NULL, '#10b981'),
  ('cm_t3m_cat_exp_rent', 'cm_test_3months_user', 'Aluguel', 'Moradia', 'Home', 'expense', NULL, true, true, 1800, '#ef4444'),
  ('cm_t3m_cat_exp_market', 'cm_test_3months_user', 'Mercado', 'Alimentacao', 'ShoppingBasket', 'expense', NULL, true, false, NULL, '#f97316'),
  ('cm_t3m_cat_exp_transport', 'cm_test_3months_user', 'Transporte', 'Mobilidade', 'Bus', 'expense', NULL, true, false, NULL, '#eab308'),
  ('cm_t3m_cat_inv_reserve', 'cm_test_3months_user', 'Reserva de Emergencia', 'Investimentos', 'Shield', 'investment', 'reserva', true, false, NULL, '#3b82f6'),
  ('cm_t3m_cat_inv_wallet', 'cm_test_3months_user', 'Carteira Longo Prazo', 'Investimentos', 'LineChart', 'investment', 'carteira', true, false, NULL, '#8b5cf6');

-- Cartao de credito (opcional, util para testes de limite/fatura)
INSERT INTO "CreditCard" (
  "id", "userId", "name", "lastFour", "limit", "totalLimit", "closingDay", "dueDay", "color"
) VALUES (
  'cm_t3m_cc_main', 'cm_test_3months_user', 'Cartao Principal', '1234', 3000, 3000, 7, 15, '#6366f1'
);

-- Modelos recorrentes
INSERT INTO "RecurringPayment" ("id", "userId", "categoryId", "amount", "amountType", "percentage", "sortOrder", "createdAt")
VALUES
  ('cm_t3m_rp_rent', 'cm_test_3months_user', 'cm_t3m_cat_exp_rent', 1800, 'fixed', NULL, 1, NOW()),
  ('cm_t3m_rp_market', 'cm_test_3months_user', 'cm_t3m_cat_exp_market', 700, 'fixed', NULL, 2, NOW());

INSERT INTO "RecurringInvestment" ("id", "userId", "reserveCategoryId", "walletCategoryId", "amount", "amountType", "percentage", "sortOrder", "createdAt")
VALUES (
  'cm_t3m_ri_default',
  'cm_test_3months_user',
  'cm_t3m_cat_inv_reserve',
  'cm_t3m_cat_inv_wallet',
  1000,
  'fixed',
  NULL,
  1,
  NOW()
);

-- Lanca 3 meses (mes atual + 2 anteriores)
WITH months AS (
  SELECT
    gs AS idx,
    date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month') AS month_start
  FROM generate_series(0, 2) AS gs
)
INSERT INTO "Transaction" ("id", "userId", "categoryId", "amount", "description", "date", "type", "creditCardId", "paysCreditCardId", "creditCarryoverCardId", "creditCarryoverPeriodEnd")
SELECT
  'cm_t3m_tx_salary_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_income_salary',
  (5200 - (idx * 120))::double precision,
  'Salario mensal',
  month_start + INTERVAL '2 day',
  'income',
  NULL::text,
  NULL::text,
  NULL::text,
  NULL::timestamp
FROM months
UNION ALL
SELECT
  'cm_t3m_tx_freela_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_income_freela',
  (900 + (idx * 80))::double precision,
  'Freela pontual',
  month_start + INTERVAL '21 day',
  'income',
  NULL::text,
  NULL::text,
  NULL::text,
  NULL::timestamp
FROM months
UNION ALL
SELECT
  'cm_t3m_tx_rent_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_rent',
  1800::double precision,
  'Aluguel',
  month_start + INTERVAL '5 day',
  'expense',
  NULL::text,
  NULL::text,
  NULL::text,
  NULL::timestamp
FROM months
UNION ALL
SELECT
  'cm_t3m_tx_market_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_market',
  (640 + (idx * 45))::double precision,
  'Compras de mercado',
  month_start + INTERVAL '12 day',
  'expense',
  'cm_t3m_cc_main',
  NULL::text,
  NULL::text,
  NULL::timestamp
FROM months
UNION ALL
SELECT
  'cm_t3m_tx_transport_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_transport',
  (210 + (idx * 25))::double precision,
  'Transporte',
  month_start + INTERVAL '18 day',
  'expense',
  NULL::text,
  NULL::text,
  NULL::text,
  NULL::timestamp
FROM months;

WITH months AS (
  SELECT
    gs AS idx,
    date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month') AS month_start
  FROM generate_series(0, 2) AS gs
)
INSERT INTO "Investment" ("id", "userId", "categoryId", "reserveCategoryId", "walletCategoryId", "amount", "affectsCash", "date", "notes")
SELECT
  'cm_t3m_inv_reserve_' || idx,
  'cm_test_3months_user',
  NULL::text,
  'cm_t3m_cat_inv_reserve',
  'cm_t3m_cat_inv_wallet',
  (600 + (idx * 50))::double precision,
  true,
  month_start + INTERVAL '8 day',
  'Aporte em reserva'
FROM months
UNION ALL
SELECT
  'cm_t3m_inv_wallet_' || idx,
  'cm_test_3months_user',
  NULL::text,
  'cm_t3m_cat_inv_reserve',
  'cm_t3m_cat_inv_wallet',
  (400 + (idx * 30))::double precision,
  true,
  month_start + INTERVAL '24 day',
  'Aporte em carteira'
FROM months;

-- Vincula meses aos modelos recorrentes (ocorrencias sem transacao/investimento associado)
WITH months AS (
  SELECT
    EXTRACT(YEAR FROM date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month'))::int AS year_value,
    EXTRACT(MONTH FROM date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month'))::int AS month_value
  FROM generate_series(0, 2) AS gs
)
INSERT INTO "RecurringPaymentOccurrence" ("id", "recurringPaymentId", "year", "month", "transactionId")
SELECT
  'cm_t3m_rpo_rent_' || year_value || '_' || month_value,
  'cm_t3m_rp_rent',
  year_value,
  month_value,
  NULL::text
FROM months
UNION ALL
SELECT
  'cm_t3m_rpo_market_' || year_value || '_' || month_value,
  'cm_t3m_rp_market',
  year_value,
  month_value,
  NULL::text
FROM months;

WITH months AS (
  SELECT
    EXTRACT(YEAR FROM date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month'))::int AS year_value,
    EXTRACT(MONTH FROM date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month'))::int AS month_value
  FROM generate_series(0, 2) AS gs
)
INSERT INTO "RecurringInvestmentOccurrence" ("id", "recurringInvestmentId", "year", "month", "investmentId")
SELECT
  'cm_t3m_rio_default_' || year_value || '_' || month_value,
  'cm_t3m_ri_default',
  year_value,
  month_value,
  NULL::text
FROM months;

INSERT INTO "Goal" ("id", "userId", "reserveCategoryId", "name", "targetAmount", "currentAmount", "deadline", "createdAt")
VALUES (
  'cm_t3m_goal_emergency',
  'cm_test_3months_user',
  'cm_t3m_cat_inv_reserve',
  'Reserva de emergencia (6 meses)',
  18000,
  4800,
  (CURRENT_DATE + INTERVAL '10 months')::timestamp,
  NOW()
);

COMMIT;
