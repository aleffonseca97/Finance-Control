-- =============================================================================
-- Usuário de teste com 3 meses de dados (cobre as features do sistema)
-- Login: teste.3meses@exemplo.local  |  Senha: Teste123!
-- Execute no banco apontado por DATABASE_URL (PostgreSQL).
--
-- Uso:
--   1) Rode este arquivo inteiro (cria/atualiza a função e executa o reset).
--   2) Para recriar do zero a qualquer momento:
--        SELECT reset_user_test_3_months();
--
-- A função exclui o usuário teste atual (id, e-mail ou CPF) e cria um novo
-- com dados para: perfil, assinatura, categorias custom, 3 cartões, entradas,
-- saídas à vista, compras no cartão, pagamento de fatura, recorrências
-- (fixo + % + assinaturas), investimentos (aporte, saque, só monitoramento),
-- metas (com/sem reserva), ocorrências pagas/pendentes e parcelamentos
-- de cartão (InstallmentPlan kind=CREDIT_CARD).
-- =============================================================================

DROP FUNCTION IF EXISTS reset_user_test_3_months();

CREATE OR REPLACE FUNCTION reset_user_test_3_months()
RETURNS text
LANGUAGE plpgsql
AS $fn$
DECLARE
  v_user_id    text := 'cm_test_3months_user';
  v_email      text := 'teste.3meses@exemplo.local';
  v_cpf        text := '52998224725';
  v_phone      text := '+5511987654321';
  -- bcrypt de "Teste123!"
  v_password   text := '$2a$12$TyL8.gQ8Jal3XIG7FRrZee0.Khy2gE/RsKetPZsxvuSaxllynTl7S';
