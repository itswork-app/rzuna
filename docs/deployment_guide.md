# 🏛️ Institutional Deployment Guide: RZUNA (aivo.sh)

This guide provides the step-by-step instructions for deploying and provisioning the RZUNA ecosystem with institutional-grade security and performance.

---

## 1. Backend Provisioning (Hetzner CCX VPS)

The backend runs as a containerized Fastify service on a Hetzner VPS.

### 🛡️ Firewall Configuration (UFW)

Ensure only necessary ports are open:

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3001/tcp  # Backend API
sudo ufw enable
```

### 📦 Docker Runtime

The backend uses `docker-compose.yml` for resource-limited execution (0.5 CPU, 1G RAM).

1.  **Transfer Files**: Ensure `Dockerfile`, `docker-compose.yml`, and `package.json` are in `/opt/rzuna`.
2.  **Environment**: Create `/opt/rzuna/.env` with your production secrets (Supabase, Solana RPC, Private Keys).
3.  **Launch**:
    ```bash
    cd /opt/rzuna
    docker-compose up -d --build
    ```

---

## 2. Frontend Deployment (Vercel)

The frontend is a Next.js application designed for global distribution via Vercel.

### 🎨 Project Setup

1.  **Link Repository**: Import the `rzuna` monorepo into Vercel.
2.  **Root Directory**: Set to **`web/`**.
3.  **Environment Variables**:
    - `NEXT_PUBLIC_API_URL`: `https://api.aivo.sh`
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
4.  **Framework Preset**: Select `Next.js`.

---

## 🌐 3. Subdomain & DNS Provisioning

To support the multi-surface architecture, configure the following DNS records in your provider (e.g., Cloudflare):

| Subdomain       | Type      | Target                 | Description                        |
| :-------------- | :-------- | :--------------------- | :--------------------------------- |
| `api.aivo.sh`   | **A**     | `178.104.10.58`        | Routes traffic to the VPS Backend. |
| `trade.aivo.sh` | **CNAME** | `cname.vercel-dns.com` | Standard trading dashboard.        |
| `vip.aivo.sh`   | **CNAME** | `cname.vercel-dns.com` | Premium institutional surface.     |

> [!IMPORTANT]
> **Vercel Domains**: In your Vercel project settings, you **must add both** `trade.aivo.sh` and `vip.aivo.sh` to the project. The internal `middleware.ts` will handle the routing based on these hostnames.

---

## 🚀 4. CI/CD Auto-Deployment

Automated deployment is handled via GitHub Actions as defined in `.github/workflows/ci.yml`.

### 🔑 GitHub Secrets Configuration

To enable auto-deploy to the VPS, add these secrets to your GitHub repository (**Settings > Secrets and variables > Actions**):

- `VPS_SSH_KEY`: The **Private Key** matching the public key on the VPS (`root@178.104.10.58`).
- `SUPABASE_URL`: (Optional, for Guardian CI).
- `SUPABASE_KEY`: (Optional, for Guardian CI).

### 🛠️ Execution Flow

1.  Push to `main`.
2.  GitHub Actions runs the **Guardian Audit** (Linting, Tests, Security Scan).
3.  Upon "Green" status, the **Deploy job** connects to the VPS via SSH, pulls the latest code, and restarts the Docker containers.

---

> [!TIP]
> **Health Check**: After deployment, verify the backend status at `https://api.aivo.sh/health`. If it reports `{"status":"ok"}`, the system is fully operational.
