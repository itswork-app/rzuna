import { buildApp } from './app.js';

export const start = async () => {
  try {
    const app = await buildApp();
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });

    console.warn(`Server listening on http://localhost:${port}`);
    return app;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  void start();
}
