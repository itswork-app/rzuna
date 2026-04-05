// @ts-nocheck
'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  Globe,
  ArrowRight,
  Plus,
  Key,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { syncUserAction, generateApiKeyAction, fetchDashboardStateAction } from '../actions';
import Link from 'next/link';

/**
 * 🏛️ Dashboard Home: The B2B Portal (Institutional v22.1)
 * Wired directly to @rzuna/database Server Actions.
 */
export default function DashboardPage() {
  const { login, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();

  // App State
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<{ name: string; key: string; status: string }[]>([]);
  const [usageStats, setUsageStats] = useState({
    apiCalls: '0',
    credits: '0',
    volume: '$0',
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Sync User on Login
  useEffect(() => {
    async function syncUser() {
      if (authenticated && user?.wallet?.address) {
        setLoading(true);
        const res = await syncUserAction(user.wallet.address);
        if (res.success && res.userId) {
          setInternalUserId(res.userId);
        }
      }
    }
    syncUser();
  }, [authenticated, user]);

  // 2. Fetch Board State after User is Synced
  useEffect(() => {
    async function loadData() {
      if (internalUserId) {
        const res = await fetchDashboardStateAction(internalUserId);
        if (res.success && res.state) {
          setApiKeys(res.state.apiKeys);
          setUsageStats(res.state.usageStats);
        }
        setLoading(false);
      }
    }
    loadData();
  }, [internalUserId]);

  // 3. Generate Secure API Key
  const handleGenerateKey = async () => {
    if (!internalUserId) return;
    setErrorMsg(null);

    // We can show button spinner here if preferred, but for now we'll do basic blocking
    const res = await generateApiKeyAction(internalUserId, newKeyName || 'New API Key');

    if (res.success && res.rawKey && res.key) {
      setGeneratedKey(res.rawKey);
      setApiKeys([
        ...apiKeys,
        {
          name: res.key.name,
          status: res.key.status,
          key: `aivo_...${res.key.id.toString().split('-')[0]}`,
        },
      ]);
      setShowKeyModal(false);
      setNewKeyName('');
    } else {
      setErrorMsg(res.error || 'Failed to generate key');
    }
  };

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-8 animate-pulse text-blue-500">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 bg-linear-to-br from-white to-slate-400 bg-clip-text text-transparent">
          Institutional B2B Access
        </h1>
        <p className="text-slate-400 max-w-md mb-10 text-lg leading-relaxed">
          Unlock the RZUNA Alpha Intelligence via our production-grade SDK. Experience the power of
          the AIVO Protocol.
        </p>
        <button
          onClick={login}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-10 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2 text-lg"
        >
          Connect via Privy <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (loading && !internalUserId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 mb-10">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-bold text-xl tracking-tight text-white flex items-center gap-2"
            >
              <Zap className="w-6 h-6 text-blue-500 fill-current" /> RZUNA
            </Link>

            <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <Link
                href="/"
                className="px-4 py-1.5 text-sm font-medium rounded-md text-slate-400 hover:text-white transition-colors"
              >
                Screener
              </Link>
              <Link
                href="/b2b"
                className="px-4 py-1.5 text-sm font-medium rounded-md bg-slate-800 text-white shadow-sm flex items-center gap-2"
              >
                API Portal <Zap className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-slate-300">
              {user?.wallet?.address.slice(0, 4)}...{user?.wallet?.address.slice(-4)}
            </div>
          </div>
        </div>
      </nav>

      <div className="space-y-10 max-w-6xl mx-auto pb-20 px-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">
              Developer Overview
            </h1>
            <p className="text-slate-400">
              Monitoring your B2B integration across the AIVO Protocol.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setErrorMsg(null);
                setShowKeyModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Generate API Key
            </button>
          </div>
        </header>

        {/* 📊 Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: 'API Calls (Lifetime)',
              value: usageStats.apiCalls,
              icon: Zap,
              color: 'text-yellow-500',
              bg: 'bg-yellow-500/10',
            },
            {
              label: 'AI Credits Used',
              value: usageStats.credits,
              icon: ShieldCheck,
              color: 'text-blue-500',
              bg: 'bg-blue-500/10',
            },
            {
              label: 'B2B Trading Volume',
              value: usageStats.volume,
              icon: TrendingUp,
              color: 'text-green-500',
              bg: 'bg-green-500/10',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-400 font-medium text-sm">{stat.label}</span>
                <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-100 tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {generatedKey && (
          <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-xl text-green-500">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <p className="text-green-400 font-bold">New API Key Generated!</p>
                <p className="text-slate-400 text-sm">
                  Copy this key now. You won't be able to see it again.
                </p>
              </div>
            </div>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 gap-4 w-full md:w-auto overflow-x-auto">
              <code className="text-green-400 font-mono text-sm whitespace-nowrap">
                {generatedKey}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedKey);
                  alert('Copied to clipboard!');
                }}
                className="text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setGeneratedKey(null)}
              className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 font-medium"
            >
              I've copied it
            </button>
          </div>
        )}

        {/* 🔑 API Keys List Table */}
        {apiKeys.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Active API Keys</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {apiKeys.map((k, i) => (
                <div
                  key={i}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">{k.name}</p>
                      <code className="text-slate-500 text-sm">{k.key}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      {k.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tiers & Upgrade Logic */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8">
              <div className="bg-blue-600/10 text-blue-500 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20">
                CURRENT TIER: BRONZE
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Upgrade to VIP</h2>
            <p className="text-slate-400 mb-8 max-w-md text-sm">
              Unlock 1.0% trading fees, unlimited AI credits, multiple API Keys, and dedicated Jito
              bundling for institutional performance.
            </p>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-bold text-white">5.0</span>
              <span className="text-slate-400 font-medium">SOL / month</span>
            </div>
            <button
              onClick={async () => {
                if (!authenticated || !user?.wallet?.address) {
                  login();
                  return;
                }
                try {
                  const activeWallet =
                    wallets.find((w) => w.walletClientType === 'phantom') || wallets[0];
                  if (!activeWallet) throw new Error('No Solana wallet connected');

                  // Constructing the pure Web3 Transaction
                  const tx = new Transaction().add(
                    SystemProgram.transfer({
                      fromPubkey: new PublicKey(user.wallet.address),
                      toPubkey: new PublicKey('TREASuryY3h175xSGEpB78S98wXn7WjYzwH8RkZ1L'), // Rzuna B2B Treasury
                      lamports: 1_000_000_000, // 1.0 SOL (Updated Shortcut Fee)
                    }),
                  );

                  alert(
                    `Solana Transaction Built!\nTransferring 1.0 SOL to TREASury...\n\n(Privy Wallet Gateway is now ready to sign payload: ${tx.compileMessage().serialize().toString('base64').slice(0, 50)}...)`,
                  );
                } catch (err) {
                  alert('Transaction Failed: ' + (err as Error).message);
                }
              }}
              className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Pay with Solana Pay <Zap className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* 📚 Integration Quickstart */}
          <div className="bg-blue-600/5 border border-blue-600/20 p-8 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" /> Integration Quickstart
            </h2>
            <div className="bg-slate-950 p-6 rounded-xl font-mono text-sm leading-relaxed border border-slate-800 overflow-x-auto shadow-inner">
              <span className="text-blue-400">import</span> {'{ AivoClient }'}{' '}
              <span className="text-blue-400">from</span>{' '}
              <span className="text-green-400">'@rzuna/sdk'</span>;
              <br />
              <br />
              <span className="text-slate-500">// Initialize Institutional Nerve</span>
              <br />
              <span className="text-purple-400">const</span> client ={' '}
              <span className="text-purple-400">new</span>{' '}
              <span className="text-yellow-400">AivoClient</span>({"{ apiKey: 'aivo_...' }"});
              <br />
              <br />
              <span className="text-slate-500">// Subscribe to High-Alpha Signals</span>
              <br />
              client.<span className="text-yellow-400">on</span>(
              <span className="text-green-400">'signal'</span>, (signal) {'=>'} console.
              <span className="text-yellow-400">log</span>(signal));
            </div>
          </div>
        </div>

        {/* Modal Backdrop (Active) */}
        {showKeyModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold text-white mb-2">Create New API Key</h2>
              <p className="text-slate-400 text-sm mb-6">
                Give your key a descriptive name to track usage easily.
              </p>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-6 flex items-start gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. My Arbitrage Bot"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateKey}
                  className="flex-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  Create Key
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
