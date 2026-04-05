import { describe, it, expect } from 'vitest';
import { ScoringService } from '../core/services/scoring.service.js';
import { ScoringConfig } from '../core/services/tuning.service.js';
import https from 'node:https';

// 🔥 Live API helper: bypasses vitest global fetch mock by using node:https directly
function handleResponse(
  res: import('node:http').IncomingMessage,
  resolve: (val: { status: number; json: () => Promise<any> }) => void,
) {
  let data = '';
  res.on('data', (chunk: Buffer) => (data += chunk.toString()));
  res.on('end', () => {
    resolve({
      status: res.statusCode || 500,
      json: async () => JSON.parse(data),
    });
  });
}

async function liveFetch(url: string): Promise<{ status: number; json: () => Promise<any> }> {
  return new Promise((resolve, reject) => {
    const opts = { headers: { Accept: 'application/json', 'User-Agent': 'RZUNA-Engine/1.9.0' } };
    const req = https.get(url, opts, (res) => handleResponse(res, resolve));
    req.on('error', reject);
  });
}

const DEFAULT_TEST_CONFIG: ScoringConfig = {
  version: '1.0.0-dryrun',
  updatedAt: Date.now(),
  author: 'DRYRUN',
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

const PUMPAPI_BASE = 'https://frontend-api-v3.pump.fun';

interface ScoredToken {
  mint: string;
  symbol: string;
  name: string;
  score: number;
  isPremium: boolean;
  latencyMs: number;
  twitter: string;
  website: string;
}

/**
 * 🏛️ BATTLE-TEST DRY RUN: Real Solana Data Pipeline
 * Connects to Pump.fun API (live, public) to fetch real token data.
 * Scores real transactions. Zero trades executed.
 */
describe('🔥 Battle-Test: Live Solana Dry Run', () => {
  const scorer = new ScoringService();

  it('SHOULD fetch and score LIVE new tokens from Pump.fun', async () => {
    const res = await liveFetch(`${PUMPAPI_BASE}/coins?offset=0&limit=20&sort=created_timestamp`);

    expect(res.status).toBe(200);
    const tokens = await res.json();
    expect(tokens.length).toBeGreaterThan(0);

    console.info('\n' + '═'.repeat(70));
    console.info('  🏛️ BATTLE-TEST AUDIT REPORT — LIVE SOLANA DATA');
    console.info('═'.repeat(70));
    console.info(`  Tokens fetched: ${tokens.length}`);

    const scored: ScoredToken[] = [];

    for (const token of tokens) {
      const start = performance.now();
      const event = {
        mint: token.mint,
        symbol: token.symbol,
        name: token.name,
        txType: 'create' as const,
        vSolInBondingCurve: token.virtual_sol_reserves ? token.virtual_sol_reserves / 1e9 : 0,
        marketCapSol: token.usd_market_cap ? token.usd_market_cap / 150 : 0,
        traderPublicKey: token.creator || '',
      };

      const result = scorer.calculateInitialScore(event, DEFAULT_TEST_CONFIG);
      const latency = performance.now() - start;

      scored.push({
        mint: token.mint,
        symbol: token.symbol || '???',
        name: (token.name || '???').slice(0, 25),
        score: result.score,
        isPremium: result.isPremium,
        latencyMs: Math.round(latency * 1000) / 1000,
        twitter: token.twitter || '-',
        website: token.website || '-',
      });
    }

    scored.sort((a, b) => b.score - a.score);

    console.info('\n  📊 Scoring Results (top 10):');
    console.info('  ' + '-'.repeat(66));
    scored.slice(0, 10).forEach((s, i) => {
      const premium = s.isPremium ? '🔥' : '  ';
      console.info(
        `  ${premium} ${String(i + 1).padStart(2, ' ')}. ${s.symbol.padEnd(12)} | Score: ${String(s.score).padStart(3)} | ${s.latencyMs}ms | ${s.mint.slice(0, 12)}...`,
      );
    });

    const avg = scored.reduce((sum, e) => sum + e.latencyMs, 0) / scored.length;
    const alphas = scored.filter((s) => s.score >= 88);

    console.info('  ' + '-'.repeat(66));
    console.info(`  Avg scoring latency : ${avg.toFixed(3)}ms`);
    console.info(`  Alpha signals (≥88) : ${alphas.length} / ${scored.length}`);
    console.info(`  Premium signals     : ${scored.filter((s) => s.isPremium).length}`);
    console.info('═'.repeat(70) + '\n');

    expect(avg).toBeLessThan(10);
    expect(scored.every((s) => s.score >= 0 && s.score <= 100)).toBe(true);
  });

  it('SHOULD enrich a real token with full metadata from Pump.fun', async () => {
    const list = await liveFetch(`${PUMPAPI_BASE}/coins?offset=0&limit=1&sort=created_timestamp`);
    const tokens = await list.json();
    const first = Array.isArray(tokens) ? tokens[0] : null;
    const mint = first?.mint;

    if (!mint) {
      console.warn('  ⚠️ No mint available for enrichment test');
      return;
    }

    const start = performance.now();
    const res = await liveFetch(`${PUMPAPI_BASE}/coins/${mint}`);
    const latency = performance.now() - start;
    const data = await res.json();

    console.info(`\n  🔍 Metadata Enrichment → ${res.status} in ${latency.toFixed(0)}ms`);
    console.info(`  Token : ${data.name} (${data.symbol})`);
    console.info(`  Desc  : ${(data.description || 'N/A').slice(0, 80)}`);
    console.info(`  Twitter: ${data.twitter || 'none'} | Website: ${data.website || 'none'}`);
    console.info(`  Image : ${data.image_uri ? 'yes' : 'none'}`);

    expect(res.status).toBe(200);
    expect(data.mint).toBe(mint);
    expect(latency).toBeLessThan(5000);
  });
});
