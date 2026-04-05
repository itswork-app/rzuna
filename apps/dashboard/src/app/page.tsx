'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import React, { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { fetchScoutedTokensAction, fetchActiveTradesAction } from './actions';

/**
 * 🚀 RZUNA Retail Screener (B2C)
 * Fully hardened for React 19 and Native Solana.
 */
export default function HomeB2C() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [searchQuery, setSearchQuery] = useState('');

  // Trading Feed & Execution State
  const [tokens, setTokens] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([
    { mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', pnl: '+15.4%', amount: '0.5' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiUnlocked, setIsAiUnlocked] = useState(false);

  // Snipe Configuration
  const [stopLoss, setStopLoss] = useState('15');
  const [takeProfit, setTakeProfit] = useState('50');
  const [trailing, setTrailing] = useState(true);

  // Cast Icons for React 19
  const ZapIcon = Zap as any;
  const ActivityIcon = Activity as any;
  const ArrowIcon = ArrowRight as any;
  const TerminalIcon = Terminal as any;
  const SearchIcon = Search as any;
  const FlameIcon = Flame as any;
  const SettingsIcon = Settings as any;
  const ShieldAlertIcon = ShieldAlert as any;
  const RocketIcon = Rocket as any;
  const NavLink = Link as any;
  const LoaderIcon = Loader2 as any;

  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      setIsLoading(true);
      fetchScoutedTokensAction(address).then((res) => {
        if (res.success) {
          setTokens(res.tokens);
          setIsAiUnlocked(res.isAiUnlocked);
        }
        setIsLoading(false);
      });
      fetchActiveTradesAction(address).then((res) => {
        if (res.success && res.positions?.length > 0) {
          setPositions(res.positions);
        }
      });
    }
  }, [connected, publicKey]);

  const handleQuickBuy = async (mintAddress: string) => {
    try {
      const response = await fetch('https://api.aivo.sh/v1/trade/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BUY',
          mint: mintAddress,
          amount: 0.1,
          settings: { stopLoss, takeProfit, trailing },
        }),
      });
      alert(`Request Sent -> ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (err) {
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
          percent: 100,
        }),
      });
      alert(`Market Sell Order Sent -> ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (err) {
      alert('Failed to communicate with Engine.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink href="/" className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              <ZapIcon className="w-6 h-6 text-green-500 fill-current" /> RZUNA
            </NavLink>

            <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <NavLink href="/" className="px-4 py-1.5 text-sm font-medium rounded-md bg-slate-800 text-white shadow-sm">
                Screener
              </NavLink>
              <NavLink href="/b2b" className="px-4 py-1.5 text-sm font-medium rounded-md text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                API Portal <TerminalIcon className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          </div>

          <div className="flex z-10 items-center justify-between gap-4">
            <div className="relative hidden lg:block">
              <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-white w-64 focus:outline-none focus:border-green-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {connected ? (
              <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-slate-300">
                {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
              </div>
            ) : (
              <button
                onClick={() => setVisible(true)}
                className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-5 rounded-lg transition-all text-sm"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        {!connected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
            <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mb-6 text-green-500">
              <ActivityIcon className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-4 text-white">AIVO Retail Intelligence</h1>
            <p className="text-slate-400 max-w-md mb-8">Connect your Solana wallet to access live institutional token screener.</p>
            <button
              onClick={() => setVisible(true)}
              className="bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-green-600/20"
            >
              Connect Wallet <ArrowIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <FlameIcon className="w-6 h-6 text-orange-500" /> Hot Alpha Signals
              </h1>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <SettingsIcon className="w-5 h-5 text-slate-500" /> Global Snipe Config
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">SL (%)</label>
                <input
                  type="number"
                  className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">TP (%)</label>
                <input
                  type="number"
                  className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                />
              </div>
            </div>

            {/* 🔥 Positions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-blue-500" /> Active Positions
              </h2>
              <div className="space-y-3">
                {positions.map((pos, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-slate-800/50 pb-3 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs">💰</div>
                      <div>
                        <p className="text-white font-mono text-sm">{pos.mint.slice(0, 6)}...{pos.mint.slice(-6)}</p>
                        <p className="text-xs text-slate-500">{pos.amount} SOL</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-bold ${pos.pnl.includes('-') ? 'text-red-500' : 'text-green-500'}`}>{pos.pnl}</span>
                      <button onClick={() => handleSell(pos.mint)} className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors">Sell</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Token List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="w-full flex justify-center py-12"><LoaderIcon className="w-8 h-8 animate-spin text-green-500" /></div>
              ) : tokens.map((token, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 hover:border-green-500/30 p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xl font-bold text-slate-900">{token.symbol?.[0]}</div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{token.symbol}</h3>
                      <p className="text-xs text-slate-500 font-mono">{token.mintAddress.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <button onClick={() => handleQuickBuy(token.mintAddress)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                    <RocketIcon className="w-4 h-4" /> Snipe
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
