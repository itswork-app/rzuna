import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../utils/env.js';
import type { MintEvent } from '../infrastructure/adapters/solana.adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 🏛️ REASONING TYPES
export type L2Reasoning = ReasoningResult;

export interface ReasoningResult {
  narrative: string;
  catalysts: string[];
  riskFactors: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  generatedByAI: boolean;
}

/**
 * 🏛️ ReasoningService: ElizaOS Brain Implementation
 * Managed as a thread-safe worker pool for high performance.
 */
export class ReasoningService {
  async analyzeToken(event: MintEvent, score: number): Promise<ReasoningResult> {
    return new Promise((resolve, reject) => {
      const workerPath = path.resolve(__dirname, 'workers/reasoning.worker.js');
      const worker = new Worker(workerPath, {
        workerData: { event, score, apiKey: env.OPENAI_API_KEY },
      });

      worker.on('message', (result) => {
        if (result.error) reject(new Error(result.error));
        else resolve(result as ReasoningResult);
        void worker.terminate();
      });

      worker.on('error', (err) => {
        reject(err);
        void worker.terminate();
      });

      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
      });
    });
  }
}
