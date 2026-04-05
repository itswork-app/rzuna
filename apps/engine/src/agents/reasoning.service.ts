import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../utils/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 🏛️ REASONING TYPES
export type L2Reasoning = ReasoningResult;

export interface ReasoningResult {
  verdict: 'ALPHA' | 'WATCH' | 'REJECT';
  narrative: string;
  catalysts: string[];
  riskFactors: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  generatedByAI: boolean;
  entryStrategy?: string;
  tokensUsed?: number;
}

/**
 * Full context passed from L1 enrichment to L2 AI.
 */
export interface L2Context {
  mint: string;
  symbol: string;
  name: string;
  txType: string;
  traderPublicKey?: string;
  l1Score: number;
  vSol: number;
  mcapSol: number;
  twitter?: string | null;
  website?: string | null;
  telegram?: string | null;
  mintRevoked?: boolean;
  freezeRevoked?: boolean;
  topHolderPct?: number;
  holderCount?: number;
  creatorReputation?: string;
  redFlags: string[];
  tradesPerMinute?: number;
  positivesSignals?: string[];
}

/**
 * 🏛️ ReasoningService V2: Full-Context AI Analysis
 * Passes all L1 enrichment data to the AI worker for deep analysis.
 * Rate-limited to control OpenAI costs.
 */
export class ReasoningService {
  private callCount = 0;
  private callWindowStart = Date.now();
  private static readonly MAX_CALLS_PER_MINUTE = 20;

  async analyzeToken(context: L2Context): Promise<ReasoningResult> {
    // Rate limiting
    const now = Date.now();
    if (now - this.callWindowStart > 60_000) {
      this.callCount = 0;
      this.callWindowStart = now;
    }

    if (this.callCount >= ReasoningService.MAX_CALLS_PER_MINUTE) {
      return {
        verdict: 'WATCH',
        narrative: '[RATE LIMITED] Too many AI calls. Signal passed L1 filter only.',
        catalysts: [],
        riskFactors: context.redFlags,
        confidence: 'LOW',
        generatedByAI: false,
      };
    }

    this.callCount++;

    return new Promise((resolve, reject) => {
      const workerPath = path.resolve(__dirname, 'workers/reasoning.worker.js');
      const worker = new Worker(workerPath, {
        workerData: { context, apiKey: env.OPENAI_API_KEY },
      });

      // Timeout: 10 seconds max
      const timeout = setTimeout(() => {
        void worker.terminate();
        resolve({
          verdict: 'WATCH',
          narrative: '[TIMEOUT] AI analysis took too long. L1 score used.',
          catalysts: [],
          riskFactors: context.redFlags,
          confidence: 'LOW',
          generatedByAI: false,
        });
      }, 10_000);

      worker.on('message', (result) => {
        clearTimeout(timeout);
        if (result.error) reject(new Error(result.error));
        else resolve(result as ReasoningResult);
        void worker.terminate();
      });

      worker.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
        void worker.terminate();
      });

      worker.on('exit', (code) => {
        clearTimeout(timeout);
        if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
      });
    });
  }

  /** Cost monitoring */
  getUsageStats() {
    return {
      callsThisMinute: this.callCount,
      maxPerMinute: ReasoningService.MAX_CALLS_PER_MINUTE,
    };
  }
}
