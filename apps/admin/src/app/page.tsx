'use client';

/**
 * 🏛️ Admin Dashboard: Institutional Control (V22.1)
 */
export default function AdminPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white font-sans">
      <div className="w-full max-w-4xl p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 inline-flex items-center gap-3">
          <span className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">R</span>
          RZUNA ADMIN PORTAL
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-2xl">
          Advanced Alpha Protocol Institutional Control. This environment is designated for 
          "Zero Trust" administration as per V22.1 Master Blueprint.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <h3 className="font-bold text-blue-400 mb-2">Engines</h3>
            <p className="text-2xl font-mono">3 Active</p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <h3 className="font-bold text-green-400 mb-2">Protocols</h3>
            <p className="text-2xl font-mono">15 Registered</p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <h3 className="font-bold text-purple-400 mb-2">Systems</h3>
            <p className="text-2xl font-mono">Operational</p>
          </div>
        </div>
      </div>
    </div>
  );
}
