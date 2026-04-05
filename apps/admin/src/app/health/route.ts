import { NextResponse } from 'next/server';

/**
 * 🏛️ Health Check: Institutional Observability (V1.9.1)
 */
export async function GET() {
<<<<<<< HEAD
  return NextResponse.json(
    {
      status: 'operational',
      service: '@rzuna/admin',
      version: '1.9.1-hardened',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    {
      status: 200,
    },
  );
=======
  return NextResponse.json({
    status: 'operational',
    service: '@rzuna/admin',
    version: '1.9.1-hardened',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }, {
    status: 200,
  });
>>>>>>> origin/main
}
