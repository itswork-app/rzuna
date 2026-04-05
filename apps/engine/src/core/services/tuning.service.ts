import { Redis } from 'ioredis';
import { env } from '../../utils/env.js';

export interface ScoringConfig {
  version: string;
  updatedAt: number;
  author: string;
  l1Threshold: number;
  autoTuning: boolean;
  weights: {
    baseScore: number;
    vSolGT20: number;
    vSolGT50: number;
    vSolGT100: number;
    mcapGT10: number;
    mcapGT50: number;
    mcapGT500: number;
    txBuy: number;
    txCreate: number;
    twitter: number;
    website: number;
    telegram: number;
    symbolQuality: number;
    nameQuality: number;
  };
}

const DEFAULT_CONFIG: ScoringConfig = {
  version: '1.0.0',
  updatedAt: Date.now(),
  author: 'SYSTEM',
  l1Threshold: 65,
  autoTuning: false,
  weights: {
    baseScore: 30,
    vSolGT20: 10,
    vSolGT50: 10,
    vSolGT100: 5,
    mcapGT10: 10,
    mcapGT50: 5,
    mcapGT500: 5,
    txBuy: 8,
    txCreate: 3,
    twitter: 5,
    website: 3,
    telegram: 3,
    symbolQuality: 2,
    nameQuality: 2,
  },
};

/**
 * 🏛️ TuningService: Godmode Configuration Management (V22.2)
 * Manages real-time scoring weights and thresholds via Redis.
 * Supports versioning and instant rollbacks.
 */
export class TuningService {
  private redis: Redis | null = null;
  private currentConfig: ScoringConfig = DEFAULT_CONFIG;
  private static readonly REDIS_KEY = 'rzuna:config:current';
  private static readonly HISTORY_KEY = 'rzuna:config:history';

  constructor() {
    if (env.REDIS_URL) {
      this.redis = new Redis(env.REDIS_URL);
    }
  }

  /**
   * 💧 Sync config from Redis on boot or admin update.
   */
  async refreshConfig(): Promise<ScoringConfig> {
    if (!this.redis) return DEFAULT_CONFIG;

    try {
      const data = await this.redis.get(TuningService.REDIS_KEY);
      if (data) {
        this.currentConfig = JSON.parse(data);
      } else {
        // Bootstrap first config
        await this.updateConfig(DEFAULT_CONFIG, 'SYSTEM (Bootstrap)');
      }
    } catch (err) {
      console.error('❌ [Tuning] Failed to load config from Redis:', err);
    }
    return this.currentConfig;
  }

  getConfig(): ScoringConfig {
    return this.currentConfig;
  }

  /**
   * 🛠️ Update live config and save snapshot to history.
   */
  async updateConfig(newConfig: ScoringConfig, author: string): Promise<void> {
    if (!this.redis) {
      this.currentConfig = newConfig;
      return;
    }

    const payload: ScoringConfig = {
      ...newConfig,
      updatedAt: Date.now(),
      author,
    };

    await this.redis.set(TuningService.REDIS_KEY, JSON.stringify(payload));
    // Push to history (limit to last 50)
    await this.redis.lpush(TuningService.HISTORY_KEY, JSON.stringify(payload));
    await this.redis.ltrim(TuningService.HISTORY_KEY, 0, 49);

    this.currentConfig = payload;
    console.info(`🛡️ [Tuning] Config updated to v${payload.version} by ${author}`);
  }

  async getHistory(): Promise<ScoringConfig[]> {
    if (!this.redis) return [];
    const items = await this.redis.lrange(TuningService.HISTORY_KEY, 0, -1);
    return items.map((i: string) => JSON.parse(i));
  }
}
