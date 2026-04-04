# ===============================================
# RZUNA FOUNDATION: Backend-Only Dockerfile
# Blueprint v1.6: VPS = Fastify, Vercel = Next.js
# ===============================================

# -------------------------
# STAGE 1: BUILDER
# -------------------------
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# -------------------------
# STAGE 2: RUNNER
# -------------------------
FROM node:20-slim AS runner

WORKDIR /app

# Install curl for HEALTHCHECK
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy built output and production deps only
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

# Hardening: Run as non-root user
USER node

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Production Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/src/server.js"]
