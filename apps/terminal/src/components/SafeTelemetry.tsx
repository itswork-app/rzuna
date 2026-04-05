'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const TelemetryProvider = dynamic(
  () => import('./TelemetryProvider').then((mod) => mod.TelemetryProvider),
  { ssr: false },
);

export function SafeTelemetry({ children }: { children: React.ReactNode }) {
  const Provider: any = TelemetryProvider;
  return <Provider>{children}</Provider>;
}
