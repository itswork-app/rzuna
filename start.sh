#!/bin/bash
# 📜 RZUNA V22.1 CANONICAL ENTRY POINT
# Standard: Institutional-Grade Monorepo (Singularity)

echo "🛡️ [AIVO] Initializing Canonical Singularity V22.1..."

if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is required to run the monorepo."
    exit 1
fi

# 1. Verification Stage
echo "🔍 Running Constitutional Audit..."
pnpm turbo run lint test:coverage build

if [ $? -eq 0 ]; then
    echo "✅ Audit Passed. Initializing Development Environment..."
    pnpm turbo run dev
else
    echo "❌ Audit Failed. Please check the logs for constitutional violations."
    exit 1
fi
