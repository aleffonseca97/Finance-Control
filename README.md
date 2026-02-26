# Controle Financeiro Pessoal + Telegram

Sistema de controle financeiro pessoal como web app, com integração ao Telegram para registrar entradas e saídas via mensagens.

## Requisitos

- Node.js 18+
- SQLite (arquivo local, sem instalação adicional)

## Configuração

### 1. Banco de dados

O projeto usa SQLite. Defina o caminho do arquivo em `DATABASE_URL` (opcional; padrão: `./database.db`):

```bash
DATABASE_URL=./database.db
```

### 2. Bot no Telegram

1. Abra o [@BotFather](https://t.me/BotFather) no Telegram.
2. Envie `/newbot` e siga as instruções.
3. Copie o token e defina como `TELEGRAM_BOT_TOKEN`.

### 3. Variáveis de ambiente

Copie `.env.example` para `.env` na raiz ou na pasta `backend/` e preencha:

- `DATABASE_URL` – conexão PostgreSQL
- `JWT_SECRET` – chave secreta para tokens (gere uma aleatória)
- `PORT` – porta do servidor (ex.: 3000)
- `TELEGRAM_BOT_TOKEN` – token do bot
- `FRONTEND_URL` – URL pública do app (para CORS), ex.: `https://seu-dominio.com`

Para o frontend em build de produção, defina `VITE_API_URL` com a URL do backend (se for a mesma origem do app, use a mesma URL do site).

## Instalação e execução

### Desenvolvimento

```bash
# Backend
cd backend
npm install
npm run migrate   # roda migrações (cria tabelas)
npm run dev       # inicia o servidor

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev       # abre em http://localhost:5173
```

O frontend em dev usa proxy para `/api` apontando para `http://localhost:3000`.

### Produção (deploy)

1. Configure as variáveis de ambiente no servidor.
2. Instale dependências e rode as migrações:

   ```bash
   cd backend && npm install && npm run migrate
   ```

3. Build do frontend:

   ```bash
   cd frontend && npm install && npm run build
   ```

4. Inicie o backend (ele serve a pasta `frontend/dist` e a API):

   ```bash
   cd backend && npm start
   ```

O app estará disponível na URL do servidor (ex.: `https://seu-app.exemplo.com`).

## Uso do Telegram

1. No app web, acesse **Integrações** e clique em **Gerar código de vinculação**.
2. No Telegram, abra o bot e envie: `/vincular CODIGO` (substitua CODIGO pelo número de 6 dígitos).
3. Depois de vinculado, envie mensagens para registrar transações:
   - **Entrada:** `entrada 100`, `+100`, `100 entrada`
   - **Saída:** `saída 50 mercado`, `-30 lanche`, `50 mercado`

## Estrutura

- `backend/` – API Express, autenticação JWT, Telegram bot, SQLite
- `frontend/` – React + Vite, dashboard, transações, integrações
- Migrações em `backend/src/migrations/`

## Licença

Uso pessoal / educativo.
