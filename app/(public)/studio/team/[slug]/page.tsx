import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { studioSpecialists, studioSpecialistBySlug, studioSpecialistSlug, studioRoleResponsibilities, studioTeamAreaDetails } from '@/lib/studio-team-registry';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return studioSpecialists.map(member => ({ slug: studioSpecialistSlug(member) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = studioSpecialistBySlug(slug);
  if (!member) return { title: 'Specialist Not Found | SufiPulse' };
  return {
    title: `${member.name} | SufiPulse Studio`,
    description: `${member.name}, ${member.designation}. Role and responsibilities within SufiPulse Studio.`,
  };
}

export default async function StudioTeamProfile({ params }: Props) {
  const { slug } = await params;
  const member = studioSpecialistBySlug(slug);
  if (!member) notFound();
  const area = studioTeamAreaDetails[member.area];
  const responsibilities = studioRoleResponsibilities[member.id] ?? [];
  const colleagues = studioSpecialists.filter(person => person.area === member.area && person.id !== member.id);

  return (
    <main className="min-h-screen bg-[#0b1221] text-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 pb-24">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
          <Link href="/studio" className="hover:text-amber-300">Studio</Link>
          <span aria-hidden="true">/</span>
          <Link href={area.href} className="hover:text-amber-300">{area.title}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-neutral-200">{member.name}</span>
        </nav>
        <header className="mt-12 rounded-3xl border border-amber-400/25 bg-gradient-to-br from-[#1e2a3e] to-[#101827] p-8 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">SufiPulse Studio · Specialist Profile</p>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">{member.name}</h1>
          <p className="mt-4 text-xl text-amber-200">{member.designation}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-neutral-300">
            <span className="rounded-full border border-white/15 px-4 py-2">{area.title}</span>
            <span className="rounded-full border border-white/15 px-4 py-2">{member.background}</span>
          </div>
        </header>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section aria-labelledby="scope-title" className="rounded-2xl border border-white/10 bg-white/5 p-7 sm:p-9">
            <h2 id="scope-title" className="text-2xl font-semibold">Role & Responsibilities</h2>
            <p className="mt-4 leading-relaxed text-neutral-300">{area.overview}</p>
            <ul className="mt-6 space-y-4">
              {responsibilities.map(responsibility => (
                <li key={responsibility} className="flex gap-3 text-neutral-200">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span>{responsibility}</span>
                </li>
              ))}
            </ul>
            <p className="mt-7 border-t border-white/10 pt-5 text-sm text-neutral-400">
              Individual release credits are documented in their approved release records.
            </p>
          </section>
          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-7">
              <h2 className="text-lg font-semibold">Functional Team</h2>
              <p className="mt-3 text-sm text-neutral-300">{area.title}</p>
              <Link href={area.href} className="mt-5 inline-flex font-semibold text-sm text-amber-300 hover:text-amber-200">
                Explore department <span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </section>
            {colleagues.length > 0 && <section className="rounded-2xl border border-white/10 bg-white/5 p-7">
              <h2 className="text-lg font-semibold">Related Team Members</h2>
              <ul className="mt-4 space-y-3">
                {colleagues.map(person => (
                  <li key={person.id}>
                    <Link href={`/studio/team/${studioSpecialistSlug(person)}`} className="text-sm text-amber-300 hover:text-amber-200">{person.name}</Link>
                    <p className="mt-0.5 text-xs text-neutral-400">{person.designation}</p>
                  </li>
                ))}
              </ul>
            </section>}
          </aside>
        </div>
        <div className="mt-10"><Link href="/studio" className="text-sm font-medium text-amber-300 hover:text-amber-200">← Back to SufiPulse Studio</Link></div>
      </div>
    </main>
  );
}
