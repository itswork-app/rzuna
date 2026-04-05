import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { env } from '../../utils/env.js';
import { JupiterService } from '../../infrastructure/jupiter/jupiter.service.js';
import { db, scoutedTokens, eq } from '@rzuna/database';

const TAKE_PROFIT_SOL_THRESHOLD = 0.05; // ~ $10-$15
const STOP_LOSS_SCORE_THRESHOLD = 70; // Score drops below 70

/**
 * 🧹 Treasury Sweeper Worker: AI-Driven Profit Realization
 * Standar: Canonical Master Blueprint v22.1 (Prop Desk Management)
 *
 * Runs periodically to scan the Sol Treasury Wallet. 
 * - Takes Profit (TP) if a held token hits the threshold.
 * - Stops Loss (SL) if the AI conviction drops.
 */
export class TreasuryWorker {
  private connection: Connection;
  private jupiter: JupiterService;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private treasuryWallet: string;
  private usdcWallet: string;
  private lastUsdcSweepDay: number = 0;

  constructor() {
    this.connection = new Connection(env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
    this.jupiter = new JupiterService();
    this.treasuryWallet = env.SOL_TREASURY_WALLET || '';
    this.usdcWallet = env.USDC_TREASURY_WALLET || '';
  }

  public start(intervalMs: number = 15 * 60 * 1000) {
    if (!this.treasuryWallet) {
      console.warn('⚠️ [Sweeper] No SOL_TREASURY_WALLET defined. Treasury Sweeper will not start.');
      return;
    }
    
    console.info(`🧹 [Sweeper] Treasury Worker Started. Scanning every ${intervalMs / 60000} minutes.`);
    
    // Initial run
    setTimeout(() => this.scanAndRealizeProfit().catch(console.error), 5000);
    
    // Interval run
    this.timer = setInterval(() => {
      this.scanAndRealizeProfit().catch(console.error);
    }, intervalMs);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.info('🧹 [Sweeper] Treasury Worker Stopped.');
  }

  private async fetchSolTokenPrice(mint: string): Promise<number> {
    try {
      const res = await fetch(`https://price.jup.ag/v4/price?ids=${mint}&vsToken=SOL`);
      if (!res.ok) return 0;
      const data = await res.json();
      return (data.data[mint]?.price as number) || 0;
    } catch {
      return 0;
    }
  }

  public async scanAndRealizeProfit() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.info('🧹 [Sweeper] Initiating Treasury Realization Scan...');

    try {
      const treasuryPubkey = new PublicKey(this.treasuryWallet);
      const programId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

      // --- 1. DAILY USDC SWEEP (THE ULTIMATE PROFIT LOCK) ---
      await this.executeDailyUsdcSweep(treasuryPubkey);
      
      // --- 2. MEME COIN SWEEPER (TAKE PROFIT & STOP LOSS) ---
      const { value: accounts } = await this.connection.getParsedTokenAccountsByOwner(treasuryPubkey, { programId });

      for (const account of accounts) {
        const info = account.account.data.parsed.info;
        const mint = info.mint;
        const tokenAmountStr = info.tokenAmount.amount;
        const uiAmount = info.tokenAmount.uiAmount || 0;

        if (uiAmount <= 0) continue; // Skip empty bags
        if (mint === 'So11111111111111111111111111111111111111112') continue; // Skip native SOL or Wrapped SOL
        if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') continue; // Skip USDC

        // Calculate SOL Value
        const solPriceRate = await this.fetchSolTokenPrice(mint);
        const estimatedSolValue = uiAmount * solPriceRate;

        // Condition 1: Take Profit (TP)
        let triggerSellReason = '';
        
        if (estimatedSolValue >= TAKE_PROFIT_SOL_THRESHOLD) {
          triggerSellReason = `TAKE_PROFIT (Bag Value: ${estimatedSolValue.toFixed(3)} SOL)`;
        } else {
          // Condition 2: Stop Loss (SL) based on AI conviction
          const [scouted] = await db
            .select({ baseScore: scoutedTokens.baseScore, symbol: scoutedTokens.symbol })
            .from(scoutedTokens)
            .where(eq(scoutedTokens.mintAddress, mint))
            .limit(1);

          const score = scouted?.baseScore || 0;
          if (score < STOP_LOSS_SCORE_THRESHOLD) {
            triggerSellReason = `STOP_LOSS (AI Score Dropped to ${score})`;
          }
        }

        // Execute Force Dump
        if (triggerSellReason) {
          console.info(`🧹 [Sweeper] TRIGGER ENGAGED: ${mint} -> ${triggerSellReason}`);
          const amountLamports = parseInt(tokenAmountStr, 10);
          
          await this.jupiter.autoConvertFeeToSOL(mint, amountLamports, true); // forceSell = true
          
          // Delay to prevent Rate Limit on Jupiter API
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          console.info(`🧹 [Sweeper] HOLDING: ${mint} (Value: ${estimatedSolValue.toFixed(4)} SOL). Condition not met.`);
        }
      }
    } catch (error) {
      console.error('🧹 [Sweeper] Error during treasury scan:', error);
    } finally {
      this.isRunning = false;
      console.info('🧹 [Sweeper] Scan Complete.');
    }
  }

  /**
   * 🏦 Daily Auto-Sweep: Converts SOL to USDC to lock fiat value protecting against SOL dumps.
   */
  private async executeDailyUsdcSweep(treasuryPubkey: PublicKey) {
    if (!this.usdcWallet) return;

    const todayStr = new Date().getDate(); // A simple daily check (resets at midnight UTC)
    if (this.lastUsdcSweepDay === todayStr) return; // Already swept today

    try {
      const balanceLamports = await this.connection.getBalance(treasuryPubkey);
      const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;

      // Rule: Keep 0.5 SOL for operating gas, sweep the rest. Minimum sweep 1.0 SOL.
      if (balanceSOL > 1.5) {
        const sweepAmountSOL = balanceSOL - 0.5;
        const sweepLamports = Math.floor(sweepAmountSOL * LAMPORTS_PER_SOL);
        const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        const SOL_MINT = 'So11111111111111111111111111111111111111112';

        console.info(`🏦 [Treasury:USDC] Initiating DAILY SWEEP of ${sweepAmountSOL.toFixed(2)} SOL to USDC Vault.`);

        const route = await this.jupiter.getBestRoute(
          SOL_MINT,
          USDC_MINT,
          sweepLamports,
          0,
          this.treasuryWallet,
          this.usdcWallet // Transferred directly to USDC Treasury 
        );

        const result = await this.jupiter.executeSwap(route);
        if (result.status === 'success') {
          console.info(`💵 [Treasury:USDC] SUCCESS! Locked SOL profit into USDC. Tx: ${result.signature}`);
          this.lastUsdcSweepDay = todayStr; // Update flag so it doesn't run again today
        }
      }
    } catch (e) {
      console.error('🏦 [Treasury:USDC] Daily Sweep failed:', e);
    }
  }
}
