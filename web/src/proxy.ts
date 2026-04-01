import { type NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware — aivo.sh Network Subdomain Router
 * Blueprint v1.6: Routes each subdomain and enforces subscription guards.
 *
 *  vip.aivo.sh   → /vip    (Subscription Guard: VIP Only)
 *  trade.aivo.sh → /dashboard
 *  aivo.sh       → /       (Default Entry)
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Strip port for local dev: trade.localhost:3000 → trade.localhost
  const hostname = host.split(':')[0];

  // VIP Dedicated Lounge — Subscription Guarded
  if (hostname === 'vip.aivo.sh' || hostname === 'vip.localhost') {
    // 1. Check for Supabase Auth Cookie (Simplified Edge Extraction)
    const token = request.cookies.get('sb-access-token')?.value;
    let isVip = false;

    if (token && supabaseUrl && supabaseAnonKey) {
      try {
        // Edge-compatible fetch to verify subscription status
        const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=subscription_status`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        isVip = data?.[0]?.subscription_status === 'VIP';
      } catch (err) {
        console.error('[Middleware] Subscription check failed:', err);
      }
    }

    // 2. Enforce Access Control
    if (!isVip) {
      // Downgrade non-VIPs to standard trade dashboard
      const url = request.nextUrl.clone();
      url.hostname = hostname === 'vip.localhost' ? 'trade.localhost' : 'trade.aivo.sh';
      return NextResponse.redirect(url);
    }

    // 3. Authorized Routing
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
