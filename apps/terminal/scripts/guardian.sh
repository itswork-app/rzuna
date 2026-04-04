#!/bin/bash

# =================================================================
# PROJECT ANTIGRAVITY (RZUNA) - FRONTEND CONSTITUTIONAL GUARDIAN
# =================================================================
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' 

echo -e "${GREEN}🛡️  STARTING FRONTEND CONSTITUTIONAL AUDIT...${NC}"

# Ensure we are in the correct directory (apps/terminal)
cd "$(dirname "$0")/.."

# 1. THE LAW (Static Analysis & Linting)
echo -e "\n🔍 [STAGE 1] Checking UI Syntax & Style (ESLint)..."
pnpm run lint || { echo -e "${RED}❌ LINTING FAILED. Fix UI style errors.${NC}"; exit 1; }

# 2. THE TRUTH (Unit & Integration Tests)
echo -e "\n🧪 [STAGE 2] Running UI Logic Tests (Vitest)..."
pnpm run test:coverage || { echo -e "${RED}❌ TESTS FAILED or Coverage < 80%. UI logic is flawed.${NC}"; exit 1; }

# 3. THE INTEGRITY (Production Build Check)
echo -e "\n🏗️ [STAGE 3] Building Production UI Bundle..."
pnpm run build || { echo -e "${RED}❌ BUILD FAILED. Check your React/Next.js types.${NC}"; exit 1; }

echo -e "\n${GREEN}✅ ALL UI SYSTEMS GO. CONSTITUTIONAL CHECK PASSED.${NC}"
echo -e "${GREEN}Status: 🟢 FRONTEND INSTITUTIONAL GRADE READY.${NC}"
