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
}

// Approximate SOL/USD for fee bundling (ideally fetched from price feed)
const SOL_USD_APPROX = 150;

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

      // 4. External Cost Bundling (Jito + Network)
      const jitoTipUSD = jitoTipSOL * SOL_USD_APPROX;
      const networkFeeUSD = networkFeeSOL * SOL_USD_APPROX;
      const totalBundledCostUSD = tradingFeeUSD + jitoTipUSD + networkFeeUSD;

      // 5. Update trading volume and rank
      const newRank = await tierService.addVolume(walletAddress, amountUSD);

      // 6. Fetch updated profile (for ID)
      const updatedProfile = await tierService.getUserProfile(walletAddress);

      // 7. Audit Trail: Insert to transactions table
      if (updatedProfile.id) {
        void (async () => {
          const { error: insertError } = await supabase.from('transactions').insert({
            profile_id: updatedProfile.id,
            tx_hash: signature,
            amount_usd: amountUSD,
            fee_collected: tradingFeeUSD, // Platform revenue only
            platform,
            status: 'success',
          } as unknown as never);
          if (insertError) fastify.log.error(insertError, 'Failed to log transaction audit trail');
        })();
      }

      // 8. Axiom Revenue Audit Log
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
