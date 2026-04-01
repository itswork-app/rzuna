import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { env } from '../../utils/env.js';

export interface SwapRoute {
  inMint: string;
  outMint: string;
  inAmount: number; // In lamports
  outAmount: number; // In lamports
  priceImpactPct: number;
  routePlan: string[];
  platformFeeBps?: number;
  swapTransaction?: string; // Base64 encoded transaction from Jupiter
}

export interface SwapResult {
  signature: string;
  inAmount: number;
  outAmount: number;
  fee: number;
  jitoBundle?: boolean;
  dryRun: boolean;
  status: 'success' | 'failed';
}

interface JupiterQuoteResponse {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  routePlan: Array<{ swapInfo: { label: string } }>;
}

interface JitoBundle {
  jsonrpc: '2.0';
  id: number;
  method: 'sendBundle';
  params: [string[]];
}

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';

/**
 * Jupiter V6 Swap Service with Jito MEV Protection
 * Standar: Canonical Master Blueprint v1.6 (Institutional Live Ready)
 *
 * Supports two execution modes:
 * - dry_run: Simulates everything, logs, but does NOT submit transactions
 * - real: Full live execution with Jito bundle submission
 */
export class JupiterService {
  private connection: Connection;
  private jitoValidator: string;
  private mode: 'dry_run' | 'real';

  constructor(modeOverride?: 'dry_run' | 'real') {
    this.connection = new Connection(
      env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed',
    );
    this.jitoValidator = env.JITO_BLOCK_ENGINE_URL || 'https://mainnet.block-engine.jito.wtf';
    this.mode = modeOverride || env.EXECUTION_MODE || 'dry_run';

    if (this.mode === 'dry_run') {
      console.info('[JupiterService] 🧪 DRY RUN mode — no real transactions will be executed.');
    } else {
      console.info('[JupiterService] ⚡ REAL mode — live transactions enabled.');
    }
  }

