# 🏛️ Canonical Master Blueprint: rzuna (v1.4)

**Project Vision:** The World-Class No-Registration AI DEX & Scouting Infrastructure for Solana.
**Status:** LOCKED
**Guiding Principle: No-Drift Policy** — Every line of code must serve the speed, accuracy, and quality of the platform.

---

## 1. ⚙️ Technical Stack (The Powerhouse)

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Data Engine** | Solana Geyser (gRPC) | Ultra-low latency raw data streaming (Pump.fun & DEX). |
| **Execution** | Jito Bundles + Tip | Atomic, anti-MEV transaction delivery. |
| **Routing** | Jupiter V6 SDK | Best price discovery and swap aggregation. |
| **Backend/DB** | Supabase (Postgres) | Real-time data persistence & Wallet-based Auth (SIWS). |
| **AI Agent** | Eliza OS (Pattern) | Lightweight narrative analysis & L2 reasoning pipeline. |
| **UI** | UI Refiner Standard | Institutional-grade, sleek, and high-performance interface. |

---

## 2. 👤 Identity & Access (The No-Reg Model)

- **Identity = Wallet Address:** Tidak ada registrasi email/password. Pengguna masuk menggunakan Sign-In with Solana (SIWS).
- **Profile Persistence:** Semua data volume, rank, dan status langganan diikat ke `wallet_address` di database.
- **Privacy-First:** Platform tidak menyimpan data pribadi di luar aktivitas on-chain dan profil internal.

---

## 3. 🧠 Intelligence & Auto-Down Logic

Platform ini adalah kurator aktif, bukan sekadar daftar statis.

**Hybrid Scoring (0-100):**
- **L1 (Rule-base):** Filter matematis cepat (<100ms) berdasarkan likuiditas, mint authority, dan holder distribution.
- **L2 (AI Reason):** Analisis sentimen dan narasi berbasis Eliza OS Pattern. Tersedia untuk semua tier berbayar dengan sistem kuota.

**The Auto-Down Trigger:**
- Jika skor token turun di bawah **85**, sistem secara otomatis mengubah status menjadi `is_active = false`.
- Token yang tidak aktif akan otomatis "turun" atau hilang dari dashboard pengguna secara real-time via Supabase Broadcast.

---

## 4. 🏆 Rank & Economy (ML-Style)

Sistem peringkat adiktif berbasis volume transaksi bulanan.

### A. The Ranks (Volume Grinders)

| Rank | Volume (USD) | Platform Fee |
| :--- | :--- | :--- |
| **Newbie** | Start | 2.0% |
| **Pro** | $1,000 | 1.75% |
| **Elite** | $10,000 | 1.5% |

- **Monthly Reset:** Rank turun 1 tingkat setiap bulan jika target volume tidak tercapai (Kecuali dilindungi Subscription).

### B. Paid Passes (The Shortcuts & Brain Access)

| Pass Tier | Platform Fee | AI Reasoning Quota | Rank Protection |
| :--- | :--- | :--- | :--- |
| **STARLIGHT** | 1.25% | Low (Basic Narrative) | Active |
| **STARLIGHT+** | 1.0% | Medium (Advanced Analysis) | Active |
| **VIP (Dedicated)** | 0.75% | High (Deep Reasoning) | Active |

---

## 5. 💰 Revenue Streams

- **Trading Fees:** Pendapatan bersih platform berdasarkan tier (0.75% - 2.0%).
- **Subscription Fees:** Pendapatan bulanan dari penjualan Starlight, Starlight+, dan VIP Pass.
- **Affiliate Rebates:** Pendapatan tambahan dari program rujukan Jupiter.

---

## 6. 🛡️ The Guardians (Quality & Reliability)

- **Guardian CI:** Sistem otomatis di GitHub Actions (Lint, Type Check, Unit Tests).
- **Observability Trio:**
  - **Sentry:** Memantau runtime errors.
  - **Axiom:** Log audit finansial dan gRPC.
  - **PostHog:** Manage Feature Flags (e.g., `jupiter_swap_enabled`) dan kuota AI.

---

## 7. 🚦 No-Drift Policy

- Setiap fitur baru harus divalidasi terhadap dampaknya pada latensi (<200ms).
- Setiap perubahan skema database harus mendukung integritas sistem Rank dan Quota.
- Tidak ada kode yang boleh di-deploy tanpa melewati audit Guardian CI.

---

**Master Blueprint v1.4 - Updated & Ready for PR 6.**
