# Controle Financeiro Pessoal

Dashboard de controle financeiro pessoal multi-usuário com Next.js 14, TypeScript, SQLite/Prisma e autenticação por email/senha.

## Funcionalidades

- **Entradas**: Salário, Extra, Freelance, Outros
- **Saídas**: Mercado, Roupas, Lazer, Carro, Aluguel, Contas, Outros (fixas e variáveis)
- **Investimentos**: Reserva Emergência, Reserva Viagem, CDB, Tesouro Direto, Ações, Outros
- **Dashboard**: Visão geral, gráficos, últimas transações
- **Análise**: Despesas fixas vs variáveis, comparativos, top categorias

## Pré-requisitos

- Node.js 18+
- npm

### Banco de Dados

- PostgreSQL 14+ instalado **ou**
- Docker para rodar um container PostgreSQL

## Instalação

```bash
npm install
```

## Configuração

1. Copie `.env.example` para `.env`
2. Configure `NEXTAUTH_SECRET` com um valor aleatório seguro
3. Configure `DATABASE_URL` para apontar para o seu PostgreSQL. Exemplo para Docker/local:

   ```bash
   # Exemplo usando usuário padrão 'postgres' e DB 'finance'
   DATABASE_URL="postgresql://postgres:senha_segura@localhost:5432/finance?schema=public"
   ```

### Subindo PostgreSQL com Docker (sugestão)

Se preferir usar Docker, você pode subir um container PostgreSQL com:

```bash
docker run --name finance-postgres \
  -e POSTGRES_PASSWORD=senha_segura \
  -e POSTGRES_DB=finance \
  -p 5432:5432 \
  -d postgres:16
```

## Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Criar/migrar banco (já feito na primeira execução)
npm run db:migrate

# Interface visual do banco
npm run db:studio
```

## Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Produção

```bash
npm run build
npm start
```

## Tema

O sistema usa tema **night** (dark mode) por padrão.

by Alef, Henrique
