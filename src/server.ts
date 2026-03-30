import { buildApp } from './app.js';
import { env } from './utils/env.js';

/**
 * Institutional Grade Server Entrypoint
 */
export const start = async () => {
  try {
    const app = await buildApp();
    const port = Number(env.PORT) || 3000;

    await app.listen({
      port,
      host: '0.0.0.0',
    });

    console.info(`🚀  RZUNA FOUNDATION [PR 1] STARTED ON PORT ${port}`);
    console.info(`🌍  ENVIRONMENT: ${env.NODE_ENV}`);
    console.info('🛡️  GUARDIAN CI: CONSTITUTIONAL AUDIT READY');
  } catch (err) {
    console.error('❌  FATAL STARTUP ERROR:', err);
    process.exit(1);
  }
};

if (env.NODE_ENV !== 'test') {
  void start();
}
