import { NextResponse } from 'next/server';

/**
 * 🏥 Admin Health Check (V22.1)
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'operational',
      service: '@rzuna/admin',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
    },
  );
}
