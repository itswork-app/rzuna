import { type NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware — aivo.sh Network Subdomain Router
 * Blueprint v1.6: Routes each subdomain to the correct Next.js route.
 *
 *  vip.aivo.sh   → /vip    (adds x-tier: vip header for downstream components)
 *  trade.aivo.sh → /dashboard
 *  aivo.sh       → /       (marketing & SIWS landing, no rewrite needed)
 *
 * Works transparently in Vercel Edge — no redirect visible to the user.
 */
export function proxy(request: NextRequest): NextResponse {
  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;

  // Strip port for local dev: trade.localhost:3000 → trade.localhost
  const hostname = host.split(':')[0];

  // VIP Dedicated Lounge
  if (hostname === 'vip.aivo.sh' || hostname === 'vip.localhost') {
    // Only rewrite if not already on /vip to avoid infinite loops
    if (!pathname.startsWith('/vip')) {
      const url = request.nextUrl.clone();
      url.pathname = `/vip${pathname === '/' ? '' : pathname}`;
      const response = NextResponse.rewrite(url);
      response.headers.set('x-tier', 'vip');
      return response;
    }
    const response = NextResponse.next();
    response.headers.set('x-tier', 'vip');
    return response;
  }

  // Trade Dashboard (Newbie → Starlight+)
  if (hostname === 'trade.aivo.sh' || hostname === 'trade.localhost') {
    if (!pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone();
      url.pathname = `/dashboard${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Marketing / aivo.sh root → no rewrite, pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static (static files)
     *  - _next/image (image optimization)
     *  - favicon.ico
     *  - Public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
