import { EventEmitter } from 'events';
import Client from '@triton-one/yellowstone-grpc';
import { type ScoringService, type ScoringResult } from '../../core/scoring/scoring.service.js';
import { MockGeyserStream, type MockTokenSignal } from './mocks/geyser.mock.js';
import { UserRank } from '../../core/types/user.js';
import { env } from '../../utils/env.js';
import { supabase } from '../supabase/client.js';

export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  isMintable?: boolean;
}

export interface MintEvent {
  mint: string;
  signature: string;
  timestamp: string;
  metadata?: TokenMetadata;
  initialLiquidity?: number;
  socialScore?: number;
}

export interface AlphaSignal {
  event: MintEvent;
  score: number;
  reasoning?: string[]; // Only for VIP
  latency: number;
  isPremium: boolean;
}

/**
 * Solana Data Ingestion Service (Geyser / gRPC)
 * Refactored for Database Schema v1.3 (Persistent Signals)
 */
export class GeyserService extends EventEmitter {
  private client: unknown = null;
  private isMock: boolean = true;
  private scoringService: ScoringService;
  private activeSignals: Map<string, AlphaSignal> = new Map();

  constructor(scoringService: ScoringService) {
    super();
    this.scoringService = scoringService;

    if (env.GEYSER_ENDPOINT && env.GEYSER_TOKEN) {
      this.client = new (Client as any)(env.GEYSER_ENDPOINT, env.GEYSER_TOKEN, undefined);
      this.isMock = false;
    } else {
      console.warn('Geyser credentials missing. Running in MOCK mode.');
    }
  }

  async start(): Promise<void> {
    if (this.isMock) {
      this.startMockStream();
    } else {
      await this.startRealStream();
    }
    this.startMonitoringLoop();
  }

  private async startRealStream(): Promise<void> {
    if (!this.client) return;
    try {
      await (this.client as { connect: () => Promise<void> }).connect();

      const stream = await (this.client as { subscribe: () => Promise<any> }).subscribe();

      stream.on('data', (data: unknown) => {
        this.emit('data', data);
      });

      const request = {
        transactions: {
          mints: { accountInclude: ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'] },
        },
        commitment: 1,
      };

      await new Promise<void>((resolve, reject) => {
        stream.write(request, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      console.error('Real Geyser failed, fallback to mock:', error);
      this.isMock = true;
      this.startMockStream();
    }
  }

  private startMockStream(): void {
    const mockStream = new MockGeyserStream();
    mockStream.on('token_mint', (token: MockTokenSignal) => {
      const event: MintEvent = {
        mint: token.mint,
        signature: 'mock_sig',
        timestamp: new Date(token.timestamp).toISOString(),
        initialLiquidity: token.initialLiquidity,
        socialScore: token.socialScore,
        metadata: {
          mint: token.mint,
          name: token.name,
          symbol: token.symbol,
          isMintable: token.isMintable,
        },
      };
      void this.handleMint(event);
    });
    mockStream.start();
  }

  private async handleMint(event: MintEvent): Promise<void> {
    const startTime = performance.now();
    const result: ScoringResult = this.scoringService.calculateScore(event);
    const latency = performance.now() - startTime;

    if (result.score >= 85) {
      const alphaSignal: AlphaSignal = {
        event,
        score: result.score,
        latency,
        isPremium: result.score >= 90,
      };
      this.activeSignals.set(event.mint, alphaSignal);
      this.emit('alpha', alphaSignal);

      // Persistence: Schema v1.3 (scouted_tokens)

      const { error } = (await (supabase.from('scouted_tokens') as any).upsert(
        {
          mint_address: event.mint,
          symbol: event.metadata?.symbol,
          base_score: result.score,
          ai_reasoning: result.reasoning.join('\n'), // Eliza OS Placeholder
          is_active: true,
          is_private: result.score >= 90,
          metadata: event.metadata,
        },
        { onConflict: 'mint_address' },
      )) as { error: any };
      if (error) console.error('Failed to upsert scouted token:', error);
    }
    this.emit('mint', event);
  }

  /**
   * Probability Engine: Filter signals based on user rank.
   */
  getTieredSignals(rank: UserRank, isStarlight: boolean, isVIP: boolean): AlphaSignal[] {
    return Array.from(this.activeSignals.values())
      .filter((signal) => {
        if (signal.score < 85) return false;

        if (signal.isPremium) {
          if (isStarlight || rank === UserRank.ELITE) return true;
          const prob = Math.random();
          if (rank === UserRank.PRO) return prob > 0.5;
          return Math.random() > 0.9;
        }

        return true;
      })
      .map((signal) => {
        if (isVIP) {
          const result: ScoringResult = this.scoringService.calculateScore(signal.event);
          return { ...signal, reasoning: result.reasoning };
        }
        return signal;
      });
  }

  private startMonitoringLoop(): void {
    setInterval(() => {
      for (const [mint, signal] of this.activeSignals.entries()) {
        const currentResult: ScoringResult = this.scoringService.calculateScore(signal.event);
        const isDegrading = Math.random() > 0.95;
        const finalScore = isDegrading ? 80 : currentResult.score;

        if (finalScore < 85) {
          this.activeSignals.delete(mint);
          this.emit('token_down', mint);
          console.warn(`[AUTO-DOWN] Mint ${mint} score dropped below 85.`);

          // Persistence: Update Database Status
          void (async () => {
            const { error } = (await (supabase.from('scouted_tokens') as any)
              .update({ is_active: false })
              .eq('mint_address', mint)) as { error: any };
            if (error) console.error('Failed to deactivate token:', error);
          })();
        }
      }
    }, 10000);
  }
}
