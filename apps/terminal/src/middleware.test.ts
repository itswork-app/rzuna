import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';

// Mock Next.js server classes for Vitest compatibility
vi.mock('next/server', () => {
  const mockRedirect = vi.fn((url: string | URL) => {
    const finalUrl = url instanceof URL ? url : new URL(url);
    const headers = new Headers();
    headers.set('location', finalUrl.toString());
    return {
      url: finalUrl.toString(),
      hostname: finalUrl.hostname,
      pathname: finalUrl.pathname,
      searchParams: finalUrl.searchParams,
      headers,
    };
  });

  const mockNext = vi.fn(() => ({ headers: new Headers() }));

  return {
    NextRequest: class MockNextRequest {
      public nextUrl: URL & { clone: () => URL };
      public headers: { get: (name: string) => string | null };
      public cookies: {
        get: (name: string) => { value: string } | undefined;
        set: (name: string, value: string) => void;
      };
      private _cookies = new Map<string, string>();

      constructor(public url: string) {
        const parsed = new URL(url);
        this.nextUrl = Object.assign(parsed, {
          clone: () => new URL(url),
        }) as unknown as URL & { clone: () => URL };

        this.headers = {
          get: (name: string) =>
            name.toLowerCase() === 'host' ? parsed.host || 'trade.aivo.sh' : null,
        };

        this.cookies = {
          get: (name: string) => {
            const val = this._cookies.get(name);
            return val ? { value: val } : undefined;
          },
          set: (name: string, value: string) => {
            this._cookies.set(name, value);
          },
        };
      }
    },
    NextResponse: {
      next: mockNext,
      redirect: mockRedirect,
    },
  };
});

describe('rzuna Middleware (Institutional)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects root to /dashboard on trade subdomain', async () => {
    const request = new NextRequest('https://trade.aivo.sh/');
    const response = await middleware(request);
    expect(response.headers.get('location')).toContain('/dashboard');
  });

  it('ejects non-VIP users from vip subdomain', async () => {
    const request = new NextRequest('https://vip.aivo.sh/dashboard');
    request.cookies.set('x-rzuna-authenticated', 'true');

    const response = await middleware(request);
    const location = response.headers.get('location') || '';
    expect(location).toContain('/dashboard');
    expect(location).toContain('error=vip_tier_required');
  });

  it('allows VIP users on vip subdomain', async () => {
    const request = new NextRequest('https://vip.aivo.sh/dashboard');
    request.cookies.set('x-rzuna-subscription', 'VIP');
    request.cookies.set('x-rzuna-authenticated', 'true');

    await middleware(request);
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('handles local dev subdomains (localhost)', async () => {
    const request = new NextRequest('http://vip.localhost:3000/dashboard');
    const response = await middleware(request);
    const location = response.headers.get('location') || '';
    expect(location).toContain('/dashboard');
  });
});
