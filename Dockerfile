# ============================================
# STAGE 1 — Dependências (builder)
# ============================================
# Usa Node.js 20 Alpine como base leve e estável.
# Este projeto não possui dependências de produção (apenas devDependencies),
# então o stage de build serve para preparar o ambiente limpo.
FROM node:20-alpine AS builder

WORKDIR /app

# Copia apenas os arquivos de manifesto para cache de camadas
COPY package.json package-lock.json ./

# Instala APENAS dependências de produção (nenhuma neste projeto)
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# ============================================
# STAGE 2 — Imagem de execução
# ============================================
FROM node:20-alpine AS runtime

# Metadados da imagem
LABEL maintainer="Vitorrevoredo"
LABEL description="API REST para gerenciamento de Livros e Obras Literárias"

WORKDIR /app

# Cria usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copia node_modules do builder (caso existam dependências de produção no futuro)
COPY --from=builder /app/node_modules ./node_modules/

# Copia o código-fonte da aplicação e os assets web
COPY src/ ./src/
COPY web/ ./web/
COPY package.json ./

# A porta padrão da aplicação
EXPOSE 8080

# Altera para o usuário não-root
USER appuser

# Comando de inicialização
CMD ["node", "src/server.js"]
