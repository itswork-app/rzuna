# ===============================================
# RZUNA FOUNDATION: Institutional Dockerfile
# Blueprint v1.6: Multistage Tactical Hardening
# ===============================================

# -------------------------
# STAGE 1: BUILDER
# -------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Enable corepack for modern package managers (optional)
RUN corepack enable

# 1A: Backend Build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 1B: Frontend Build
WORKDIR /app/web
RUN npm ci
RUN npm run build

# -------------------------
# STAGE 2: RUNNER
# -------------------------
FROM node:20-slim AS runner

WORKDIR /app

# Install curl for HEALTHCHECK
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Hardening: Run as non-root user (node)
RUN groupadd -g 1001 -r nodejs && adduser --system --uid 1001 nextjs

# Copy Backend Assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copy Frontend Assets
COPY --from=builder --chown=nextjs:nodejs /app/web/package*.json ./web/
COPY --from=builder --chown=nextjs:nodejs /app/web/node_modules ./web/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/web/.next ./web/.next
COPY --from=builder --chown=nextjs:nodejs /app/web/public ./web/public

# Startup Wrapper
COPY --chown=nextjs:nodejs start.sh ./
RUN chmod +x start.sh

# Complete Permissions
RUN chown -R nextjs:nodejs /app

# Drop to Non-Root
USER nextjs

# Expose Frontend & Backend
EXPOSE 3000
EXPOSE 3001

# Production Stress Protocol: Docker Engine Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/api/health || curl -f http://localhost:3001/health || exit 1

CMD ["./start.sh"]
