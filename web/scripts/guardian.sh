#!/bin/bash

# =================================================================
# PROJECT ANTIGRAVITY (RZUNA) - FRONTEND CONSTITUTIONAL GUARDIAN
# =================================================================
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' 

echo -e "${GREEN}🛡️  STARTING FRONTEND CONSTITUTIONAL AUDIT...${NC}"

# 1. THE LAW (Static Analysis & Linting)
echo -e "\n🔍 [STAGE 1] Checking UI Syntax & Style (ESLint)..."
npm run lint || { echo -e "${RED}❌ LINTING FAILED. Fix UI style errors.${NC}"; exit 1; }

# 2. THE TRUTH (Unit & Integration Tests)
echo -e "\n🧪 [STAGE 2] Running UI Logic Tests (Vitest)..."
npm run test:coverage || { echo -e "${RED}❌ TESTS FAILED or Coverage < 80%. UI logic is flawed.${NC}"; exit 1; }

# 3. THE FORTRESS (Security Audit)
echo -e "\n🔒 [STAGE 3] Scanning for Vulnerabilities (NPM Audit)..."
# In a consolidated monorepo, we check the root audit for institutional-grade compliance
cd .. && npm audit --audit-level=high || { echo -e "${RED}❌ SECURITY VULNERABILITY FOUND. Audit your dependencies!${NC}"; exit 1; }
cd web


# 4. THE INTEGRITY (Production Build Check)
echo -e "\n🏗️ [STAGE 4] Building Production UI Bundle..."
npm run build || { echo -e "${RED}❌ BUILD FAILED. Check your React/Next.js types.${NC}"; exit 1; }

echo -e "\n${GREEN}✅ ALL UI SYSTEMS GO. CONSTITUTIONAL CHECK PASSED.${NC}"
echo -e "${GREEN}Status: 🟢 FRONTEND INSTITUTIONAL GRADE READY.${NC}"
