import { FastifyInstance } from 'fastify';
import { db, usageLogs, treasuryLogs, scoutedTokens, users, eq } from '@rzuna/database';
import { validateApiKey } from '../middleware/auth.js';
import { Redis } from 'ioredis';
import { env } from '../utils/env.js';

const redis = env.REDIS_URL ? new Redis(env.REDIS_URL) : null;

/** Fetch live SOL/USD price from Jupiter Price API v4 for B2B Engine calculations */
async function getLiveSOLPrice(): Promise<number> {
  try {
    const res = await fetch('https://price.jup.ag/v4/price?ids=SOL');
    if (!res.ok) throw new Error('Price fetch failed');
    const json = (await res.json()) as { data: { SOL: { price: number } } };
    return json.data.SOL.price;
  } catch {
    return 150; // Fallback failsafe
  }
}

/**
 * 🏛️ SDK Routes: B2B API Intelligence

 * Standar: Canonical Master Blueprint v22.1 (The Nerve)
 */
export const sdkRoutes = async (fastify: FastifyInstance) => {
  // 🛡️ All routes below are protected by API Key (Strict Auth)
  fastify.addHook('preHandler', validateApiKey);

  // 🚀 Dynamic Rate Limiting (Tier-based)
  fastify.addHook('preHandler', async (request, reply) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, request.apiKey.userId))
      .limit(1);
    const tier = user?.tier || 'BRONZE';

    // Tier-based limits (Simulated in Task 4)
    const limits: Record<string, number> = {
      BRONZE: 10,
      SILVER: 20,
      GOLD: 50,
      PLATINUM: 100,
      DIAMOND: 500,
      MYTHIC: 1000,
    };

    const maxRps = limits[tier] || 10;

    // Actual Redis Counter (Sliding Window per second)
    if (redis) {
      const apiKeyStr = request.headers['x-api-key'] as string;
      const currentSecond = Math.floor(Date.now() / 1000);
      const key = `ratelimit:sdk:${apiKeyStr}:${currentSecond}`;

      const currentHits = await redis.incr(key);
      if (currentHits === 1) {
        await redis.expire(key, 2); // TTL 2 seconds
      }

      if (currentHits > maxRps) {
        return reply
          .status(429)
          .send({ error: 'TOO_MANY_REQUESTS', message: `Tier ${tier} limit is ${maxRps} RPS` });
      }
    }
  });

  /**
   * 🧠 GET /sdk/intelligence/:mint
   */
  fastify.get('/sdk/intelligence/:mint', async (request, reply) => {
    const { mint } = request.params as { mint: string };

    const [token] = await db
      .select()
      .from(scoutedTokens)
      .where(eq(scoutedTokens.mintAddress, mint))
      .limit(1);

    if (!token) {
      return reply.status(404).send({ error: 'TOKEN_NOT_SCOUTED' });
    }

    // 📊 Log Usage (Atomic Tracking)
    await db.insert(usageLogs).values({
      userId: request.apiKey.userId,
      apiKeyId: request.apiKey.id,
      endpoint: 'intelligence',
      creditsUsed: 1,
    });

    return token;
  });

  /**
   * 💹 POST /sdk/trade/swap
   * REVENUE INTEGRITY: Dynamic Fees B2B (0.5% - 1.5%) + Jito Guarantee
   */
  fastify.post('/sdk/trade/swap', async (request, reply) => {
    const params = request.body as {
      type: string;
      mint: string;
      amountUSD: number;
      jitoTipSOL?: number;
      networkFeeSOL?: number;
    };

    const amountUSD = params.amountUSD || 0; // Default zero strictly for typing safety

    // Fetch User Tier for Fee Calculation
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, request.apiKey.userId))
      .limit(1);

    // 1. Platform Fee (AIVO Pure Profit)
    let feeBps = 150; // default 1.5% (Starlight)
    if (user?.tier === 'DIAMOND' || user?.tier === 'MYTHIC')
      feeBps = 50; // 0.5% (VIP)
    else if (user?.tier === 'GOLD' || user?.tier === 'PLATINUM') feeBps = 100; // 1.0%

    const feeRate = feeBps / 10000;
    const tradingFeeUSD = amountUSD * feeRate;

    // 2. Compute Routing & Jito MEV Costs for "Guaranteed Landing"
    const solPrice = await getLiveSOLPrice();
    const jitoTipUSD = (params.jitoTipSOL || 0) * solPrice;
    const networkFeeUSD = (params.networkFeeSOL || 0.000005) * solPrice;

    // 3. Final Bundled Cost sent to B2B Client
    // Sesuai rule: Platform fee murni untuk treasury Sasya, lepas dari MEV deduction
    const totalBundledCostUSD = tradingFeeUSD + jitoTipUSD + networkFeeUSD;

    console.info(
      `🛡️ [SDK] B2B Swap Trade: ${params.type} ${params.mint} | AIVO Profit: $${tradingFeeUSD.toFixed(3)} | Jito: $${jitoTipUSD.toFixed(3)}`,
    );

    // 📊 Log Usage & API Deduction
    await db.insert(usageLogs).values({
      userId: request.apiKey.userId,
      apiKeyId: request.apiKey.id,
      endpoint: 'swap',
      creditsUsed: 10,
    });

    // 💸 Secure Revenue Integrity (AIVO Pure Profit Only)
    if (tradingFeeUSD > 0) {
      await db.insert(treasuryLogs).values({
        amount: tradingFeeUSD.toString(),
        source: `B2B_SWAP:${params.mint}`,
      });
    }

    return {
      status: 'success',
      signature: 'SIMULATED_B2B_TX_HASH',
      tradingFeeUSD,
      jitoTipUSD,
      networkFeeUSD,
      totalBundledCostUSD,
      feeRateStr: `${(feeRate * 100).toFixed(2)}%`,
      tier: user?.tier || 'BRONZE',
    };
  });

  /**
   * 📊 GET /sdk/usage
   */
  fastify.get('/sdk/usage', async (request, reply) => {
    const logs = await db.select().from(usageLogs).where(eq(usageLogs.apiKeyId, request.apiKey.id));
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, request.apiKey.userId))
      .limit(1);

    return {
      apiKey: request.apiKey.name,
      totalCalls: logs.length,
      creditsUsed: logs.reduce((sum, l) => sum + l.creditsUsed, 0),
      tier: user?.tier || 'BRONZE',
    };
  });
};
