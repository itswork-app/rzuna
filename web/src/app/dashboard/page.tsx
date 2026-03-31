'use client';

import { useSignals } from '@/hooks/useSignals';
import { TokenCard } from '@/components/TokenCard';
import { RankWidget } from '@/components/RankWidget';

export default function Dashboard() {
  const { signals, loading } = useSignals();

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tighter">RZUNA <span className="text-zinc-500">v1.5</span></h1>
        <div className="flex gap-4 items-center">
          {/* Rank ala Mobile Legends akan muncul di sini */}
          <RankWidget
            rank="NEWBIE"
            status="NONE"
            currentVolume={0}
            nextThreshold={1000}
          />
          <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-zinc-200 transition-colors">
            Connect Wallet
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Token Scouting Stream */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Live Alpha Signals</h2>
          {loading ? (
            <p className="text-zinc-500 text-sm font-medium animate-pulse">Initializing AI tracking module...</p>
          ) : signals.length === 0 ? (
            <p className="text-zinc-500 text-sm">No signals currently meet the Institutional grade threshold (Score &gt; 85).</p>
          ) : (
            <div className="grid gap-4">
              {signals.map((signal) => (
                <TokenCard key={signal.mint} signal={signal} />
              ))}
            </div>
          )}
        </div>

        {/* AI Reasoning & Quota Sidebar */}
        <aside className="space-y-6">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 shadow-md">
            <h3 className="text-sm font-bold mb-2 text-white">AI Quota Status</h3>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[20%]"></div>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 font-medium tracking-wide">4 / 20 Analysis Used (Starlight Tier)</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
