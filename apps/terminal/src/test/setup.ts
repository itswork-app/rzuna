/**
 * rzuna Institutional Test Setup
 * Blueprints v1.6: React 19 & Next.js 15 Compatibility
 * Using Vitest Native Web Standard APIs (Vitest 4.1+)
 */

import '@testing-library/jest-dom/vitest';

if (typeof process !== 'undefined') {
  (process.env as any).NODE_ENV = 'test';
}

(global as any).IS_REACT_ACT_ENVIRONMENT = true;
