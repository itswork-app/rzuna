import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * rzuna Multi-Subdomain & SIWS Guard Middleware
 * Blueprint v1.6: PR 10 Hardened Implementation
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;

  // Strip port for local dev
  const hostname = host.split(':')[0];

  // Institutional Subdomain Mapping
  const isVipSubdomain = hostname === 'vip.aivo.sh' || hostname === 'vip.localhost';
  const isTradeSubdomain = hostname === 'trade.aivo.sh' || hostname === 'trade.localhost';

  // 1. VIP Subdomain Logic
  if (isVipSubdomain) {
    const subscription = request.cookies.get('x-rzuna-subscription')?.value || 'NONE';
    const isAuthenticated =
      request.cookies.get('sb-access-token') || request.cookies.get('x-rzuna-authenticated');

    // Strict Ejection: Only VIP tier allowed on vip.aivo.sh
    if (subscription !== 'VIP') {
      const url = request.nextUrl.clone();
      url.hostname = hostname.replace('vip', 'trade');
      url.pathname = '/dashboard';
      if (isAuthenticated) {
        url.searchParams.set('error', 'vip_tier_required');
      }
      return NextResponse.redirect(url.toString());
    }

    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      const res = NextResponse.redirect(url.toString());
      res.headers.set('X-RZUNA-VIP-MODE', 'true');
      return res;
    }
  }

  // 2. Trade Subdomain Logic
  if (isTradeSubdomain) {
    const subscription = request.cookies.get('x-rzuna-subscription')?.value || 'NONE';

    // VIP Funnel: Send VIPs to their dedicated surface
    if (subscription === 'VIP') {
      const url = request.nextUrl.clone();
      url.hostname = hostname.replace('trade', 'vip');
      url.pathname = pathname === '/' ? '/dashboard' : pathname;
      return NextResponse.redirect(url.toString());
    }

    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url.toString());
    }
  }

  // 3. Header Injections for Frontend/Backend Sync
  const response = NextResponse.next();
  if (isVipSubdomain) {
    response.headers.set('X-RZUNA-VIP-MODE', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes handled by Fastify)
     * - _next/static, _next/image (Next.js assets)
     * - favicon.ico, public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
