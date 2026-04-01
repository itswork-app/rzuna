'use client';

import { useSignals } from '@/hooks/useSignals';
import { TokenCard } from '@/components/TokenCard';
import { RankWidget } from '@/components/RankWidget';
import { UserStats } from '@/components/UserStats';
import { UserRank, SubscriptionStatus } from '@/types';

export default function Dashboard() {
  const { signals, isLoading } = useSignals();
  
  const handleConsumeQuota = async () => {
    // Implementasi consume quota (atomic via Supabase RPC)
    // Placeholder untuk Institutional CI/CD
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tighter">RZUNA <span className="text-zinc-500">v1.5</span></h1>
        <div className="flex gap-4 items-center">
          {/* Rank ala Mobile Legends akan muncul di sini */}
          <RankWidget
            rank={UserRank.NEWBIE}
            status={SubscriptionStatus.NONE}
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
          {isLoading ? (
            <p className="text-zinc-500 text-sm font-medium animate-pulse">Initializing AI tracking module...</p>
          ) : signals.length === 0 ? (
            <p className="text-zinc-500 text-sm">No signals currently meet the Institutional grade threshold (Score &gt; 85).</p>
          ) : (
            <div className="grid gap-4">
              {signals.map((signal) => (
                <TokenCard 
                  key={signal.id} 
                  signal={signal} 
                  onConsumeQuota={() => handleConsumeQuota()} 
                />
              ))}
            </div>
          )}
        </div>

        {/* AI Reasoning & Quota Sidebar */}
        <aside className="space-y-6">
          <UserStats />
        </aside>
      </section>
    </main>
  );
}
