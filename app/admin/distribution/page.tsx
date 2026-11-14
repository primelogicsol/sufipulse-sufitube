"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import catalog from "../../../data/distribution/featured-recordings.json";
import prospectData from "../../../data/distribution/partner-prospects.json";

const components = [
  {name:"Discovery engine",status:"Catalog + public prospects",description:"Topic matching can generate researched placement opportunities from existing songs."},
  {name:"Distribution engine",status:"Draft queue generator",description:"Creates up to 180 days of platform-specific drafts. No automatic posting."},
  {name:"Partner network",status:"Identified only",description:"Prospects are not partners until they explicitly approve participation."},
  {name:"SufiPulse.com",status:"Discovery page in separate PR",description:"The Kashmir listener experience is prepared in draft PR #16, not live."},
  {name:"Intelligence engine",status:"Baseline available",description:"YouTube Analytics baseline can be extended through a current report import."},
  {name:"Optimization engine",status:"Transparent scoring",description:"Songs ranked by topical relevance and available engagement, not an invented YouTube score."},
] as const;
export default function DistributionAdminPage() {
  const {user,loading}=useAuth();
  const router=useRouter();
  useEffect(()=>{if(!loading && (!user || user.role!=="admin")) router.replace("/login");},[loading,user,router]);
  if(loading || !user || user.role!=="admin") return <div className="min-h-screen bg-slate-950 p-10 text-white">Checking administrator access...</div>;
  return <DashboardLayout>
    <div className="mx-auto max-w-6xl space-y-8 p-5 text-[var(--dash-text-primary)] sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">SufiPulse USA · Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Organic Distribution Control Center</h1>
        <p className="mt-3 max-w-3xl text-sm opacity-80">Work-in-progress view of the Kashmir + diaspora discovery system. Drafts and prospects are not delivered campaigns. No account posting is enabled.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-current/15 p-5"><p className="text-xs opacity-70">Full recordings seeded</p><p className="mt-2 text-3xl font-semibold">{catalog.songs.length}</p></div>
        <div className="rounded-xl border border-current/15 p-5"><p className="text-xs opacity-70">Public prospective organizations</p><p className="mt-2 text-3xl font-semibold">{prospectData.partners.length}</p></div>
        <div className="rounded-xl border border-current/15 p-5"><p className="text-xs opacity-70">Verified distributed impressions</p><p className="mt-2 text-3xl font-semibold">0</p><p className="text-xs opacity-60">No publisher integration</p></div>
      </div>
      <section aria-label="System components" className="grid gap-4 md:grid-cols-2">
        {components.map(c=><article key={c.name} className="rounded-xl border border-current/15 p-5">
          <h2 className="text-lg font-semibold">{c.name}</h2><p className="mt-2 text-sm font-medium">{c.status}</p><p className="mt-2 text-sm opacity-70">{c.description}</p>
        </article>)}
      </section>
      <section className="rounded-xl border border-current/15 p-5">
        <h2 className="text-xl font-semibold">Initial featured full songs</h2>
        <ul className="mt-4 space-y-3">
          {catalog.songs.map(s=><li key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-current/10 pb-3 text-sm"><span>{s.title}</span><a className="underline underline-offset-4" href={`https://www.youtube.com/watch?v=${s.id}`} target="_blank" rel="noopener noreferrer">Original YouTube recording</a></li>)}
        </ul>
      </section>
      <section className="rounded-xl border border-current/15 p-5">
        <h2 className="text-xl font-semibold">Researched community prospects</h2>
        <p className="mt-2 text-sm opacity-70">No outreach has been sent and no publishing permission exists for these organizations.</p>
        <ul className="mt-4 space-y-3">{prospectData.partners.map(p=><li className="flex flex-wrap justify-between gap-2 border-b border-current/10 pb-3 text-sm" key={p.id}><span>{p.name} · {p.region}</span><a className="underline underline-offset-4" href={p.website} target="_blank" rel="noopener noreferrer">Official website</a></li>)}</ul>
      </section>
      <div className="flex flex-wrap gap-4 text-sm"><Link href="/admin" className="underline underline-offset-4">Back to admin</Link><a className="underline underline-offset-4" href="https://github.com/primelogicsol/sufipulse-sufitube/pull/17" target="_blank" rel="noopener noreferrer">Implementation and run instructions</a></div>
    </div>
  </DashboardLayout>;
}
