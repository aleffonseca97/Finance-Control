-- =============================================================================
-- Conta de teste com acesso pleno (assinatura "active" no banco)
-- Login: teste@exemplo.local  |  Senha: Teste123!
-- Execute no banco apontado por DATABASE_URL (PostgreSQL).
-- =============================================================================

BEGIN;

-- Evite colisão se rodar de novo (ordem: Subscription depende de User)
DELETE FROM "Subscription" WHERE "userId" = 'cm_test_fullaccess_user';
DELETE FROM "User" WHERE "id" = 'cm_test_fullaccess_user';

INSERT INTO "User" (
  "id",
  "email",
  "passwordHash",
  "name",
  "hasSeenWelcome",
  "marketingOptIn",
  "createdAt"
) VALUES (
  'cm_test_fullaccess_user',
  'teste@exemplo.local',
  '$2a$12$TyL8.gQ8Jal3XIG7FRrZee0.Khy2gE/RsKetPZsxvuSaxllynTl7S',
  'Usuário Teste',
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
  'cm_test_fullaccess_sub',
  'cm_test_fullaccess_user',
  'sub_test_pleno_acesso_001',
  'price_test_placeholder',
  'active',
  (NOW() + INTERVAL '365 days'),
  NULL,
  false,
  NOW(),
  NOW()
);

COMMIT;