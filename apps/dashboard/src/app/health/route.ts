import { NextResponse } from 'next/server';

/**
 * 🏛️ Institutional Health Check: V22.1
 * Provides 200 OK for k6 smoke tests & Guardian audits.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '22.1.0',
    timestamp: new Date().toISOString(),
    service: '@rzuna/dashboard',
  });
}
