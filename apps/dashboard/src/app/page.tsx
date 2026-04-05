// @ts-nocheck
'use client';

import { usePrivy } from '@privy-io/react-auth';
import {
  Activity,
  ArrowRight,
  Zap,
  Terminal,
  Search,
  Flame,
  Settings,
  ShieldAlert,
  Rocket,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchScoutedTokensAction, fetchActiveTradesAction } from './actions';

export default function HomeB2C() {
  const { login, authenticated, ready, user } = usePrivy();
  const [searchQuery, setSearchQuery] = useState('');

  // Trading Feed & Execution State
  const [tokens, setTokens] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([
    // Mock initial view if db empty
    { mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', pnl: '+15.4%', amount: '0.5' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiUnlocked, setIsAiUnlocked] = useState(false);

  // Snipe Configuration (Global 1-Click Settings)
  const [stopLoss, setStopLoss] = useState('15');
  const [takeProfit, setTakeProfit] = useState('50');
  const [trailing, setTrailing] = useState(true);

  // Load Tokens once auth is ready
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      setIsLoading(true);
      fetchScoutedTokensAction(user.wallet.address).then((res) => {
        if (res.success) {
          setTokens(res.tokens);
          setIsAiUnlocked(res.isAiUnlocked);
        }
        setIsLoading(false);
      });
      fetchActiveTradesAction(user.wallet.address).then((res) => {
        if (res.success && res.positions?.length > 0) {
          setPositions(res.positions);
        }
      });
    }
  }, [authenticated, user]);

  const handleQuickBuy = async (mintAddress: string) => {
    try {
      // Using Next Proxy or Direct Engine URL.
      const response = await fetch('https://api.aivo.sh/v1/trade/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BUY',
          mint: mintAddress,
          amount: 0.1, // Default Quick Snipe amount (SOL)
          settings: { stopLoss, takeProfit, trailing },
        }),
      });

      alert(
        `Request Sent to AIVO Engine (Asynchronous JITO Bundle) -> ${response.ok ? 'SUCCESS' : 'FAILED'}`,
      );
    } catch (err) {
      console.error(err);
      alert('Failed to communicate with Engine.');
    }
  };

  const handleSell = async (mintAddress: string) => {
    try {
      const response = await fetch('https://api.aivo.sh/v1/trade/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SELL',
          mint: mintAddress,
          percent: 100, // Market Sell Everything
        }),
      });

      alert(`Market Sell Order Sent to Engine -> ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (err) {
      console.error(err);
      alert('Failed to communicate with Engine.');
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* 🚀 Birdeye-Style Top Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-bold text-xl tracking-tight text-white flex items-center gap-2"
            >
              <Zap className="w-6 h-6 text-green-500 fill-current" /> RZUNA
            </Link>

            <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <Link
                href="/"
                className="px-4 py-1.5 text-sm font-medium rounded-md bg-slate-800 text-white shadow-sm"
              >
                Screener
              </Link>
              <Link
                href="/b2b"
                className="px-4 py-1.5 text-sm font-medium rounded-md text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                API Portal <Terminal className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex z-10 items-center justify-between gap-4">
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by token or pair..."
                className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-white w-64 focus:outline-none focus:border-green-500/50 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {authenticated ? (
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-slate-300">
                  {user?.wallet?.address.slice(0, 4)}...{user?.wallet?.address.slice(-4)}
                </div>
              </div>
            ) : (
              <button
                onClick={login}
                className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-5 rounded-lg transition-all text-sm"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 📊 Main B2C Screener Body */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        {!authenticated ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
            <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mb-6 text-green-500">
              <Activity className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-4 text-white">
              AIVO Retail Intelligence
            </h1>
            <p className="text-slate-400 max-w-md mb-8">
              Connect your Solana wallet to access live institutional token screener, alpha
              signaling, and auto-sniping execution.
            </p>
            <button
              onClick={login}
              className="bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-95 flex items-center gap-2"
            >
              Connect Wallet to View Alpha <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Flame className="w-6 h-6 text-orange-500" /> Hot Alpha Signals
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Live feed of tokens passing the AIVO institutional engine scoring.
                </p>
              </div>
            </div>

            {/* Global Settings Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Settings className="w-5 h-5 text-slate-500" /> Global Snipe Config
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Stop Loss (%)</label>
                <input
                  type="number"
                  className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-green-500 outline-none"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Take Profit (%)</label>
                <input
                  type="number"
                  className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-green-500 outline-none"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <label
                  className="text-xs text-slate-400 cursor-pointer"
                  onClick={() => setTrailing(!trailing)}
                >
                  Trailing Stop
                </label>
                <button
                  onClick={() => setTrailing(!trailing)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${trailing ? 'bg-green-500' : 'bg-slate-700'}`}
                >
                  <div
                    className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${trailing ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </div>
            </div>

            {/* 🔥 Open Positions (SELL UI) */}
            {positions.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md mb-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Active Positions (Portfolio)
                </h2>
                <div className="space-y-3">
                  {positions.map((pos, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center justify-between border-b border-slate-800/50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                          💰
                        </div>
                        <div>
                          <p className="text-white font-mono text-sm">
                            {pos.mint.slice(0, 6)}...{pos.mint.slice(-6)}
                          </p>
                          <p className="text-xs text-slate-500">Holdings: {pos.amount} SOL</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Unrealized PNL</p>
                          <p
                            className={`text-sm font-bold ${pos.pnl.includes('-') ? 'text-red-500' : 'text-green-500'}`}
                          >
                            {pos.pnl}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSell(pos.mint)}
                            className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                          >
                            Market Sell
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Token List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center shadow-lg w-full flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mb-6 text-slate-500 ring-4 ring-slate-800 animate-pulse">
                    <Search className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-300 mb-2">
                    Syncing with AI Engine...
                  </h2>
                </div>
              ) : tokens.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center text-slate-500">
                  No highly-scored tokens found in the last scan. Waiting for market triggers.
                </div>
              ) : (
                tokens.map((token, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/50 border border-slate-800 hover:border-green-500/30 transition-colors p-5 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xl font-bold text-slate-900">
                        {token.symbol?.[0] || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-white">
                            {token.symbol || 'Unknown'}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 font-mono border border-green-500/20">
                            Score: {token.baseScore || 0}/100
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 font-mono mt-1">{token.mintAddress}</p>
                      </div>
                    </div>

                    <div className="hidden md:flex flex-col w-1/3 relative">
                      <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> AI Reasoning
                      </div>
                      <p
                        className={`text-xs text-slate-300 line-clamp-2 transition-all duration-300 ${isAiUnlocked ? '' : 'filter blur-md select-none'}`}
                      >
                        {token.aiReasoning || 'Passed heuristics parameters.'}
                      </p>
                      {!isAiUnlocked && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center -translate-y-1">
                          <button
                            onClick={() => (window.location.href = '/b2b')}
                            className="bg-slate-950/80 hover:bg-slate-900 border border-slate-700 text-[10px] text-white px-3 py-1.5 rounded-md font-bold transition-colors whitespace-nowrap flex items-center gap-1 shadow-lg"
                          >
                            <ShieldAlert className="w-3 h-3 text-yellow-500" /> Unlock AI Inference
                            (1.0 SOL)
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleQuickBuy(token.mintAddress)}
                      className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-green-600/20"
                    >
                      <Rocket className="w-4 h-4" /> 1-Click Buy
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
