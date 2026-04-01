# 🏛️ Canonical Master Blueprint: rzuna (v1.6)

**Project Vision**: The World-Class No-Registration AI DEX & Scouting Infrastructure for Solana.
**Status**: LOCKED
**Guiding Principle**: No-Drift Policy — Setiap baris kode harus mendukung kecepatan, akurasi, dan kualitas platform.

---

## 1. ⚙️ Technical Stack (The Powerhouse)

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Data Engine** | Solana Geyser (gRPC) | Ultra-low latency raw data streaming (Pump.fun & DEX). |
| **Execution** | Jito Bundles + Tip | Atomic, anti-MEV transaction delivery. |
| **Routing** | Jupiter V6 SDK | Best price discovery and swap aggregation. |
| **Backend/DB** | Supabase (Postgres) | Real-time data persistence & Wallet-based Auth (SIWS). |
| **AI Agent** | Eliza OS (Pattern) | Lightweight narrative analysis & L2 reasoning pipeline. |
| **UI Framework** | Next.js + Tailwind | Institutional-grade, sleek, and high-performance interface. |
| **Deployment** | Vercel (Edge) | Global UI hosting with Edge Functions for maximum speed. |

---

## 2. 👤 Identity & Access (The No-Reg Model)

- **Identity = Wallet Address**: Tidak ada registrasi email/password. Pengguna masuk menggunakan Sign-In with Solana (SIWS).
- **Profile Persistence**: Semua data volume, rank, dan status langganan diikat ke `wallet_address` di database.
- **Privacy-First**: Platform tidak menyimpan data pribadi di luar aktivitas on-chain dan profil internal.

---

## 3. 🧠 Intelligence & Auto-Down Logic

Platform ini adalah kurator aktif, bukan sekadar daftar statis.

**Hybrid Scoring (0-100)**:
- **L1 (Rule-base)**: Filter matematis cepat (<100ms) berdasarkan likuiditas, mint authority, dan holder distribution.
- **L2 (AI Reason)**: Analisis narasi berbasis Eliza OS Pattern. Tersedia untuk semua tier berbayar dengan sistem kuota harian.

**The Auto-Down Trigger**:
- Jika skor token turun di bawah 85, sistem secara otomatis mengubah status menjadi `is_active = false`.
- Token yang tidak aktif akan otomatis hilang dari dashboard pengguna secara real-time via Supabase Broadcast.

---

## 4. 🏆 Rank & Economy (ML-Style)

Sistem peringkat adiktif berbasis volume transaksi bulanan.

### A. The Ranks (Volume Grinders)

| Rank | Volume (USD) | Platform Fee |
| :--- | :--- | :--- |
| **Newbie** | Start | 2.0% |
| **Pro** | $1,000 | 1.75% |
| **Elite** | $10,000 | 1.5% |

### B. Paid Passes (The Shortcuts & AI Access)

| Pass Tier | Platform Fee | AI Reasoning Quota | Rank Protection |
| :--- | :--- | :--- | :--- |
| **STARLIGHT** | 1.25% | 20 Analisis / Hari | Active |
| **STARLIGHT+** | 1.0% | 100 Analisis / Hari | Active |
| **VIP (Dedicated)** | 0.75% | Unlimited (Deep Reasoning) | Active |

---

## 5. 💰 Revenue Streams

- **Trading Fees**: Pendapatan bersih platform (0.75% - 2.0%) yang diakumulasikan ke `total_fees_paid`.
- **Subscription Fees**: Pendapatan bulanan tetap dari penjualan Pass.
- **Affiliate Rebates**: Rebate otomatis dari rujukan protokol Jupiter.

---

## 6. 🛡️ The Guardians (Quality & Reliability)

- **Guardian CI**: Audit otomatis (Lint, Type Check, Unit Tests) via GitHub Actions.
- **Observability Trio**: Sentry (Error), Axiom (Finance/gRPC Log), PostHog (Feature Flags & Quota).
- **Vercel Insights**: Pemantauan performa Web Vitals dan latensi Edge secara real-time.

---

## 7. 🚦 No-Drift Policy

- Setiap fitur baru harus divalidasi terhadap dampaknya pada latensi (<200ms).
- Deployment UI ke Vercel wajib melalui tahapan preview environment untuk verifikasi Guardian CI.
- Tidak ada kode yang boleh di-deploy tanpa melewati audit teknis penuh.

---

## 8. 🌐 Domain & Routing Strategy (The aivo.sh Network)

| Service | Domain | Target | Stack |
| :--- | :--- | :--- | :--- |
| **Marketing** | `aivo.sh` | Landing Page & SIWS | Vercel (Static) |
| **Normal Trade** | `trade.aivo.sh` | Dashboard Public/Starlight | Vercel (Edge) |
| **VIP / Dedicated** | `vip.aivo.sh` | Dedicated Infra Dashboard | Vercel + Dedicated gRPC |
| **Backend / API** | `api.aivo.sh` | Fastify Core & WebSocket | Supabase / Private VPS |

- **Marketing (`aivo.sh`)**: Pusat edukasi dan pintu masuk utama.
- **Trade Dash (`trade.aivo.sh`)**: Performa tinggi untuk tier Newbie hingga Starlight+.
- **VIP Lounge (`vip.aivo.sh`)**: Jalur khusus VIP dengan koneksi dedicated gRPC ke Solana Mainnet.
- **API Engine (`api.aivo.sh`)**: Backbone pengolahan data dan scoring rzuna.

Routing dikendalikan oleh **Next.js Edge Middleware** yang membaca header `Host` dan merewrite request ke route yang sesuai secara transparan:
- `vip.aivo.sh` → `/vip` + header `x-tier: vip`
- `trade.aivo.sh` → `/dashboard`
- `aivo.sh` → `/` (marketing / SIWS landing)

---

## 9. 🛠️ Infrastructure Hardening (PR 7)

### A. Terraform & Dedicated Infrastructure

**Fase: Live Deployment** — Segera setelah PR 6 (UI Foundation) tuntas.

`vip.aivo.sh` diarahkan ke dedicated node gRPC (Yellowstone) untuk memastikan user VIP tidak berbagi bandwidth data dengan user gratisan. Ini adalah kunci untuk memenangkan race transaksi di Solana.

**Fase: Infrastructure Hardening** — Setelah semua servis stabil berjalan secara manual (Live Beta).

Terraform akan mengunci konfigurasi DNS (Cloudflare/Vercel) dan provisioning server untuk `api.aivo.sh`. Jika sistem crash, seluruh ekosistem aivo.sh dapat dibangkitkan kembali dengan satu perintah `terraform apply`.

### B. Dedicated gRPC Routing

- `GeyserService` mendukung dua mode: `public` (GEYSER_ENDPOINT) dan `vip` (VIP_GEYSER_ENDPOINT).
- VIP mode diaktifkan dari backend ketika user tier terdeteksi sebagai `SubscriptionStatus.VIP`.
- Fallback ke no-op mode jika credentials tidak tersedia — tidak ada error, tidak ada sinyal.

### C. CORS Hardening

- Backend Fastify (`api.aivo.sh`) hanya menerima request dari `*.aivo.sh` dan `localhost` (dev).
- Dikonfigurasi via `ALLOWED_ORIGINS` env var untuk fleksibilitas deployment.

### D. Load Balancing Target

- Distribusi traffic antara `trade` dan `vip` untuk menjaga latensi **< 200ms**.
- **IaC (Terraform)**: Otomatisasi deployment untuk memastikan konsistensi antar subdomain.

---

**Master Blueprint v1.6 - Finalized with aivo.sh Network & Routing Layer.**
