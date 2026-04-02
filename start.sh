#!/bin/sh

# ===============================================
# RZUNA FOUNDATION: Institutional Grade Startup
# Blueprint v1.6 - Single-Container Monolith
# ===============================================

echo "🚀 [RZUNA] Starting Fastify Backend (Port 3001)..."
node dist/src/server.js &

echo "🚀 [RZUNA] Starting Next.js Glass Fortress (Port 3000)..."
cd web && npm run start
