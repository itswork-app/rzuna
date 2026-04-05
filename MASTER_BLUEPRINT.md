# 📜 CONSTITUTION OF AIVO PROTOCOL (V22.1) - CANONICAL SINGULARITY

**Project Code:** Antigravity | **Repo:** rzuna/antigravity | **Founder:** Bobby

## I. TATA KELOLA (TRIAS POLITIKA)

1. **Polisi (Zod):** Validasi data di setiap entry point (API/Ingestion).
2. **Jaksa (Vitest):** Min coverage 80% untuk logika Revenue & Contracts.
3. **Hakim (CI/CD):** Blocker absolut rilis jika test/lint gagal.
4. **The Law (Test Pyramid):**
   - **Layer 1: Unit & Integration:** Standard Fastify & Drizzle coverage (>80%).
   - **Layer 2: Alpha Replayer:** Replaying historical PumpPortal events via `backtest_alpha.test.ts`.
   - **Layer 3: Dry-Run Safety:** Enforcing `IS_SIMULATION` and `EXECUTION_MODE=dry_run` validation via `simulation_dryrun.test.ts`.

## II. REPOSITORY STRUCTURE (TURBOREPO)

├── apps/
│ ├── engine/ # Fastify, ElizaOS, Adapters (Hetzner CCX23)
│ ├── terminal/ # NextForge B2C Alpha Terminal (Vercel)
│ ├── dashboard/ # NextForge B2B Developer Portal (Vercel)
│ ├── admin/ # Refine God Mode Admin Panel (Vercel)
│ └── telegram/ # Signal & Trading Bot (Telegraf)
├── packages/
│ ├── contracts/ # Single Source of Truth (Zod Schemas)
│ ├── database/ # Drizzle ORM + Migrations
│ ├── sdk/ # @aivo/sdk for B2B Partners
│ └── ui/ # Shared UI Library (Shadcn)

## III. TECHNICAL SPECIFICATIONS (HIGH-MEMORY)

- **Compute:** Hetzner CCX23 (4 Dedicated vCPU / 16GB RAM).
- **Memory Management:** Docker Engine limit 15000MB. 16GB SWAP active.
- **Data Dual-Path:**
  - **PumpPortal.fun:** Real-time Tx & Bonding Curve (Machine).
  - **Pumpapi.io:** Rich Social Metadata (UI/Filter).
- **Execution:** Jupiter v6 + Jito Dynamic Tipping.
- **Intelligence:** ElizaOS + API X (Sentiment) + OpenRouter (Reasoning).
- **Safety:** IS_SIMULATION=true (Paper Trading) & Dry-Run logging.

## IV. REVENUE & PRODUCT MATRIX

- **B2B Tiers:** Starlight ($99), Starlight+ ($499), VIP ($1,499).
- **B2C Ranks:** Bronze (2.0% fee) s/d Mythic (1.0% fee).
- **Utility:** $AIVO payment discount 20% + 10% Burn mechanism.

## V. B2B ECOSYSTEM LAWS (THE NERVE)

1. **Strict Authentication:** API access is MANDATORY via `x-api-key` header, validated against the `api_keys` table.
2. **Usage Tracking:** Every call must be logged atomically in `usage_logs` to trigger rate limiting or billing.
3. **Revenue Integrity:** B2B fees (1.5% - 0.5%) are locked at the Engine level and logged to `treasury_logs`.
4. **Rate Limiting:** Dynamic limits based on B2B Tier: Starlight (10 RPM), Starlight+ (100 RPM), VIP (Unlimited/High).

## VI. DOMAIN MAPPING & SAAS ARCHITECTURE (`aivo.sh`)

Sistem arsitektur berbasis *Micro-Frontend & Dedicated Backend* untuk jualan B2B (Helius-style):

1. **`app.aivo.sh` / `aivo.sh` (Vercel)**
   - **Target:** `apps/terminal`
   - **Fungsi:** Aplikasi B2C Alpha Terminal. Portal utama pelancong ritel untuk bertransaksi dan melihat *dashboard* sinyal token.

2. **`api.aivo.sh` (Hetzner CCX23 Dedicated)**
   - **Target:** `apps/engine`
   - **DNS Setup:** `A Record` murni ke IP VPS (tanpa proksi Cloudflare demi minimalisasi latensi WebSockets).
   - **Fungsi:** Urat nadi sistem / API Gateway berbayar. Integrasi koneksi WebSocket Solana dan eksekutor OpenAI/ElizaOS asinkron.

3. **`b2b.aivo.sh` / `developers.aivo.sh` (Vercel)**
   - **Target:** `apps/dashboard`
   - **Fungsi:** B2B Developer Portal. Di sini tempat klien melakukan *Top-Up* saldo, meng-generate `x-api-key`, dan melihat pantauan pemakaian kuota API (*Rate limits & Usage Logs*).

4. **`admin.aivo.sh` (Vercel + Zero Trust)**
   - **Target:** `apps/admin`
   - **Fungsi:** Panel kendali internal (God Mode). Sangat krusial diamankan berlapis (contoh: Vercel Auth / Cloudflare Access).
