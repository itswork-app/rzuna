/**
 * Frontend Environment Resolver — Blueprint v1.6 (aivo.sh Network)
 *
 * Resolves the correct API base URL based on the domain the user is on.
 * - vip.aivo.sh  → https://api.aivo.sh  (dedicated path, same API, VIP header added by middleware)
 * - trade.aivo.sh → https://api.aivo.sh
 * - aivo.sh       → https://api.aivo.sh
 * - localhost      → http://localhost:3001 (dev)
 *
 * In practice, a single NEXT_PUBLIC_API_URL override is always honoured first.
 */

const PROD_API_URL = 'https://api.aivo.sh';
const DEV_API_URL = 'http://localhost:3001';

/**
 * Returns the correct API base URL for the current environment.
 * Safe to call in both server components and client components.
 */
export function getApiUrl(): string {
  // Explicit override always wins (useful for preview deployments)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In browser: derive from current hostname
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return DEV_API_URL;
    }
    // All aivo.sh subdomains route to the same API engine
    if (hostname.endsWith('.aivo.sh') || hostname === 'aivo.sh') {
      return PROD_API_URL;
    }
  }

  // SSR / Edge: fall back to env var or prod default
  return process.env.NODE_ENV === 'production' ? PROD_API_URL : DEV_API_URL;
}
