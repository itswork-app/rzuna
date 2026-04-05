# ===============================================
# RZUNA FOUNDATION: Institutional Backend Dockerfile
# Blueprint v22.1: PNPM Monorepo Optimized
# ===============================================

# -------------------------
# STAGE 1: PRUNER
# -------------------------
FROM node:20-slim AS pruner
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm dlx turbo prune @rzuna/engine --docker

# -------------------------
# STAGE 2: BUILDER
# -------------------------
FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm exec turbo build --filter=@rzuna/engine

# -------------------------
# STAGE 3: RUNNER
# -------------------------
FROM node:20-slim AS runner
WORKDIR /app

# Install curl for HEALTHCHECK
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy pruned production dependencies and built output
COPY --from=builder /app .

# Hardening: Run as non-root user
USER node

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Production Healthcheck (Wired to Fastify Health plugin)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "apps/engine/dist/server.js"]
