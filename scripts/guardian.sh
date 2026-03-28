#!/bin/bash

# =================================================================
# PROJECT ANTIGRAVITY (RZUNA) - THE CONSTITUTIONAL GUARDIAN
# =================================================================
# Rule: Exit immediately if any command fails.
set -e

# Warna untuk output terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🛡️  STARTING CONSTITUTIONAL AUDIT...${NC}"

# 1. THE LAW (Static Analysis & Linting)
echo -e "\n🔍 [STAGE 1] Checking Syntax & Style (ESLint)..."
npm run lint || { echo -e "${RED}❌ LINTING FAILED. Fix style errors before pushing.${NC}"; exit 1; }

# 2. THE TRUTH (Unit & Integration Tests)
echo -e "\n🧪 [STAGE 2] Running Logic Tests (Vitest)..."
# Menjalankan test dengan coverage minimal 80%
npm run test:coverage || { echo -e "${RED}❌ TESTS FAILED or Coverage < 80%. Logic is flawed.${NC}"; exit 1; }

# 3. THE FORTRESS (Security Audit)
echo -e "\n🔒 [STAGE 3] Scanning for Vulnerabilities (NPM Audit)..."
# Hanya fail jika ada kerentanan level HIGH atau CRITICAL
npm audit --audit-level=high || { echo -e "${RED}❌ SECURITY VULNERABILITY FOUND. Audit your dependencies!${NC}"; exit 1; }

# 4. THE INTEGRITY (Production Build Check)
echo -e "\n📦 [STAGE 4] Building Production Bundle..."
npm run build || { echo -e "${RED}❌ BUILD FAILED. Check your TypeScript types.${NC}"; exit 1; }

# 5. THE PERFORMANCE (Local Smoke Test)
# Tahap ini dijalankan jika file k6 tersedia
if [ -f "./tests/smoke-test.js" ]; then
    echo -e "\n⚡ [STAGE 5] Running k6 Smoke Test (Performance)..."
    k6 run ./tests/smoke-test.js || { echo -e "${RED}❌ PERFORMANCE DEGRADATION. Latency too high!${NC}"; exit 1; }
fi

echo -e "\n${GREEN}✅ ALL SYSTEMS GO. CONSTITUTIONAL CHECK PASSED.${NC}"
echo -e "${GREEN}Status: 🟢 INSTITUTIONAL GRADE READY.${NC}"
