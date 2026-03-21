FROM node:20-alpine

WORKDIR /controle-financeiro

# Copia package.json + package-lock.json + pasta prisma (para o postinstall funcionar)
COPY package*.json ./
COPY prisma ./prisma

# Dependência para Prisma (recomendado no Alpine)
RUN apk add --no-cache openssl libc6-compat

# Instala dependências (vai rodar prisma generate aqui)
RUN npm install

# Copia o restante do código
COPY . .

# Build de produção do Next.js
RUN npm run build

# Porta padrão do Next.js
EXPOSE 3030             

# Comando para subir o servidor em produção
CMD ["npm", "run", "start"]