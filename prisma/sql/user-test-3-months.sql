-- =============================================================================
-- Usuário de teste com 3 meses de dados (cobre as features do sistema)
-- Login: teste.3meses@exemplo.local  |  Senha: Teste123!
-- Execute no banco apontado por DATABASE_URL (PostgreSQL).
--
-- Inclui: assinatura, categorias, 2 cartões, despesas/receitas à vista e no
-- cartão, pagamento de fatura, recorrências (fixo e %), investimentos
-- (aporte, saque, só monitoramento), metas, ocorrências pagas/pendentes e
-- parcelamentos de cartão (InstallmentPlan kind=CREDIT_CARD).
-- =============================================================================

BEGIN;

-- Reexecução segura (filhos de User caem por ON DELETE CASCADE)
DELETE FROM "Subscription" WHERE "userId" = 'cm_test_3months_user';
DELETE FROM "User" WHERE "id" = 'cm_test_3months_user';

INSERT INTO "User" (
  "id",
  "email",
  "passwordHash",
  "name",
  "hasSeenWelcome",
  "marketingOptIn",
  "locale",
  "preferredCurrency",
  "createdAt"
) VALUES (
  'cm_test_3months_user',
  'teste.3meses@exemplo.local',
  '$2a$12$TyL8.gQ8Jal3XIG7FRrZee0.Khy2gE/RsKetPZsxvuSaxllynTl7S',
  'Usuario Teste 3 Meses',
  true,
  false,
  'pt-BR',
  'BRL',
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

-- Categorias (receita, despesa fixa/variável, investimento reserva/carteira)
INSERT INTO "Category" ("id", "userId", "name", "group", "icon", "type", "investmentSubtype", "isCustom", "isFixed", "defaultValue", "color")
VALUES
  ('cm_t3m_cat_income_salary', 'cm_test_3months_user', 'Salario', 'Receitas', 'Wallet', 'income', NULL, true, false, NULL, '#22c55e'),
  ('cm_t3m_cat_income_freela', 'cm_test_3months_user', 'Freelance', 'Receitas', 'Briefcase', 'income', NULL, true, false, NULL, '#10b981'),
  ('cm_t3m_cat_exp_rent', 'cm_test_3months_user', 'Aluguel', 'Moradia', 'Home', 'expense', NULL, true, true, 1800, '#ef4444'),
  ('cm_t3m_cat_exp_internet', 'cm_test_3months_user', 'Internet', 'Moradia', 'Wifi', 'expense', NULL, true, true, 120, '#f43f5e'),
  ('cm_t3m_cat_exp_market', 'cm_test_3months_user', 'Mercado', 'Alimentacao', 'ShoppingBasket', 'expense', NULL, true, false, NULL, '#f97316'),
  ('cm_t3m_cat_exp_transport', 'cm_test_3months_user', 'Transporte', 'Mobilidade', 'Bus', 'expense', NULL, true, false, NULL, '#eab308'),
  ('cm_t3m_cat_exp_leisure', 'cm_test_3months_user', 'Lazer', 'Lifestyle', 'Gamepad2', 'expense', NULL, true, false, NULL, '#ec4899'),
  ('cm_t3m_cat_exp_health', 'cm_test_3months_user', 'Saude', 'Bem-estar', 'Heart', 'expense', NULL, true, false, NULL, '#14b8a6'),
  ('cm_t3m_cat_exp_edu', 'cm_test_3months_user', 'Educacao', 'Desenvolvimento', 'GraduationCap', 'expense', NULL, true, false, NULL, '#0ea5e9'),
  ('cm_t3m_cat_exp_invoice', 'cm_test_3months_user', 'Pagamento de Fatura', 'Cartao', 'CreditCard', 'expense', NULL, true, false, NULL, '#64748b'),
  ('cm_t3m_cat_inv_reserve', 'cm_test_3months_user', 'Reserva de Emergencia', 'Investimentos', 'Shield', 'investment', 'reserva', true, false, NULL, '#3b82f6'),
  ('cm_t3m_cat_inv_wallet', 'cm_test_3months_user', 'Carteira Longo Prazo', 'Investimentos', 'LineChart', 'investment', 'carteira', true, false, NULL, '#8b5cf6'),
  ('cm_t3m_cat_inv_travel', 'cm_test_3months_user', 'Viagem Europa', 'Investimentos', 'Plane', 'investment', 'reserva', true, false, NULL, '#06b6d4');

-- Dois cartoes (parcelamentos e gasto por cartao)
INSERT INTO "CreditCard" (
  "id", "userId", "name", "lastFour", "limit", "totalLimit", "closingDay", "dueDay", "color"
) VALUES
  ('cm_t3m_cc_main', 'cm_test_3months_user', 'Cartao Principal', '1234', 5000, 5000, 7, 15, '#6366f1'),
  ('cm_t3m_cc_sec', 'cm_test_3months_user', 'Cartao Beneficios', '9876', 2500, 2500, 20, 28, '#0ea5e9');

-- Modelos recorrentes: fixo + percentual da renda
INSERT INTO "RecurringPayment" ("id", "userId", "categoryId", "amount", "amountType", "percentage", "sortOrder", "createdAt")
VALUES
  ('cm_t3m_rp_rent', 'cm_test_3months_user', 'cm_t3m_cat_exp_rent', 1800, 'fixed', NULL, 1, NOW()),
  ('cm_t3m_rp_internet', 'cm_test_3months_user', 'cm_t3m_cat_exp_internet', 120, 'fixed', NULL, 2, NOW()),
  ('cm_t3m_rp_market', 'cm_test_3months_user', 'cm_t3m_cat_exp_market', 0, 'percentage', 12, 3, NOW());

INSERT INTO "RecurringInvestment" ("id", "userId", "reserveCategoryId", "walletCategoryId", "amount", "amountType", "percentage", "sortOrder", "createdAt")
VALUES
  (
    'cm_t3m_ri_fixed',
    'cm_test_3months_user',
    'cm_t3m_cat_inv_reserve',
    'cm_t3m_cat_inv_wallet',
    1000,
    'fixed',
    NULL,
    1,
    NOW()
  ),
  (
    'cm_t3m_ri_pct',
    'cm_test_3months_user',
    'cm_t3m_cat_inv_travel',
    'cm_t3m_cat_inv_wallet',
    0,
    'percentage',
    5,
    2,
    NOW()
  );

-- Transacoes: mes atual (idx=0) + 2 anteriores
WITH months AS (
  SELECT
    gs AS idx,
    date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month') AS month_start
  FROM generate_series(0, 2) AS gs
)
INSERT INTO "Transaction" (
  "id", "userId", "categoryId", "amount", "description", "date", "type",
  "creditCardId", "paysCreditCardId", "creditCarryoverCardId", "creditCarryoverPeriodEnd"
)
-- Receitas
SELECT
  'cm_t3m_tx_salary_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_income_salary',
  (5200 - (idx * 120))::double precision,
  'Salario mensal',
  month_start + INTERVAL '2 day',
  'income',
  NULL::text, NULL::text, NULL::text, NULL::timestamp
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
  NULL::text, NULL::text, NULL::text, NULL::timestamp
FROM months
UNION ALL
-- Despesas a vista (recorrentes / caixa)
SELECT
  'cm_t3m_tx_rent_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_rent',
  1800::double precision,
  'Pagamento recorrente',
  month_start + INTERVAL '5 day',
  'expense',
  NULL::text, NULL::text, NULL::text, NULL::timestamp
FROM months
UNION ALL
SELECT
  'cm_t3m_tx_internet_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_internet',
  120::double precision,
  'Pagamento recorrente',
  month_start + INTERVAL '6 day',
  'expense',
  NULL::text, NULL::text, NULL::text, NULL::timestamp
FROM months
WHERE idx >= 1
UNION ALL
SELECT
  'cm_t3m_tx_transport_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_transport',
  (210 + (idx * 25))::double precision,
  'Transporte',
  month_start + INTERVAL '18 day',
  'expense',
  NULL::text, NULL::text, NULL::text, NULL::timestamp
FROM months
UNION ALL
-- Compras no cartao principal
SELECT
  'cm_t3m_tx_market_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_market',
  (640 + (idx * 45))::double precision,
  'Compras de mercado',
  month_start + INTERVAL '12 day',
  'expense',
  'cm_t3m_cc_main',
  NULL::text, NULL::text, NULL::timestamp
FROM months
UNION ALL
SELECT
  'cm_t3m_tx_leisure_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_leisure',
  (180 + (idx * 40))::double precision,
  'Lazer / streaming',
  month_start + INTERVAL '16 day',
  'expense',
  'cm_t3m_cc_main',
  NULL::text, NULL::text, NULL::timestamp
FROM months
UNION ALL
-- Compras no cartao beneficios
SELECT
  'cm_t3m_tx_health_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_health',
  (150 + (idx * 20))::double precision,
  'Farmacia / consulta',
  month_start + INTERVAL '14 day',
  'expense',
  'cm_t3m_cc_sec',
  NULL::text, NULL::text, NULL::timestamp
FROM months
UNION ALL
-- Compra grande (origem de parcelamento) no mes -2
SELECT
  'cm_t3m_tx_notebook',
  'cm_test_3months_user',
  'cm_t3m_cat_exp_edu',
  3000::double precision,
  'Notebook (parcelado 12x)',
  (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months') + INTERVAL '9 day',
  'expense',
  'cm_t3m_cc_main',
  NULL::text, NULL::text, NULL::timestamp
UNION ALL
SELECT
  'cm_t3m_tx_phone',
  'cm_test_3months_user',
  'cm_t3m_cat_exp_leisure',
  1800::double precision,
  'Smartphone (parcelado 10x)',
  (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month') + INTERVAL '11 day',
  'expense',
  'cm_t3m_cc_sec',
  NULL::text, NULL::text, NULL::timestamp
UNION ALL
-- Pagamentos de fatura em dinheiro (meses anteriores)
SELECT
  'cm_t3m_tx_pay_main_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_invoice',
  (900 + (idx * 80))::double precision,
  'Pagamento fatura Cartao Principal',
  month_start + INTERVAL '15 day',
  'expense',
  NULL::text,
  'cm_t3m_cc_main',
  NULL::text,
  NULL::timestamp
FROM months
WHERE idx >= 1
UNION ALL
SELECT
  'cm_t3m_tx_pay_sec_' || idx,
  'cm_test_3months_user',
  'cm_t3m_cat_exp_invoice',
  (200 + (idx * 30))::double precision,
  'Pagamento fatura Cartao Beneficios',
  month_start + INTERVAL '28 day',
  'expense',
  NULL::text,
  'cm_t3m_cc_sec',
  NULL::text,
  NULL::timestamp
FROM months
WHERE idx >= 1;

-- Investimentos: aportes (caixa + so monitoramento) e um saque
WITH months AS (
  SELECT
    gs AS idx,
    date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month') AS month_start
  FROM generate_series(0, 2) AS gs
)
INSERT INTO "Investment" (
  "id", "userId", "categoryId", "reserveCategoryId", "walletCategoryId",
  "amount", "affectsCash", "date", "notes"
)
SELECT
  'cm_t3m_inv_reserve_' || idx,
  'cm_test_3months_user',
  NULL::text,
  'cm_t3m_cat_inv_reserve',
  'cm_t3m_cat_inv_wallet',
  (600 + (idx * 50))::double precision,
  true,
  month_start + INTERVAL '8 day',
  'Aporte em reserva (recorrente)'
FROM months
UNION ALL
SELECT
  'cm_t3m_inv_travel_' || idx,
  'cm_test_3months_user',
  NULL::text,
  'cm_t3m_cat_inv_travel',
  'cm_t3m_cat_inv_wallet',
  (250 + (idx * 20))::double precision,
  true,
  month_start + INTERVAL '10 day',
  'Aporte viagem (5% renda)'
FROM months
WHERE idx >= 1
UNION ALL
SELECT
  'cm_t3m_inv_monitor',
  'cm_test_3months_user',
  NULL::text,
  'cm_t3m_cat_inv_reserve',
  'cm_t3m_cat_inv_wallet',
  1500::double precision,
  false,
  (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months') + INTERVAL '3 day',
  'Saldo inicial apenas monitoramento (nao debita caixa)'
UNION ALL
SELECT
  'cm_t3m_inv_withdraw',
  'cm_test_3months_user',
  NULL::text,
  'cm_t3m_cat_inv_reserve',
  'cm_t3m_cat_inv_wallet',
  (-350)::double precision,
  true,
  (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month') + INTERVAL '22 day',
  'Saque parcial da reserva';

-- Ocorrencias recorrentes de pagamento
-- Aluguel e internet (meses passados): pagas (ligadas as transacoes)
-- Mercado % e internet do mes atual: pendentes (para testar "marcar pago")
WITH months AS (
  SELECT
    gs AS idx,
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
  'cm_t3m_tx_rent_' || idx
FROM months
UNION ALL
SELECT
  'cm_t3m_rpo_internet_' || year_value || '_' || month_value,
  'cm_t3m_rp_internet',
  year_value,
  month_value,
  CASE WHEN idx >= 1 THEN 'cm_t3m_tx_internet_' || idx ELSE NULL END
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
    gs AS idx,
    EXTRACT(YEAR FROM date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month'))::int AS year_value,
    EXTRACT(MONTH FROM date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month'))::int AS month_value
  FROM generate_series(0, 2) AS gs
)
INSERT INTO "RecurringInvestmentOccurrence" ("id", "recurringInvestmentId", "year", "month", "investmentId")
SELECT
  'cm_t3m_rio_fixed_' || year_value || '_' || month_value,
  'cm_t3m_ri_fixed',
  year_value,
  month_value,
  'cm_t3m_inv_reserve_' || idx
FROM months
UNION ALL
SELECT
  'cm_t3m_rio_pct_' || year_value || '_' || month_value,
  'cm_t3m_ri_pct',
  year_value,
  month_value,
  CASE WHEN idx >= 1 THEN 'cm_t3m_inv_travel_' || idx ELSE NULL END
FROM months;

-- Parcelamentos de cartao (feature nova — tela Cartao + Parcelamentos)
-- Datas relativas ao mes atual para o ano corrente ter compromisso restante
INSERT INTO "InstallmentPlan" (
  "id",
  "userId",
  "kind",
  "name",
  "monthlyAmount",
  "totalInstallments",
  "paidInstallments",
  "firstInstallmentDate",
  "notes",
  "creditCardId",
  "createdAt",
  "updatedAt"
) VALUES
  (
    'cm_t3m_ip_notebook',
    'cm_test_3months_user',
    'CREDIT_CARD',
    'Notebook Dell',
    250,
    12,
    2,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months')::date,
    'Compra parcelada no Cartao Principal',
    'cm_t3m_cc_main',
    NOW(),
    NOW()
  ),
  (
    'cm_t3m_ip_sofa',
    'cm_test_3months_user',
    'CREDIT_CARD',
    'Sofa sala',
    320,
    6,
    4,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '4 months')::date,
    'Quase quitado — 2 parcelas restantes',
    'cm_t3m_cc_main',
    NOW(),
    NOW()
  ),
  (
    'cm_t3m_ip_phone',
    'cm_test_3months_user',
    'CREDIT_CARD',
    'Smartphone',
    180,
    10,
    1,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date,
    'Parcelado no Cartao Beneficios',
    'cm_t3m_cc_sec',
    NOW(),
    NOW()
  ),
  (
    'cm_t3m_ip_course',
    'cm_test_3months_user',
    'CREDIT_CARD',
    'Curso online',
    99,
    3,
    0,
    date_trunc('month', CURRENT_DATE)::date,
    'Recem cadastrado — nenhuma parcela paga',
    'cm_t3m_cc_sec',
    NOW(),
    NOW()
  ),
  (
    'cm_t3m_ip_done',
    'cm_test_3months_user',
    'CREDIT_CARD',
    'Fone Bluetooth (quitado)',
    75,
    4,
    4,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')::date,
    'Plano 100% pago — nao deve entrar no compromisso ativo',
    'cm_t3m_cc_main',
    NOW(),
    NOW()
  );

INSERT INTO "Goal" ("id", "userId", "reserveCategoryId", "name", "targetAmount", "currentAmount", "deadline", "createdAt")
VALUES
  (
    'cm_t3m_goal_emergency',
    'cm_test_3months_user',
    'cm_t3m_cat_inv_reserve',
    'Reserva de emergencia (6 meses)',
    18000,
    4800,
    (CURRENT_DATE + INTERVAL '10 months')::timestamp,
    NOW()
  ),
  (
    'cm_t3m_goal_travel',
    'cm_test_3months_user',
    'cm_t3m_cat_inv_travel',
    'Viagem Europa',
    12000,
    1500,
    (CURRENT_DATE + INTERVAL '18 months')::timestamp,
    NOW()
  );

COMMIT;
