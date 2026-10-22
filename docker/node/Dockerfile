# syntax=docker.io/docker/dockerfile:1

FROM node:lts-alpine AS base

FROM base AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# prisma generate reads prisma.config.ts; no live DB needed at build time
ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/inventory_book"

# Prisma client (custom output under lib/generated) + Next standalone build
RUN npx prisma generate && npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Ensure custom Prisma client output is present for the runtime server
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated ./lib/generated

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
