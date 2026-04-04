import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge API Route: /api/consume-quota
 * Proxies quota consumption to the Fastify backend.
 * Standar: Canonical Master Blueprint v1.5
 */
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { wallet } = (await req.json()) as { wallet?: string };

    if (!wallet) {
      return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'API URL not configured' }, { status: 500 });
    }

    const upstream = await fetch(`${backendUrl}/consume-quota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet }),
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      return NextResponse.json({ error: body }, { status: upstream.status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
