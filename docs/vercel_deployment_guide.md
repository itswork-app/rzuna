# 🚀 Institutional Vercel Deployment Guide (V22.2)

Standardized deployment procedures for the RZUNA monorepo, strictly aligned with the **Master Blueprint V22.2**.

---

## 🏛️ Deployment Strategy (Master Blueprint Section VI)

| Application | Domain(s) | Project ID | Build Command |
| :--- | :--- | :--- | :--- |
| **B2C Terminal** | `aivo.sh`, `app.aivo.sh` | `prj_sVrMFL10r6PZ4JB4YQniFIUQAWCt` | `pnpm build --filter=@rzuna/terminal` |
| **B2B Dashboard** | `b2b.aivo.sh`, `developers.aivo.sh` | `prj_iIsKJyahNH5lq4ei11ImVmPfhuIA` | `pnpm build --filter=@rzuna/dashboard` |
| **Admin Panel** | `admin.aivo.sh` | `prj_wtYAZm40MtYSwQfNxhRuqolyVgJv` | `pnpm build --filter=@rzuna/admin` |

---

## 🛠️ Step 1: Vercel Project Configuration

For each application above, create a **separate Vercel Project** with these specific Institutional Hardening settings:

### **General Settings**
*   **Framework Preset**: `Next.js`
*   **Root Directory**: `/` (Keep as monorepo root to allow shared package access).

### **Build & Development Settings**
*   **Install Command**: `pnpm install`  
    > [!IMPORTANT]
    > **Crucial**: This override is MANDATORY to support the `workspace:*` protocol used in the monorepo.
*   **Build Command**: (Refer to the table above).
*   **Output Directory**: `.next`

---

## 🔒 Step 2: Environment Variable Matrix

The following variables must be configured in Vercel for **each** project:

| Category | Key | Value / Source |
| :--- | :--- | :--- |
| **Solana** | `NEXT_PUBLIC_SOLANA_RPC_URL` | Your Helius/Alchemy/QuickNode Endpoint |
| **Solana** | `NEXT_PUBLIC_NETWORK` | `mainnet-beta` |
| **Backend** | `NEXT_PUBLIC_API_URL` | `https://api.aivo.sh` (Hetzner Engine) |
| **Observability**| `NEXT_PUBLIC_AXIOM_TOKEN` | Axiom.io API Token |
| **Analytics** | `NEXT_PUBLIC_POSTHOG_KEY` | PostHog API Key |

---

## 🛡️ Step 3: Zero-Trust Security (Admin Only)

For `admin.aivo.sh`, the Master Blueprint requires **layered security**:

1.  **Vercel Authentication**: Enable "Vercel Authentication" or "Deployment Protection" in the project settings.
2.  **IP Whitelisting**: If utilizing Helius or dedicated RPCs, whitelist the Vercel static IP ranges (refer to Vercel documentation for `vercel-ip-list`).
3.  **Institutional Auth**: Use the integrated Auth providing logic secured by Solana wallet signatures.

---

## ⚠️ Troubleshooting: The "workspace:" Protocol Error

If you see: `Unsupported URL Type "workspace:"`.

1.  **Cause**: Vercel is defaulting to `npm` installer.
2.  **Fix**: Ensure `pnpm-lock.yaml` is at the root and you have overridden the **Install Command** to `pnpm install`.
3.  **Local Sync**: Run `pnpm install` locally before pushing to ensure the lockfile is up to date with the latest workspace dependencies.

---

## 📊 Verification Checklist

- [ ] **Stage 1**: Vercel builds successfully with `pnpm install`.
- [ ] **Stage 2**: `/health` endpoint returns `200 OK` on the public URL.
- [ ] **Stage 3**: Solana Wallet Adapter connects successfully to Mainnet.
- [ ] **Stage 4**: API calls to `api.aivo.sh` pass CORS validation.

> **Status:** 🟢 INSTITUTIONAL GRADE READY.