BEGIN
  -- ---------------------------------------------------------------------------
  -- 1) Exclui o usuário teste atual (filhos caem por ON DELETE CASCADE)
  -- ---------------------------------------------------------------------------
  DELETE FROM "User"
  WHERE id = v_user_id
     OR email = v_email
     OR cpf = v_cpf;

  -- ---------------------------------------------------------------------------
  -- 2) Recria usuário + assinatura (acesso pleno no app)
  -- ---------------------------------------------------------------------------
  INSERT INTO "User" (
    "id",
    "email",
    "passwordHash",
    "name",
    "cpf",
    "phone",
    "hasSeenWelcome",
    "marketingOptIn",
    "locale",
    "preferredCurrency",
    "createdAt"
  ) VALUES (
    v_user_id,
    v_email,
    v_password,
    'Usuario Teste 3 Meses',
    v_cpf,
    v_phone,
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
    'cm_t3m_sub',
    v_user_id,
    'sub_test_3months_001',
    'price_test_placeholder',
    'active',
    (NOW() + INTERVAL '365 days'),
    NULL,
    false,
    NOW(),
    NOW()
  );

  -- ---------------------------------------------------------------------------
  -- 3) Categorias custom (grupos alinhados ao catálogo do sistema)
  --    Custom evita mutar categorias globais ao marcar recorrência como isFixed.
  -- ---------------------------------------------------------------------------
  INSERT INTO "Category" (
    "id", "userId", "name", "group", "icon", "type",
    "investmentSubtype", "isCustom", "isFixed", "defaultValue", "color"
  )
  VALUES
    -- Receitas
    ('cm_t3m_cat_income_salary', v_user_id, 'Salário', 'Receitas', 'Wallet', 'income', NULL, true, false, NULL, '#22c55e'),
    ('cm_t3m_cat_income_freela', v_user_id, 'Freelance', 'Receitas', 'Laptop', 'income', NULL, true, false, NULL, '#3b82f6'),
    ('cm_t3m_cat_income_bonus', v_user_id, 'Bônus e comissões', 'Receitas', 'Coins', 'income', NULL, true, false, NULL, '#eab308'),
    -- Despesas fixas (caixa) — defaultValue só onde o mês atual já está pago
    ('cm_t3m_cat_exp_rent', v_user_id, 'Aluguel ou hipoteca', 'Moradia', 'Home', 'expense', NULL, true, true, 1800, '#8b5cf6'),
    ('cm_t3m_cat_exp_internet', v_user_id, 'Telefonia e internet', 'Pessoal e serviços', 'Wifi', 'expense', NULL, true, true, NULL, '#5b21b6'),
    ('cm_t3m_cat_exp_healthplan', v_user_id, 'Plano de saúde', 'Saúde', 'Shield', 'expense', NULL, true, true, 420, '#14b8a6'),
    -- Despesas variáveis (caixa) — entram em Análise (fixo vs variável)
    ('cm_t3m_cat_exp_transport', v_user_id, 'Transporte público', 'Transporte', 'Bus', 'expense', NULL, true, false, NULL, '#0ea5e9'),
    ('cm_t3m_cat_exp_fuel', v_user_id, 'Combustível', 'Transporte', 'Car', 'expense', NULL, true, false, NULL, '#06b6d4'),
    ('cm_t3m_cat_exp_restaurant', v_user_id, 'Restaurantes', 'Alimentação', 'Utensils', 'expense', NULL, true, false, NULL, '#f97316'),
    -- Despesas no cartão (não entram no orçamento de caixa)
    ('cm_t3m_cat_exp_market', v_user_id, 'Supermercado', 'Alimentação', 'ShoppingCart', 'expense', NULL, true, false, NULL, '#22c55e'),
    ('cm_t3m_cat_exp_delivery', v_user_id, 'Delivery', 'Alimentação', 'Utensils', 'expense', NULL, true, false, NULL, '#ea580c'),
    ('cm_t3m_cat_exp_leisure', v_user_id, 'Cinema e eventos', 'Lazer e estilo de vida', 'Video', 'expense', NULL, true, false, NULL, '#db2777'),
    ('cm_t3m_cat_exp_health', v_user_id, 'Farmácia', 'Saúde', 'Heart', 'expense', NULL, true, false, NULL, '#e11d48'),
    ('cm_t3m_cat_exp_edu', v_user_id, 'Cursos', 'Educação', 'GraduationCap', 'expense', NULL, true, false, NULL, '#2563eb'),
    ('cm_t3m_cat_exp_clothes', v_user_id, 'Vestuário', 'Pessoal e serviços', 'Shirt', 'expense', NULL, true, false, NULL, '#ec4899'),
    -- Assinaturas (tela Assinaturas filtra group = 'Assinaturas')
    ('cm_t3m_cat_sub_video', v_user_id, 'Streaming de vídeo', 'Assinaturas', 'Video', 'expense', NULL, true, true, 55.90, '#7c3aed'),
    ('cm_t3m_cat_sub_audio', v_user_id, 'Streaming de áudio', 'Assinaturas', 'Music', 'expense', NULL, true, true, NULL, '#8b5cf6'),
    ('cm_t3m_cat_sub_software', v_user_id, 'Software e apps', 'Assinaturas', 'Laptop', 'expense', NULL, true, true, NULL, '#4c1d95'),
    -- Pagamento de fatura (caixa; paysCreditCardId)
    ('cm_t3m_cat_exp_invoice', v_user_id, 'Fatura cartão de crédito', 'Dívidas e obrigacões', 'CreditCard', 'expense', NULL, true, true, NULL, '#6366f1'),
    -- Investimentos
    ('cm_t3m_cat_inv_reserve', v_user_id, 'Reserva de emergência', 'Investimentos', 'Shield', 'investment', 'reserva', true, false, NULL, '#22c55e'),
    ('cm_t3m_cat_inv_travel', v_user_id, 'Reserva viagem', 'Investimentos', 'Plane', 'investment', 'reserva', true, false, NULL, '#3b82f6'),
    ('cm_t3m_cat_inv_wallet', v_user_id, 'Tesouro direto', 'Investimentos', 'Landmark', 'investment', 'carteira', true, false, NULL, '#8b5cf6'),
    ('cm_t3m_cat_inv_cdb', v_user_id, 'CDB', 'Investimentos', 'PiggyBank', 'investment', 'carteira', true, false, NULL, '#eab308');

  -- ---------------------------------------------------------------------------
  -- 4) Cartões (gasto do mês vs limite; pie por grupo; parcelamentos)
  -- ---------------------------------------------------------------------------
  INSERT INTO "CreditCard" (
    "id", "userId", "name", "lastFour", "limit", "totalLimit", "closingDay", "dueDay", "color"
  ) VALUES
    ('cm_t3m_cc_main', v_user_id, 'Cartao Principal', '1234', 8000, 8000, 7, 15, '#6366f1'),
    ('cm_t3m_cc_sec', v_user_id, 'Cartao Beneficios', '9876', 3500, 3500, 20, 28, '#0ea5e9'),
    ('cm_t3m_cc_virt', v_user_id, 'Cartao Virtual', NULL, 1500, 1500, 1, 10, '#14b8a6');

  -- ---------------------------------------------------------------------------
  -- 5) Recorrências de pagamento (fixo, percentual e assinaturas)
  -- ---------------------------------------------------------------------------
  INSERT INTO "RecurringPayment" (
    "id", "userId", "categoryId", "amount", "amountType", "percentage", "sortOrder", "createdAt"
  ) VALUES
    ('cm_t3m_rp_rent', v_user_id, 'cm_t3m_cat_exp_rent', 1800, 'fixed', NULL, 1, NOW()),
    ('cm_t3m_rp_internet', v_user_id, 'cm_t3m_cat_exp_internet', 120, 'fixed', NULL, 2, NOW()),
    ('cm_t3m_rp_healthplan', v_user_id, 'cm_t3m_cat_exp_healthplan', 420, 'fixed', NULL, 3, NOW()),
    ('cm_t3m_rp_market', v_user_id, 'cm_t3m_cat_exp_market', 0, 'percentage', 12, 4, NOW()),
    ('cm_t3m_rp_video', v_user_id, 'cm_t3m_cat_sub_video', 55.90, 'fixed', NULL, 5, NOW()),
    ('cm_t3m_rp_audio', v_user_id, 'cm_t3m_cat_sub_audio', 21.90, 'fixed', NULL, 6, NOW()),
    ('cm_t3m_rp_software', v_user_id, 'cm_t3m_cat_sub_software', 49, 'fixed', NULL, 7, NOW());

  INSERT INTO "RecurringInvestment" (
    "id", "userId", "reserveCategoryId", "walletCategoryId",
    "amount", "amountType", "percentage", "sortOrder", "createdAt"
  ) VALUES
    ('cm_t3m_ri_fixed', v_user_id, 'cm_t3m_cat_inv_reserve', 'cm_t3m_cat_inv_wallet', 1000, 'fixed', NULL, 1, NOW()),
    ('cm_t3m_ri_pct', v_user_id, 'cm_t3m_cat_inv_travel', 'cm_t3m_cat_inv_cdb', 0, 'percentage', 5, 2, NOW());

  -- ---------------------------------------------------------------------------
  -- 6) Transações — mês atual (idx=0) + 2 anteriores
  --    month_value é 0–11 (igual a Date#getMonth no app).
  -- ---------------------------------------------------------------------------
  INSERT INTO "Transaction" (
    "id", "userId", "categoryId", "amount", "description", "date", "type",
    "creditCardId", "paysCreditCardId", "creditCarryoverCardId", "creditCarryoverPeriodEnd"
  )
  WITH months AS (
    SELECT
      gs AS idx,
      date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month') AS month_start,
      (
        date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month')
        + INTERVAL '1 month' - INTERVAL '1 day'
      ) AS month_end
    FROM generate_series(0, 2) AS gs
  )
  -- Receitas
  SELECT
    'cm_t3m_tx_salary_' || idx,
    v_user_id,
    'cm_t3m_cat_income_salary',
    (5200 - (idx * 120))::double precision,
    'Salário mensal',
    LEAST(month_start + INTERVAL '1 day', month_end),
    'income',
    NULL::text, NULL::text, NULL::text, NULL::timestamp
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_freela_' || idx,
    v_user_id,
    'cm_t3m_cat_income_freela',
    (900 + (idx * 80))::double precision,
    'Freela pontual',
    LEAST(month_start + INTERVAL '20 day', month_end),
    'income',
    NULL, NULL, NULL, NULL
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_bonus',
    v_user_id,
    'cm_t3m_cat_income_bonus',
    1500::double precision,
    'Bônus trimestral',
    LEAST(
      (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months') + INTERVAL '24 day',
      date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' - INTERVAL '1 day'
    ),
    'income',
    NULL, NULL, NULL, NULL
  -- Despesas à vista (recorrentes / caixa)
  UNION ALL
  SELECT
    'cm_t3m_tx_rent_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_rent',
    1800::double precision,
    'Pagamento recorrente',
    LEAST(month_start + INTERVAL '4 day', month_end),
    'expense',
    NULL, NULL, NULL, NULL
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_internet_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_internet',
    120::double precision,
    'Pagamento recorrente',
    LEAST(month_start + INTERVAL '5 day', month_end),
    'expense',
    NULL, NULL, NULL, NULL
  FROM months
  WHERE idx >= 1
  UNION ALL
  SELECT
    'cm_t3m_tx_healthplan_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_healthplan',
    420::double precision,
    'Pagamento recorrente',
    LEAST(month_start + INTERVAL '7 day', month_end),
    'expense',
    NULL, NULL, NULL, NULL
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_transport_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_transport',
    (210 + (idx * 25))::double precision,
    'Transporte público',
    LEAST(month_start + INTERVAL '17 day', month_end),
    'expense',
    NULL, NULL, NULL, NULL
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_fuel_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_fuel',
    (180 + (idx * 15))::double precision,
    'Combustível',
    LEAST(month_start + INTERVAL '9 day', month_end),
    'expense',
    NULL, NULL, NULL, NULL
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_restaurant_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_restaurant',
    (95 + (idx * 20))::double precision,
    'Jantar / almoço',
    LEAST(month_start + INTERVAL '19 day', month_end),
    'expense',
    NULL, NULL, NULL, NULL
  FROM months
  UNION ALL
  -- Assinaturas (caixa) — vídeo pago nos 3 meses; áudio/software pendentes no atual
  SELECT
    'cm_t3m_tx_video_' || idx,
    v_user_id,
    'cm_t3m_cat_sub_video',
    55.90::double precision,
    'Pagamento recorrente',
    LEAST(month_start + INTERVAL '3 day', month_end),
    'expense',
    NULL, NULL, NULL, NULL
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_audio_' || idx,
    v_user_id,
    'cm_t3m_cat_sub_audio',
    21.90::double precision,
    'Pagamento recorrente',
    LEAST(month_start + INTERVAL '3 day', month_end),
    'expense',
    NULL, NULL, NULL, NULL
  FROM months
  WHERE idx >= 1
  UNION ALL
  SELECT
    'cm_t3m_tx_software_' || idx,
    v_user_id,
    'cm_t3m_cat_sub_software',
    49::double precision,
    'Pagamento recorrente',
    LEAST(month_start + INTERVAL '8 day', month_end),
    'expense',
    NULL, NULL, NULL, NULL
  FROM months
  WHERE idx >= 1
  UNION ALL
  -- Compras no cartão principal (pie + gasto do mês)
  SELECT
    'cm_t3m_tx_market_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_market',
    (640 + (idx * 45))::double precision,
    'Compras de supermercado',
    LEAST(month_start + INTERVAL '11 day', month_end),
    'expense',
    'cm_t3m_cc_main',
    NULL, NULL, NULL
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_leisure_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_leisure',
    (180 + (idx * 40))::double precision,
    'Cinema / eventos',
    LEAST(month_start + INTERVAL '15 day', month_end),
    'expense',
    'cm_t3m_cc_main',
    NULL, NULL, NULL
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_clothes',
    v_user_id,
    'cm_t3m_cat_exp_clothes',
    220::double precision,
    'Roupas',
    LEAST(date_trunc('month', CURRENT_DATE) + INTERVAL '12 day', date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
    'expense',
    'cm_t3m_cc_main',
    NULL, NULL, NULL
  UNION ALL
  -- Compras no cartão benefícios
  SELECT
    'cm_t3m_tx_health_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_health',
    (150 + (idx * 20))::double precision,
    'Farmácia',
    LEAST(month_start + INTERVAL '13 day', month_end),
    'expense',
    'cm_t3m_cc_sec',
    NULL, NULL, NULL
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_delivery_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_delivery',
    (85 + (idx * 10))::double precision,
    'Delivery',
    LEAST(month_start + INTERVAL '16 day', month_end),
    'expense',
    'cm_t3m_cc_sec',
    NULL, NULL, NULL
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_tx_edu',
    v_user_id,
    'cm_t3m_cat_exp_edu',
    99::double precision,
    'Curso online (parcela 1/3)',
    date_trunc('month', CURRENT_DATE) + INTERVAL '6 day',
    'expense',
    'cm_t3m_cc_sec',
    NULL, NULL, NULL
  UNION ALL
  -- Parcelas já pagas (espelham InstallmentPlan.paidInstallments na janela de 3 meses)
  SELECT
    'cm_t3m_tx_inst_notebook_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_edu',
    250::double precision,
    'Parcela Notebook Dell',
    LEAST(month_start + INTERVAL '8 day', month_end),
    'expense',
    'cm_t3m_cc_main',
    NULL, NULL, NULL
  FROM months
  WHERE idx >= 1
  UNION ALL
  SELECT
    'cm_t3m_tx_inst_sofa_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_clothes',
    320::double precision,
    'Parcela Sofá sala',
    LEAST(month_start + INTERVAL '8 day', month_end),
    'expense',
    'cm_t3m_cc_main',
    NULL, NULL, NULL
  FROM months
  WHERE idx >= 1
  UNION ALL
  SELECT
    'cm_t3m_tx_inst_phone',
    v_user_id,
    'cm_t3m_cat_exp_leisure',
    180::double precision,
    'Parcela Smartphone',
    LEAST(
      (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month') + INTERVAL '10 day',
      date_trunc('month', CURRENT_DATE) - INTERVAL '1 day'
    ),
    'expense',
    'cm_t3m_cc_sec',
    NULL, NULL, NULL
  UNION ALL
  SELECT
    'cm_t3m_tx_inst_fone',
    v_user_id,
    'cm_t3m_cat_exp_leisure',
    75::double precision,
    'Parcela Fone Bluetooth (quitado)',
    LEAST(
      (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months') + INTERVAL '8 day',
      date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' - INTERVAL '1 day'
    ),
    'expense',
    'cm_t3m_cc_main',
    NULL, NULL, NULL
  UNION ALL
  -- Pagamentos de fatura em dinheiro (meses anteriores)
  SELECT
    'cm_t3m_tx_pay_main_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_invoice',
    (1100 + (idx * 90))::double precision,
    'Pagamento fatura Cartao Principal',
    LEAST(month_start + INTERVAL '14 day', month_end),
    'expense',
    NULL,
    'cm_t3m_cc_main',
    NULL,
    NULL
  FROM months
  WHERE idx >= 1
  UNION ALL
  SELECT
    'cm_t3m_tx_pay_sec_' || idx,
    v_user_id,
    'cm_t3m_cat_exp_invoice',
    (280 + (idx * 40))::double precision,
    'Pagamento fatura Cartao Beneficios',
    LEAST(month_start + INTERVAL '26 day', month_end),
    'expense',
    NULL,
    'cm_t3m_cc_sec',
    NULL,
    NULL
  FROM months
  WHERE idx >= 1;

  -- ---------------------------------------------------------------------------
  -- 7) Investimentos: aportes (caixa + só monitoramento) e um saque
  -- ---------------------------------------------------------------------------
  INSERT INTO "Investment" (
    "id", "userId", "categoryId", "reserveCategoryId", "walletCategoryId",
    "amount", "affectsCash", "date", "notes"
  )
  WITH months AS (
    SELECT
      gs AS idx,
      date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month') AS month_start,
      (
        date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month')
        + INTERVAL '1 month' - INTERVAL '1 day'
      ) AS month_end
    FROM generate_series(0, 2) AS gs
  )
  SELECT
    'cm_t3m_inv_reserve_' || idx,
    v_user_id,
    NULL::text,
    'cm_t3m_cat_inv_reserve',
    'cm_t3m_cat_inv_wallet',
    (600 + (idx * 50))::double precision,
    true,
    LEAST(month_start + INTERVAL '7 day', month_end),
    'Aporte em reserva (recorrente)'
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_inv_travel_' || idx,
    v_user_id,
    NULL,
    'cm_t3m_cat_inv_travel',
    'cm_t3m_cat_inv_cdb',
    (250 + (idx * 20))::double precision,
    true,
    LEAST(month_start + INTERVAL '9 day', month_end),
    'Aporte viagem (5% renda)'
  FROM months
  WHERE idx >= 1
  UNION ALL
  SELECT
    'cm_t3m_inv_monitor',
    v_user_id,
    NULL,
    'cm_t3m_cat_inv_reserve',
    'cm_t3m_cat_inv_wallet',
    1500::double precision,
    false,
    LEAST(
      (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months') + INTERVAL '2 day',
      date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' - INTERVAL '1 day'
    ),
    'Saldo inicial apenas monitoramento (nao debita caixa)'
  UNION ALL
  SELECT
    'cm_t3m_inv_withdraw',
    v_user_id,
    NULL,
    'cm_t3m_cat_inv_reserve',
    'cm_t3m_cat_inv_wallet',
    (-350)::double precision,
    true,
    LEAST(
      (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month') + INTERVAL '21 day',
      date_trunc('month', CURRENT_DATE) - INTERVAL '1 day'
    ),
    'Saque parcial da reserva';

  -- ---------------------------------------------------------------------------
  -- 8) Ocorrências de recorrência (mês 0–11, como o app)
  --    Aluguel, plano de saúde e streaming vídeo: pagos nos 3 meses.
  --    Internet, áudio e software: pagos só nos meses passados (teste "marcar pago").
  --    Mercado %: pendente em todos os meses.
  -- ---------------------------------------------------------------------------
  INSERT INTO "RecurringPaymentOccurrence" ("id", "recurringPaymentId", "year", "month", "transactionId")
  WITH months AS (
    SELECT
      gs AS idx,
      EXTRACT(YEAR FROM date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month'))::int AS year_value,
      (EXTRACT(MONTH FROM date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month'))::int - 1) AS month_value
    FROM generate_series(0, 2) AS gs
  )
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
    'cm_t3m_rpo_healthplan_' || year_value || '_' || month_value,
    'cm_t3m_rp_healthplan',
    year_value,
    month_value,
    'cm_t3m_tx_healthplan_' || idx
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_rpo_market_' || year_value || '_' || month_value,
    'cm_t3m_rp_market',
    year_value,
    month_value,
    NULL::text
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_rpo_video_' || year_value || '_' || month_value,
    'cm_t3m_rp_video',
    year_value,
    month_value,
    'cm_t3m_tx_video_' || idx
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_rpo_audio_' || year_value || '_' || month_value,
    'cm_t3m_rp_audio',
    year_value,
    month_value,
    CASE WHEN idx >= 1 THEN 'cm_t3m_tx_audio_' || idx ELSE NULL END
  FROM months
  UNION ALL
  SELECT
    'cm_t3m_rpo_software_' || year_value || '_' || month_value,
    'cm_t3m_rp_software',
    year_value,
    month_value,
    CASE WHEN idx >= 1 THEN 'cm_t3m_tx_software_' || idx ELSE NULL END
  FROM months;

  INSERT INTO "RecurringInvestmentOccurrence" ("id", "recurringInvestmentId", "year", "month", "investmentId")
  WITH months AS (
    SELECT
      gs AS idx,
      EXTRACT(YEAR FROM date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month'))::int AS year_value,
      (EXTRACT(MONTH FROM date_trunc('month', CURRENT_DATE) - (gs * INTERVAL '1 month'))::int - 1) AS month_value
    FROM generate_series(0, 2) AS gs
  )
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

  -- ---------------------------------------------------------------------------
  -- 9) Parcelamentos de cartão (telas Cartão + Parcelamentos)
  --    Datas relativas ao mês atual para o ano corrente ter compromisso restante.
  -- ---------------------------------------------------------------------------
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
      v_user_id,
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
      v_user_id,
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
      v_user_id,
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
      v_user_id,
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
      v_user_id,
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

  -- ---------------------------------------------------------------------------
  -- 10) Metas: com reserva (progresso = soma dos investimentos) e sem reserva
  -- ---------------------------------------------------------------------------
  INSERT INTO "Goal" (
    "id", "userId", "reserveCategoryId", "name", "targetAmount", "currentAmount", "deadline", "createdAt"
  ) VALUES
    (
      'cm_t3m_goal_emergency',
      v_user_id,
      'cm_t3m_cat_inv_reserve',
      'Reserva de emergencia (6 meses)',
      18000,
      0,
      (CURRENT_DATE + INTERVAL '10 months')::timestamp,
      NOW()
    ),
    (
      'cm_t3m_goal_travel',
      v_user_id,
      'cm_t3m_cat_inv_travel',
      'Viagem Europa',
      12000,
      0,
      (CURRENT_DATE + INTERVAL '18 months')::timestamp,
      NOW()
    ),
    (
      'cm_t3m_goal_manual',
      v_user_id,
      NULL,
      'Fundo para troca de carro',
      25000,
      4200,
      NULL,
      NOW()
    );

  RETURN format(
    'Usuário teste recriado. Login: %s  |  Senha: Teste123!',
    v_email
  );
END;
$fn$;

SELECT reset_user_test_3_months();
