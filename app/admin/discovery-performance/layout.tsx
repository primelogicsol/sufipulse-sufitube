import type { ReactNode } from 'react';

export default function DiscoveryPerformanceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="bg-neutral-950 border-b border-white/10 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 text-[11px]">
          <span className="font-black uppercase tracking-[0.18em] text-neutral-300 shrink-0">
            Data Provenance
          </span>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/25 text-emerald-300 font-bold">
              LIVE API VERIFIED
            </span>
            <span className="px-2 py-0.5 rounded border bg-teal-500/10 border-teal-500/25 text-teal-300 font-bold">
              VERIFIED STUDIO CSV
            </span>
            <span className="px-2 py-0.5 rounded border bg-blue-500/10 border-blue-500/25 text-blue-300 font-bold">
              FIRST-PARTY TELEMETRY
            </span>
            <span className="px-2 py-0.5 rounded border bg-amber-500/10 border-amber-500/25 text-amber-300 font-bold">
              MANUAL OBSERVATION
            </span>
            <span className="px-2 py-0.5 rounded border bg-neutral-800 border-neutral-700 text-neutral-400 font-bold">
              NOT CONFIGURED / UNAVAILABLE
            </span>
          </div>
          <p className="text-neutral-500 lg:ml-auto max-w-xl">
            Zero fabricated search volumes, zero simulated HTTP 202s, and zero synthetic KPIs. Unconfigured integrations display explicit setup requirements.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
