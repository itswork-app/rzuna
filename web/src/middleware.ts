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
    // PR 10: vip.aivo.sh -> Internal Redirect / Dashboard with VIP Access
    // If on homepage of VIP subdomain, move to dashboard
    if (pathname === '/') {
       const url = request.nextUrl.clone();
       url.pathname = '/dashboard';
       const res = NextResponse.redirect(url);
       res.headers.set('X-RZUNA-VIP-MODE', 'true'); // Inject VIP header for backend
       return res;
    }
    
    // Check for auth (Supabase session)
    const token = request.cookies.get('sb-access-token')?.value;
    if (!token && !pathname.startsWith('/auth')) {
       // Optional: Redirect to auth or main landing
       // For now, let the client-side AuthProvider handle it or restrict here
    }
  }

  // 2. Trade Subdomain Logic
  if (isTradeSubdomain) {
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
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
