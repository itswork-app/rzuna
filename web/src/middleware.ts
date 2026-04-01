import { proxy } from './proxy';

export default proxy;

/**
 * Next.js Edge Middleware Config
 * Standar: Institutional Network Infrastructure (aivo.sh)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static (static files)
     *  - _next/image (image optimization)
     *  - favicon.ico
     *  - Public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
};
