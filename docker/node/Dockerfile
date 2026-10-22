# syntax=docker.io/docker/dockerfile:1

FROM node:lts-alpine AS base

FROM base AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
# Skip postinstall (prisma generate) — schema is not copied until the builder stage
RUN npm ci --ignore-scripts

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Name must be DATABASE_URL — prisma.config.ts reads process.env.DATABASE_URL.
# Placeholder is enough for `prisma generate` (no live connection). Do not pass real
# secrets as build-args (they land in image history); runtime uses env_file instead.
ARG DATABASE_URL=mysql://placeholder:placeholder@127.0.0.1:3306/inventory_book
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
