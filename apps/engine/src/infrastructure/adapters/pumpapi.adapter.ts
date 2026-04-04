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
}

/**
 * 🏛️ PumpapiAdapter: Rich Metadata Enrichment
 * Standar: Canonical Master Blueprint v22.1 (The Dual-Path)
 * Uses pumpapi.io as the primary data provider for social links.
 */
export class PumpapiAdapter {
  private readonly baseUrl = 'https://frontend-api-v3.pump.fun'; // Blueprint: High-memory provider

  async getTokenMetadata(mint: string): Promise<PumpMetadata | null> {
    try {
      console.info(`🔍 [Pumpapi] Fetching metadata for ${mint}...`);
      
      const response = await fetch(`${this.baseUrl}/coins/${mint}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RZUNA-Engine/1.9.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        mint: data.mint,
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        image_uri: data.image_uri,
        twitter: data.twitter || null,
        telegram: data.telegram || null,
        website: data.website || null,
      };
    } catch (err) {
      console.error(`❌ [Pumpapi] Error fetching ${mint}:`, err);
      return null;
    }
  }
}
