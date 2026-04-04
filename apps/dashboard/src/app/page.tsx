'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
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

/**
 * 🏛️ Dashboard Home: The B2B Portal (Institutional v22.1)
 */
export default function DashboardPage() {
  const { login, authenticated, ready, user } = usePrivy();
  const [apiKeys, setApiKeys] = useState<{ name: string; key: string; status: string }[]>([]);
  const [usageStats, setUsageStats] = useState({
    apiCalls: '0',
    credits: '0',
    volume: '$0',
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // 🧪 Simulate Data Fetching (Task 4)
  useEffect(() => {
    if (authenticated) {
      setUsageStats({
        apiCalls: '1.2k',
        credits: '45,200',
        volume: '$840,291',
      });
      setApiKeys([{ name: 'Production - Trading Bot', key: 'sk_live_...x429', status: 'Active' }]);
    }
  }, [authenticated]);

  const handleGenerateKey = async () => {
    // 🧪 Simulation: In a real app, this would call a Server Action
    const mockKey = `rz_live_${Math.random().toString(36).substring(7)}${Math.random().toString(36).substring(7)}`;
    setGeneratedKey(mockKey);
    setApiKeys([
      ...apiKeys,
      {
        name: newKeyName || 'New API Key',
        key: `${mockKey.substring(0, 10)}...`,
        status: 'Active',
      },
    ]);
    setShowKeyModal(false);
    setNewKeyName('');
  };

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-8 animate-pulse text-blue-500">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
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

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
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
            onClick={() => setShowKeyModal(true)}
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
            label: 'API Calls (24h)',
            value: usageStats.apiCalls,
            icon: Zap,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
          },
          {
            label: 'AI Credits Remaining',
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
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="text-green-400 font-bold">+12%</span>
              <span className="text-slate-500 italic">vs last period</span>
            </div>
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
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 gap-4 w-full md:w-auto">
            <code className="text-green-400 font-mono text-sm">{generatedKey}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedKey);
                alert('Copied to clipboard!');
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setGeneratedKey(null)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tiers & Upgrade Logic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8">
            <div className="bg-blue-600/10 text-blue-500 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20">
              CURRENT TIER: STARLIGHT
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Upgrade to VIP</h2>
          <p className="text-slate-400 mb-8 max-w-md text-sm">
            Unlock 0.5% trading fees, unlimited AI credits, and dedicated Jito bundling for
            institutional performance.
          </p>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-4xl font-bold text-white">5.0</span>
            <span className="text-slate-400 font-medium">SOL / month</span>
          </div>
          <button className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            Pay with Solana Pay <Zap className="w-4 h-4 fill-current" />
          </button>
          <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Lowest Fees
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> High Rate Limit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Jito Access
            </span>
          </div>
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
            <span className="text-yellow-400">AivoClient</span>({"{ apiKey: '...' }"});
            <br />
            <br />
            <span className="text-slate-500">// Subscribe to High-Alpha Signals</span>
            <br />
            client.<span className="text-yellow-400">on</span>(
            <span className="text-green-400">'signal'</span>, (signal) {'=>'} console.
            <span className="text-yellow-400">log</span>(signal));
          </div>
          <div className="mt-6 flex justify-between items-center text-xs">
            <p className="text-slate-500">
              Read the{' '}
              <a
                href="#"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
              >
                Full SDK Documentation
              </a>
            </p>
            <span className="text-slate-600">v22.1 Stable</span>
          </div>
        </div>
      </div>

      {/* Modal Backdrop (Simulation) */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-2">Create New API Key</h2>
            <p className="text-slate-400 text-sm mb-6">
              Give your key a descriptive name to track usage easily.
            </p>

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
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateKey}
                className="flex-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
