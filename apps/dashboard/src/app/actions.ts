'use server';

import { db, users, apiKeys, usageLogs, scoutedTokens, trades, eq } from '@rzuna/database';
import crypto from 'node:crypto';

// ----------------------------------------------------------------------
// 🏛️ B2B Dashboard Server Actions (Institutional Logic)
// ----------------------------------------------------------------------
// ... (rest omitted to just say I am replacing the block)

// ----------------------------------------------------------------------
// 🏛️ B2B Dashboard Server Actions (Institutional Logic)
// ----------------------------------------------------------------------

export async function syncUserAction(walletAddress: string) {
  try {
    // Check if user exists
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    // If not exists, create BRONZE tier user
    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          walletAddress,
          tier: 'BRONZE',
        })
        .returning();
      user = newUser;
    }

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Failed to sync user:', error);
    return { success: false, error: 'Failed to sync user' };
  }
}

export async function generateApiKeyAction(userId: string, name: string) {
  try {
    // Enforce 2 keys limit for standard users (BRONZE/SILVER) to prevent spam
    // Not fully strictly enforced here yet, but we add a simple guard.
    const existingKeys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));

    // As per user requirement, Helius-style limits (2 keys for free tier)
    if (existingKeys.length >= 2) {
      return {
        success: false,
        error: 'Free tier limit reached (Max 2 API Keys). Please upgrade your plan.',
      };
    }

    // 1. Generate Secure Random Raw Key
    const rawSecretBytes = crypto.randomBytes(32).toString('hex');
    const rawKey = `aivo_${rawSecretBytes}`; // e.g. aivo_8f7b...

    // 2. Hash it to secure the database
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // 3. Store Only the Hash
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        userId,
        name: name || 'Default Key',
        keyHash,
        isActive: true,
      })
      .returning();

    return {
      success: true,
      // 🔥 RAW KEY is returned specifically ONE TIME. It is LOST forever after this payload!
      rawKey,
      key: {
        id: newKey.id,
        name: newKey.name,
        status: 'Active',
      },
    };
  } catch (error) {
    console.error('Failed to generate API Key:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}

export async function fetchDashboardStateAction(userId: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error('User not found');

    const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
    const logs = await db.select().from(usageLogs).where(eq(usageLogs.userId, userId));

    const totalCredits = logs.reduce((sum, log) => sum + log.creditsUsed, 0);

    return {
      success: true,
      state: {
        apiKeys: keys.map((k) => ({
          name: k.name,
          key: `aivo_...${k.id.toString().split('-')[0]}`, // Obfuscated hint
          status: k.isActive ? 'Active' : 'Revoked',
        })),
        usageStats: {
          apiCalls: logs.length.toLocaleString(),
          credits: totalCredits.toLocaleString(),
          volume: `$${Number(user.currentMonthVolume).toLocaleString()}`,
        },
      },
    };
  } catch (error) {
    console.error('Failed to fetch dashboard state:', error);
    return { success: false, error: 'Failed to fetch' };
  }
}

export async function fetchScoutedTokensAction(walletAddress?: string) {
  try {
    let isAiUnlocked = false;

    if (walletAddress) {
      const [userDb] = await db
        .select()
        .from(users)
        .where(eq(users.walletAddress, walletAddress))
        .limit(1);
      // Gold and above unlocks AI Reasoning automatically
      if (userDb && !['BRONZE', 'SILVER'].includes(userDb.tier)) {
        isAiUnlocked = true;
      }
    }

    const rawTokens = await db.select().from(scoutedTokens).limit(50);

    const sortedTokens = rawTokens
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      success: true,
      isAiUnlocked,
      tokens: sortedTokens.map((t) => ({
        mintAddress: t.mintAddress,
        symbol: t.symbol,
        name: t.name,
        baseScore: t.baseScore,
        aiReasoning: t.aiReasoning,
        createdAt: t.createdAt,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch scouted tokens:', error);
    return { success: false, tokens: [], isAiUnlocked: false };
  }
}

export async function fetchActiveTradesAction(walletAddress: string) {
  try {
    const [userDb] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);
    if (!userDb) return { success: false, positions: [] };

    const openTrades = await db.select().from(trades).where(eq(trades.userId, userDb.id)).limit(10);

    return {
      success: true,
      positions: openTrades.map((t) => ({
        id: t.id,
        mint: t.mint,
        amount: t.amount,
        pnl: t.pnl || '+0.00',
      })),
    };
  } catch (error) {
    console.error('Failed to fetch active trades:', error);
    return { success: false, positions: [] };
  }
}
