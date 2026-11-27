# syntax=docker/dockerfile:1

# ───────────── Estágio 1: build ─────────────
# Executa o mesmo build do pipeline (npm run build) e gera a pasta dist/.
FROM node:22-alpine AS build
WORKDIR /app

# Copia só os manifestos primeiro: a camada de dependências fica em cache
# enquanto package.json e package-lock.json não mudarem.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ───────────── Estágio 2: execução ─────────────
# Imagem final: apenas o nginx e o artefato dist/ (sem Node, código-fonte ou testes).
# A variante "unprivileged" roda como usuário não-root, na porta 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# O Docker marca o container como "unhealthy" se a aplicação deixar de responder.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
