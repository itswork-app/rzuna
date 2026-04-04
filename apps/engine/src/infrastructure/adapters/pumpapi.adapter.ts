import { env } from '../../utils/env.js';

export interface PumpMetadata {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  creator: string;
}

/**
 * 🏛️ PumpapiAdapter: Rich Metadata Enrichment (Cached)
 * 30s TTL cache prevents redundant API calls on rapid trades.
 */
export class PumpapiAdapter {
  private readonly baseUrl = 'https://frontend-api-v3.pump.fun';
  private cache: Map<string, { data: PumpMetadata; expiry: number }> = new Map();
  private static readonly CACHE_TTL = 30_000;

  async getTokenMetadata(mint: string): Promise<PumpMetadata | null> {
    const cached = this.cache.get(mint);
    if (cached && Date.now() < cached.expiry) return cached.data;

    try {
      const response = await fetch(`${this.baseUrl}/coins/${mint}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'RZUNA-Engine/1.9.0' },
      });

      if (!response.ok) throw new Error(`Failed: ${response.statusText}`);

      const data = await response.json();
      const metadata: PumpMetadata = {
        mint: data.mint,
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        image_uri: data.image_uri,
        twitter: data.twitter || null,
        telegram: data.telegram || null,
        website: data.website || null,
        creator: data.creator || data.traderPublicKey || 'UNKNOWN',
      };

      this.cache.set(mint, { data: metadata, expiry: Date.now() + PumpapiAdapter.CACHE_TTL });
      return metadata;
    } catch (err) {
      console.error(`❌ [Pumpapi] Error fetching ${mint}:`, err);
      return null;
    }
  }
}
