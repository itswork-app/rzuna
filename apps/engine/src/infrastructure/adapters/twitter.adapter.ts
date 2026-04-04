import { TwitterApi } from 'twitter-api-v2';
import { env } from '../../utils/env.js';

export interface TwitterSentiment {
  score: number; // 0-100
  recentTweetCount: number;
  topKeywords: string[];
}

/**
 * 🏛️ TwitterAdapter: X API v2 Integration
 * Standar: Canonical Master Blueprint v22.1 (Adapter Pattern)
 */
export class TwitterAdapter {
  private client: TwitterApi | null = null;

  constructor() {
    if (env.TWITTER_BEARER_TOKEN) {
      this.client = new TwitterApi(env.TWITTER_BEARER_TOKEN);
    }
  }

  async getSentiment(query: string): Promise<TwitterSentiment> {
    if (!this.client) {
      return { score: 50, recentTweetCount: 0, topKeywords: [] };
    }

    try {
      // Search for recent tweets about the token (symbol/mint)
      const search = await this.client.v2.search(query, {
        max_results: 10,
        'tweet.fields': ['public_metrics', 'context_annotations'],
      });

      const tweets = search.tweets;
      const count = tweets.length;
      
      // Simple heuristic for sentiment scoring
      let score = 50;
      if (count > 0) {
        score += Math.min(count * 5, 50); // Volume bonus
      }

      return {
        score: Math.min(100, score),
        recentTweetCount: count,
        topKeywords: [query],
      };
    } catch (err) {
      console.error('❌ [TwitterAdapter] Search failed:', err);
      return { score: 50, recentTweetCount: 0, topKeywords: [] };
    }
  }
}
