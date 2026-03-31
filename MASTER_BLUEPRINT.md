# 🏛️ Canonical Master Blueprint: rzuna (v1.3)

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
| **AI Agent** | Eliza OS (TypeScript) | Deep reasoning and narrative analysis for VIP tier. |
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
- **L2 (AI Reason):** Analisis sentimen dan narasi oleh Eliza OS khusus untuk tier VIP.

**The Auto-Down Trigger:**
- Jika skor token turun di bawah **85**, sistem secara otomatis mengubah status menjadi `is_active = false`.
- Token yang tidak aktif akan otomatis "turun" atau hilang dari dashboard pengguna secara real-time via Supabase Broadcast.

---

## 4. 🏆 Rank & Economy (ML-Style)

Sistem peringkat adiktif berbasis volume transaksi bulanan.

### A. The Ranks (Volume Grinders)

| Rank | Requirement | Perk |
| :--- | :--- | :--- |
| **Newbie** | Start | Akses scouting standar. |
| **Pro** | Volume X | Prioritas visibilitas sinyal. |
| **Elite** | Volume Y | Probabilitas tertinggi mendapatkan token skor 90+. |

- **Monthly Reset:** Rank turun 1 tingkat setiap bulan jika target volume tidak tercapai.

### B. Paid Passes (The Shortcuts)

- **Starlight / Starlight+:** Akses eksklusif ke Private Tokens (Skor 90+) dan fitur Rank Protection.
- **VIP:** Infrastruktur gRPC khusus, latensi terendah, dan akses penuh ke AI Reasoning.

---

## 5. 💰 Revenue Streams

- **Trading Fees:** Potongan % dari setiap transaksi swap (Launchpad & DEX) yang dilakukan melalui platform.
- **Subscription Fees:** Pendapatan bulanan dari penjualan Starlight, Starlight+, dan VIP Pass.
- **Affiliate Rebates:** Pendapatan tambahan dari program rujukan Jupiter.

---

## 6. 🛡️ The Guardians (Quality & Reliability)

- **Guardian CI:** Sistem "Polisi & Hakim" otomatis di GitHub Actions yang menjalankan Lint Check, Type Check, dan Unit Tests sebelum kode boleh di-merge.
- **Observability Trio:**
  - **Sentry:** Memantau runtime errors dan performance bottlenecks.
  - **Axiom:** Mencatat log gRPC masif untuk audit transaksi dan investigasi latensi.
  - **PostHog:** Mengelola Feature Flags untuk akses tier user dan analitik pertumbuhan.

---

## 7. 🚦 No-Drift Policy

- Setiap fitur baru harus divalidasi terhadap dampaknya pada latensi (<200ms).
- Setiap perubahan skema database harus mendukung integritas sistem Rank.
- Tidak ada kode yang boleh di-deploy tanpa melewati audit Guardian CI.

---

**Master Blueprint v1.3 - Finalized & Authorized.**
