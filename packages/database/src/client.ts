import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/rzuna';

/**
 * ⚡ RZUNA Institutional Database Client (Postgres-JS)
 * Optimized for CCX23 server performance with connection pooling.
 */
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// Export the underlying client for raw queries if needed
export { client };
