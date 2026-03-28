🛸 PROJECT ANTIGRAVITY (RZUNA) - MASTER BLUEPRINT v3.0
Status: CONSTITUTIONAL DOCUMENT
Author: Bobby (Solo Founder & Auditor)
Execution Environment: Antigravity IDE (Development) -> Hetzner Dedicated (Production)

🏗️ 1. TECH STACK & ARCHITECTURE (LOCKED)
Dilarang keras menggunakan teknologi di luar daftar ini untuk menjaga performa 0ms Latency.
- API Framework: Fastify (Bukan Express, demi kecepatan serialisasi JSON).
- Data Feed: Yellowstone Geyser via gRPC (Yellowstone-grpc).
- AI Engine: ElizaOS (Core Logic) – Harus di-obfuscate sebelum deployment.
- Database: Supabase (PostgreSQL + Real-time).
- Infrastructure: Hetzner CCX23 (Dedicated vCPU).
- Monitoring: Sentry (Error), Axiom (Logs & Dashboard), Checkly (Uptime API).
- Payment: Solana Pay (SOL/USDC).

⚖️ 2. THE GUARDIAN CONSTITUTION (CI/CD)
Keamanan dan kualitas adalah harga mati. Tidak ada kode yang boleh di-deploy tanpa melewati:
- Strict Linting: ESLint tanpa warning.
- Unit Testing: Vitest dengan coverage minimal 80%.
- Stress Testing: k6 Smoke Test dengan target P99 Latency < 150ms.
- Local-First Development: Gunakan Mock Geyser dan Solana Devnet di Antigravity IDE sebelum menyentuh Mainnet atau Hetzner.

💰 3. REVENUE LOGIC & TIERING
Bot harus memvalidasi kasta user di setiap request eksekusi.
Tier | Min. Buy (SOL) | Trading Fee | Fitur Unggulan
--- | --- | --- | ---
Newbie | 0.1 | 3.0% | Manual Trading, Basic Scoring.
Active | 0.05 | 1.5% | Auto-Sell (TP/SL Dasar).
Elite | 0.01 | 1.0% | Trailing Stop, API Access.
VVIP | 0 | 0.5% | Dedicated VPS, Helius-style Metrics.

🛠️ 4. STRATEGI IMPLEMENTASI (PR ROADMAP)
Eksekusi dilakukan secara modular melalui 6 Pull Request (PR):
- PR #1: Foundation & CI. Setup Fastify, Guardian Script, Sentry, dan Axiom.
- PR #2: Nervous System. gRPC Geyser Client & ElizaOS Scoring.
- PR #3: Executioner. Jupiter Swap & Logika Trailing Stop.
- PR #4: Economy. Supabase Integration & Solana Pay.
- PR #5: Fortress. Automasi Provisioning Hetzner & Obfuscation.
- PR #6: Command Center. Refine.js Dashboard (Grinder vs VVIP View).

🔒 5. SECURITY & PRIVACY
- Black Box: User VVIP menyewa layanan, bukan server. Akses SSH dilarang.
- IP Protection: Algoritma scoring ElizaOS adalah rahasia perusahaan.
- No Private Keys: Gunakan environment variables yang aman dan jangan pernah simpan private key user di database (Gunakan delegated wallet atau session signing).