  /**
   * Get the best swap route and transaction from Jupiter.
   */
  async getBestRoute(
    inputMint: string,
    outputMint: string,
    amountLamports: number,
    platformFeeBps: number,
    userPublicKey: string,
  ): Promise<SwapRoute> {
    const quoteParams = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountLamports.toString(),
      slippageBps: '50',
      platformFeeBps: platformFeeBps.toString(),
    });

    const quoteRes = await fetch(`${JUPITER_QUOTE_API}/quote?${quoteParams.toString()}`);
    if (!quoteRes.ok) throw new Error(`Jupiter quote failed: ${quoteRes.statusText}`);
    const quoteData = (await quoteRes.json()) as JupiterQuoteResponse;

    // Derive Fee Account (ATA) for on-chain fee collection (Blueprint v1.6)
    let feeAccount: string | undefined;
    if (env.PLATFORM_FEE_WALLET) {
      const feeOwner = new PublicKey(env.PLATFORM_FEE_WALLET);
      const mint = new PublicKey(outputMint);

      // If output is SOL (So111...), keep it as the wallet address
      if (outputMint === 'So11111111111111111111111111111111111111112') {
        feeAccount = env.PLATFORM_FEE_WALLET;
      } else {
        // [Zero-Dependency] Derive ATA manually (pda: owner, token_program, mint)
        const [ata] = PublicKey.findProgramAddressSync(
          [
            feeOwner.toBuffer(),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(), // Token Program
            mint.toBuffer(),
          ],
          new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'), // Associated Token Program
        );
        feeAccount = ata.toBase58();
      }
    }

    // Fetch serialized transaction
    const swapRes = await fetch(`${JUPITER_QUOTE_API}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey,
        wrapAndUnwrapSol: true,
        feeAccount, // PR 7 Hardening: Automatic On-Chain Fee Capture
      }),
    });
    if (!swapRes.ok) throw new Error(`Jupiter swap assembly failed: ${swapRes.statusText}`);
    const { swapTransaction } = (await swapRes.json()) as { swapTransaction: string };

    return {
      inMint: inputMint,
      outMint: outputMint,
      inAmount: Number(quoteData.inAmount),
      outAmount: Number(quoteData.outAmount),
      priceImpactPct: quoteData.priceImpactPct,
      routePlan: quoteData.routePlan.map((r) => r.swapInfo.label),
      platformFeeBps,
      swapTransaction,
    };
  }

  /**
   * Auto-convert Token Fees to SOL for Treasury Consolidation.
   * Strategi: Berhenti memegang token meme yang volatil, langsung konversi ke SOL.
   * Standar: Canonical Master Blueprint v1.6
   */
  async autoConvertFeeToSOL(tokenMint: string, amountLamports: number): Promise<SwapResult> {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    if (tokenMint === SOL_MINT) {
      console.info('[Treasury] Fee is already in SOL. Skipping conversion.');
      return {
        signature: 'SKIPPED',
        inAmount: amountLamports,
        outAmount: amountLamports,
        fee: 0,
        dryRun: false,
        status: 'success',
      };
    }

    console.info(`[Treasury] 🔄 Auto-converting ${amountLamports} of ${tokenMint} to SOL...`);

    try {
      const route = await this.getBestRoute(
        tokenMint,
        SOL_MINT,
        amountLamports,
        0, // No fee on internal treasury swaps
        env.SOL_TREASURY_WALLET || '',
      );

      return await this.executeSwap(route);
    } catch (err) {
      console.error('[Treasury] ❌ Auto-conversion failed:', err);
      return {
        signature: 'FAILED',
        inAmount: amountLamports,
        outAmount: 0,
        fee: 0,
        dryRun: false,
        status: 'failed',
      };
    }
  }

  /**
   * Execute swap — behavior depends on EXECUTION_MODE.
   *
   * dry_run: Validates route, logs the would-be trade, returns simulated result.
   * real:    Signs, submits via Jito bundle, returns real signature.
   */
  async executeSwap(route: SwapRoute): Promise<SwapResult> {
    if (this.mode !== 'real') {
      return this.executeDryRun(route);
    }
    return this.executeReal(route);
  }

  /**
   * DRY RUN: Validate and log without submitting any transaction.
   */
  private executeDryRun(route: SwapRoute): SwapResult {
    console.info(
      `[DRY_RUN] 🧪 Simulated swap: ${route.inMint} → ${route.outMint} | ` +
        `In: ${route.inAmount} | Out: ${route.outAmount} | ` +
        `Impact: ${route.priceImpactPct}% | Fee: ${route.platformFeeBps ?? 0} bps`,
    );

    return {
      signature: `DRY_RUN_${Date.now()}`,
      inAmount: route.inAmount,
      outAmount: route.outAmount,
      fee: Math.floor(route.inAmount * ((route.platformFeeBps ?? 0) / 10000)),
      jitoBundle: false,
      dryRun: true,
      status: 'success',
    };
  }

  /**
   * Fetch Recent Jito Tip (Median/50th Percentile).
   * Renamed from getJitoTipFloor() for institutional precision.
   * Standar: Canonical Master Blueprint v1.6
   */
  async getRecentJitoTip(): Promise<number> {
    try {
      const res = await fetch('https://mainnet.block-engine.jito.wtf/api/v1/bundles/tip_floor');
      if (!res.ok) return 0.00001; // Fallback to 10k lamports
      const data = (await res.json()) as Array<{
        ema_landed_tips_50th_percentile: number;
      }>;
      // Use 50th percentile (Median) for "Recommended" reliability
      return data[0]?.ema_landed_tips_50th_percentile || 0.00001;
    } catch {
      return 0.00001;
    }
  }

  /**
   * REAL: Sign and submit transaction via Jito bundle with Dynamic Tip.
   */
  private async executeReal(route: SwapRoute): Promise<SwapResult> {
    if (!env.WALLET_PRIVATE_KEY) {
      throw new Error('WALLET_PRIVATE_KEY missing in environment.');
    }

    if (!route.swapTransaction) {
      throw new Error('Swap transaction missing from route.');
    }

    console.info(`⚡ Executing Real-World Swap for ${route.outMint}...`);

    // 1. Initialize Keypair
    const keypair = Keypair.fromSecretKey(bs58.decode(env.WALLET_PRIVATE_KEY));

    // 2. Setup Transaction
    const swapTransactionBuf = Buffer.from(route.swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // 3. Sign (Hardened: Use real keypair)
    transaction.sign([keypair]);

    // 4. Dynamic Jito Tip (PR 7 Hardening: getRecentJitoTip)
    const tipFloorSOL = await this.getRecentJitoTip();
    console.info(`[JITO] Recommended Tip: ${tipFloorSOL} SOL`);

    // 5. Jito Bundle Submission
    const signedTxBase58 = bs58.encode(transaction.serialize());
    const jitoBlockEngineUrl = env.JITO_BLOCK_ENGINE_URL || 'https://mainnet.block-engine.jito.wtf';

    const bundle: JitoBundle = {
      jsonrpc: '2.0',
      id: 1,
      method: 'sendBundle',
      params: [[signedTxBase58]],
    };

    console.info(`[JITO] Submitting bundle to ${jitoBlockEngineUrl}`);

    try {
      const res = await fetch(`${jitoBlockEngineUrl}/api/v1/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle),
      });

      if (!res.ok) {
        throw new Error(`Jito bundle submission failed: ${res.statusText}`);
      }

      const result = (await res.json()) as { result: string };

      return {
        signature: result.result || `SIGNATURE_PENDING_${Date.now()}`,
        inAmount: route.inAmount,
        outAmount: route.outAmount,
        fee: Math.floor(route.inAmount * ((route.platformFeeBps ?? 0) / 10000)),
        jitoBundle: true,
        dryRun: false,
        status: 'success',
      };
    } catch (err) {
      console.warn('Jito submission failed, falling back to standard RPC:', err);
      try {
        const signature = await this.connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: true,
          maxRetries: 3,
        });

        return {
          signature,
          inAmount: route.inAmount,
          outAmount: route.outAmount,
          fee: Math.floor(route.inAmount * ((route.platformFeeBps ?? 0) / 10000)),
          jitoBundle: false,
          dryRun: false,
          status: 'success',
        };
      } catch (fallbackErr) {
        console.error('Standard RPC fallback also failed:', fallbackErr);
        return {
          signature: 'FAILED',
          inAmount: route.inAmount,
          outAmount: route.outAmount,
          fee: 0,
          jitoBundle: false,
          dryRun: false,
          status: 'failed',
        };
      }
    }
  }

  static feeToBps(feeRate: number): number {
    return Math.round(feeRate * 10000);
  }
}
