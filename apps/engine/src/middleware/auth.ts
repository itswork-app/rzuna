import { FastifyRequest, FastifyReply } from 'fastify';
import { db, apiKeys, eq, usageLogs, treasuryLogs, users } from '@rzuna/database';
import crypto from 'crypto';
import { TierService } from '../core/tiers/tier.service.js';

const tierService = new TierService();

/**
 * 🛡️ B2B Auth Middleware: Strict API Key Validation & Usage Tracking
 * Standar: Canonical Master Blueprint v22.1 (The Nerve)
 */
export const validateApiKey = async (request: FastifyRequest, reply: FastifyReply) => {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({ error: 'MANDATORY_API_KEY_REQUIRED' });
  }

  // Hash key for lookup (Security first)
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Load key and user in a single join ideally, but simple lookup for now
  const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1);

  if (!keyRecord || !keyRecord.isActive) {
    return reply.status(403).send({ error: 'INVALID_OR_REVOKED_API_KEY' });
  }

  // Law 2: Usage Tracking (Atomic)
  const endpoint = request.url;
  const creditsUsed = 1; // Default institutional credit cost
  const userId = keyRecord.userId;

  await db.transaction(async (tx) => {
    // Audit Trail Update
    await tx.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyRecord.id));

    // Law 2: Log Usage
    await tx.insert(usageLogs).values({
      userId,
      apiKeyId: keyRecord.id,
      endpoint,
      creditsUsed,
    });

    // Law 3: Revenue Integrity (Example)
    const [userRecord] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    const tier = (userRecord?.tier as any) || 'NONE';
    const fee = tierService.calculateFee(tier, 0.01); // Simulated micro-fee for API activity

    if (fee > 0) {
      await tx.insert(treasuryLogs).values({
        amount: fee.toString(),
        source: `API_FEE:${endpoint}`,
      });
    }
  });

  // Attach key info to request
  request.apiKey = keyRecord;
};

// 🏛️ Extend FastifyRequest to include apiKey
declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: any; // typed as any for simplicity in this orchestration phase
  }
}
