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

## Instalação

```bash
npm install
```

## Configuração

1. Copie `.env.example` para `.env`
2. Configure `NEXTAUTH_SECRET` com um valor aleatório seguro
3. Opcional: ajuste `DATABASE_URL` se precisar de outro banco

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
