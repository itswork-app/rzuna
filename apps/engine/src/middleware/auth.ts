import { FastifyRequest, FastifyReply } from 'fastify';
import { db, apiKeys, eq } from '@rzuna/database';
import crypto from 'crypto';

/**
 * 🛡️ B2B Auth Middleware: Strict API Key Validation
 * Standar: Canonical Master Blueprint v22.1 (The Nerve)
 */
export const validateApiKey = async (request: FastifyRequest, reply: FastifyReply) => {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({ error: 'MANDATORY_API_KEY_REQUIRED' });
  }

  // Hash key for lookup (Security first)
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1);

  if (!keyRecord || !keyRecord.isActive) {
    return reply.status(403).send({ error: 'INVALID_OR_REVOKED_API_KEY' });
  }

  // Attach key info to request
  request.apiKey = keyRecord;

  // Track usage async (Atomic update in Phase 3.4)
  void db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyRecord.id));
};

// 🏛️ Extend FastifyRequest to include apiKey
declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: any; // typed as any for simplicity in this orchestration phase
  }
}
