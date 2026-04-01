import { type FastifyPluginAsync } from 'fastify';
import { TierService } from '../core/tiers/tier.service.js';
import { supabase } from '../infrastructure/supabase/client.js';

interface TradeBody {
  walletAddress: string;
  amountUSD: number;
  platform: 'PUMP_FUN' | 'RAYDIUM' | 'METEORA' | 'ORCA';
  signature: string;
  jitoTipSOL?: number; // External Jito tip (in SOL)
  networkFeeSOL?: number; // Solana network fee (in SOL)
  status?: 'success' | 'failed';
}

/** Fetch live SOL/USD price from Jupiter Price API v4 */
async function getLiveSOLPrice(): Promise<number> {
  try {
    const res = await fetch('https://price.jup.ag/v4/price?ids=SOL');
    if (!res.ok) throw new Error('Price fetch failed');
    const json = (await res.json()) as { data: { SOL: { price: number } } };
    return json.data.SOL.price;
  } catch {
    // Fallback to approximate value if feed is unavailable
    return 150;
  }
}

/**
 * FeePlugin: Dynamic Trading Fee Engine
 * Standar: Canonical Master Blueprint v1.3 (PR 4 — Rank & Economy)
 *
 * Fee Structure:
 *   VIP:          0.75%  (Dedicated Infrastructure)
 *   STARLIGHT+:   1.0%
 *   STARLIGHT:    1.25%
 *   NONE+ELITE:   1.5%
 *   NONE+PRO:     1.75%
 *   NONE+NEWBIE:  2.0%
 */
export const feePlugin: FastifyPluginAsync = (fastify) => {
  const tierService = new TierService();

  fastify.post<{ Body: TradeBody }>('/trade', async (request, reply) => {
    const {
      walletAddress,
      amountUSD,
      platform,
      signature,
      jitoTipSOL = 0,
      networkFeeSOL = 0.000005,
      status = 'success',
    } = request.body;

    try {
      // 1. Fetch profile to determine dynamic fee
      const profile = await tierService.getUserProfile(walletAddress);

      // 2. PostHog Gatekeeping — check jupiter_swap_enabled flag
      if (fastify.posthog) {
        const flags = await fastify.posthog.getAllFlags(walletAddress);
        if (flags['jupiter_swap_enabled'] === false) {
          return await reply.status(403).send({
            error: 'Jupiter swap is not enabled for your account tier.',
          });
        }
      }

      // 3. Dynamic Fee Calculation (Platform Revenue)
      const feeRate = tierService.getTradingFeePercentage(profile);
      const tradingFeeUSD = amountUSD * feeRate;

      // 4. Live SOL price for accurate Jito + Network fee bundling
      const solPrice = await getLiveSOLPrice();

      // 5. External Cost Bundling (Jito + Network)
      const jitoTipUSD = jitoTipSOL * solPrice;
      const networkFeeUSD = networkFeeSOL * solPrice;
      const totalBundledCostUSD = tradingFeeUSD + jitoTipUSD + networkFeeUSD;

      // 6. Update trading volume, rank, AND total_fees_paid (revenue accumulation)
      // Only add volume if trade was successful
      let newRank = profile.rank;
      if (status === 'success') {
        newRank = await tierService.addVolume(walletAddress, amountUSD, tradingFeeUSD);
      }

      // 7. Fetch updated profile (for ID)
      const updatedProfile = await tierService.getUserProfile(walletAddress);

      // 8. Audit Trail: Insert to transactions table
      if (updatedProfile.id) {
        void (async () => {
          const { error: insertError } = await supabase.from('transactions').insert({
            profile_id: updatedProfile.id,
            tx_hash: signature,
            amount_usd: amountUSD,
            fee_collected: status === 'success' ? tradingFeeUSD : 0, // Platform revenue only
            platform,
            status, // success | failed
          } as unknown as never);
          if (insertError) fastify.log.error(insertError, 'Failed to log transaction audit trail');
        })();
      }

      // 9. Axiom Revenue Audit Log
      if (fastify.logAlpha) {
        void fastify.logAlpha({
          type: 'TRADE_FEE_COLLECTED',
          wallet: walletAddress,
          platform,
          amountUSD,
          feeRate: `${(feeRate * 100).toFixed(2)}%`,
          tradingFeeUSD,
          jitoTipUSD,
          networkFeeUSD,
          totalBundledCostUSD,
          rank: updatedProfile.rank,
          status: updatedProfile.status,
          newRank,
          signature,
        });
      }

      fastify.log.info(
        `[FEE] ${walletAddress} | ${(feeRate * 100).toFixed(2)}% of $${amountUSD} = $${tradingFeeUSD.toFixed(4)} | Rank: ${newRank}`,
      );

      return await reply.send({
        status: 'success',
        tradingFeeUSD,
        feeRate: `${(feeRate * 100).toFixed(2)}%`,
        jitoTipUSD,
        networkFeeUSD,
        totalBundledCostUSD,
        currentRank: newRank,
        signature,
      });
    } catch (error) {
      fastify.log.error(error);
      return await reply.status(500).send({ error: 'Failed to record trade volume' });
    }
  });

  fastify.get('/user/:wallet/tier', async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    const profile = await tierService.getUserProfile(wallet);
    const feeRate = tierService.getTradingFeePercentage(profile);
    return await reply.send({
      ...profile,
      feeRate: `${(feeRate * 100).toFixed(2)}%`,
    });
  });

  return Promise.resolve();
};
