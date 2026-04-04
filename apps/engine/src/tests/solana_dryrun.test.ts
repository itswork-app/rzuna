import { describe, it, expect } from 'vitest';
import { ScoringService } from '../core/services/scoring.service.js';

const PUMPAPI_BASE = 'https://frontend-api-v3.pump.fun';
const PUMPPORTAL_HTTP = 'https://pumpportal.fun/api/data';

/**
 * 🏛️ BATTLE-TEST DRY RUN: Real Solana Data Pipeline
 * Connects to Pump.fun API (live, public) to fetch real token data.
 * Scores real transactions. Zero trades executed.
 */
describe('🔥 Battle-Test: Live Solana Dry Run', () => {
  const scorer = new ScoringService();

  it('SHOULD fetch and score LIVE new tokens from Pump.fun', async () => {
    // Fetch latest tokens from Pump.fun
    const res = await fetch(`${PUMPAPI_BASE}/coins?offset=0&limit=20&sort=created_timestamp`, {
      headers: { Accept: 'application/json', 'User-Agent': 'RZUNA-Engine/1.9.0' },
    });

    expect(res.status).toBe(200);
    const tokens = await res.json();
    expect(tokens.length).toBeGreaterThan(0);

    console.info('\n' + '═'.repeat(70));
    console.info('  🏛️ BATTLE-TEST AUDIT REPORT — LIVE SOLANA DATA');
    console.info('═'.repeat(70));
    console.info(`  Tokens fetched: ${tokens.length}`);

    const scored: any[] = [];

    for (const token of tokens) {
      const start = performance.now();
      const event = {
        mint: token.mint,
        symbol: token.symbol,
        name: token.name,
        txType: 'create' as const,
        vSolInBondingCurve: token.virtual_sol_reserves ? token.virtual_sol_reserves / 1e9 : 0,
        marketCapSol: token.usd_market_cap ? token.usd_market_cap / 150 : 0, // approx
        traderPublicKey: token.creator || '',
      };

      const result = scorer.calculateInitialScore(event);
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

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    console.info('\n  📊 Scoring Results (top 10):');
    console.info('  ' + '-'.repeat(66));
    scored.slice(0, 10).forEach((s, i) => {
      const premium = s.isPremium ? '🔥' : '  ';
      console.info(
        `  ${premium} ${String(i + 1).padStart(2, ' ')}. ${s.symbol.padEnd(12)} | Score: ${String(s.score).padStart(3)} | ${s.latencyMs}ms | ${s.mint.slice(0, 12)}...`,
      );
    });

    const avg = scored.reduce((s, e) => s + e.latencyMs, 0) / scored.length;
    const alphas = scored.filter((s) => s.score >= 88);

    console.info('  ' + '-'.repeat(66));
    console.info(`  Avg scoring latency : ${avg.toFixed(3)}ms`);
    console.info(`  Alpha signals (≥88) : ${alphas.length} / ${scored.length}`);
    console.info(`  Premium signals     : ${scored.filter((s) => s.isPremium).length}`);
    console.info('═'.repeat(70) + '\n');

    // Assertions
    expect(avg).toBeLessThan(10); // Scoring MUST be <10ms
    expect(scored.every((s) => s.score >= 0 && s.score <= 100)).toBe(true);
  });

  it('SHOULD enrich a real token with full metadata from Pump.fun', async () => {
    // Get 1 latest token
    const list = await fetch(`${PUMPAPI_BASE}/coins?offset=0&limit=1&sort=created_timestamp`, {
      headers: { Accept: 'application/json', 'User-Agent': 'RZUNA-Engine/1.9.0' },
    });
    const [first] = await list.json();
    const mint = first?.mint;

    if (!mint) {
      console.warn('  ⚠️ No mint available for enrichment test');
      return;
    }

    const start = performance.now();
    const res = await fetch(`${PUMPAPI_BASE}/coins/${mint}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'RZUNA-Engine/1.9.0' },
    });
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
