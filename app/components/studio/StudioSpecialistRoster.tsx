import Link from 'next/link';
import { plannedRolesByArea, studioSpecialistSlug, type StudioTeamArea } from '@/lib/studio-team-registry';

export function StudioSpecialistRoster({
  areas,
  heading = 'Specialist Team',
  description = 'SufiPulse studio specialist roster',
}: {
  areas: StudioTeamArea[];
  heading?: string;
  description?: string;
}) {
  const members = areas.flatMap((area) => plannedRolesByArea(area));
  return (
    <section aria-label={heading} className="py-12 bg-[var(--color-midnight,#0b1221)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">{heading}</h2>
        <p className="mt-2 text-sm text-neutral-400">{description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-7">
          {members.map((member) => (
            <article key={member.id} className="rounded-xl border border-amber-400/20 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white">{member.name}</h3>
              <p className="text-sm text-amber-300 mt-2">{member.designation}</p>
              <p className="text-xs text-neutral-400 mt-3">{member.background} · SufiPulse Studio</p>
              <Link href={`/studio/team/${studioSpecialistSlug(member)}`} className="mt-5 inline-flex text-sm font-semibold text-amber-300 hover:text-amber-200 focus-visible:underline" aria-label={`View ${member.name}'s specialist profile`}>
                View specialist profile <span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
