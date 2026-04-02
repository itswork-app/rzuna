'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const TelemetryProvider = dynamic(
  () => import('./TelemetryProvider').then((mod) => mod.TelemetryProvider),
  { ssr: false }
);

export function SafeTelemetry({ children }: { children: React.ReactNode }) {
  return <TelemetryProvider>{children}</TelemetryProvider>;
}
