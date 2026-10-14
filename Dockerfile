# ---------- Build ----------
FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# prisma.config.ts exige DATABASE_URL, pero generate no se conecta a la base.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate \
  && npm run build \
  && npx tsc --ignoreConfig prisma/seed.ts --outDir dist-seed --module commonjs --target es2023 \
     --esModuleInterop --skipLibCheck --types node

# ---------- Runtime ----------
FROM node:22-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-seed ./dist-seed
COPY prisma ./prisma
COPY prisma.config.ts ./

USER node

EXPOSE 3000

# Aplica migraciones, crea/actualiza el admin si hay ADMIN_EMAIL y arranca la API.
CMD ["sh", "-c", "npx prisma migrate deploy && if [ -n \"$ADMIN_EMAIL\" ]; then node dist-seed/seed.js; fi && node dist/main"]
