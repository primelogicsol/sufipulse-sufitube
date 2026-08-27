import type { ReactNode } from 'react';

export default function DiscoveryPerformanceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        button[title="Simulation Mode - For local diagnostics only"] {
          display: none !important;
        }
        div:has(> button[title="Simulation Mode - For local diagnostics only"]) + p {
          display: none !important;
        }
      `}</style>
      <div className="bg-black border-b border-white/10 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 text-[11px]">
          <span className="font-black uppercase tracking-[0.18em] text-neutral-300">Data provenance</span>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-300 font-bold">FIRST-PARTY RUNTIME</span>
            <span className="px-2 py-1 rounded border bg-blue-500/10 border-blue-500/20 text-blue-300 font-bold">REGISTRY / MANUAL</span>
            <span className="px-2 py-1 rounded border bg-neutral-800 border-neutral-700 text-neutral-400 font-bold">UNAVAILABLE</span>
            <span className="px-2 py-1 rounded border bg-purple-500/10 border-purple-500/20 text-purple-300 font-bold">SIMULATION — NON-AUTHORITATIVE</span>
          </div>
          <p className="text-neutral-500 lg:ml-auto max-w-2xl">
            Simulation is isolated from production readiness and cannot mark Google Search Console or YouTube Analytics as connected. Live connection status is based only on verified API responses and stored read-only OAuth state.
          </p>
        </div>
      </div>
      {children}
    </>
  );
}
