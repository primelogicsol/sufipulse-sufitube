"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CMSRelease } from "@/lib/cms-storage";

export default function ReleaseRecommendations({ currentId }: { currentId: string }) {
    const [nextUp, setNextUp] = useState<CMSRelease | null>(null);
    const [journeyReleases, setJourneyReleases] = useState<CMSRelease[]>([]);

    useEffect(() => {
        fetch(`/api/releases/${currentId}/next-up`)
            .then(res => (res.ok ? res.json() : null))
            .then(setNextUp)
            .catch(() => {});

        fetch(`/api/releases?pageSize=8&sort=popular`)
            .then(res => (res.ok ? res.json() : null))
            .then(data => {
                const list: CMSRelease[] = Array.isArray(data) ? data : (data?.items || []);
                setJourneyReleases(list);
            })
            .catch(() => {});
    }, [currentId]);

    const relatedCards = journeyReleases
        .filter(r => r && r.slug && r.id !== currentId && r.slug !== currentId && r.id !== nextUp?.id)
        .slice(0, 3);

    if (!nextUp && relatedCards.length === 0) return null;

    return (
        <div className="mt-16 border-t border-neutral-800 pt-12 mb-16 space-y-12">
            {nextUp && nextUp.slug && (
                <section>
                    <h3 className="text-xl font-serif text-white mb-6 uppercase tracking-widest">Up Next</h3>
                    <Link href={`/release-detail/${nextUp.slug}`} className="block group">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-primary-500/50 transition-colors flex items-center justify-between">
                            <div>
                                <p className="text-xs text-primary-400 font-semibold mb-2 tracking-wider">NEXT IN CONTINUOUS PLAY</p>
                                <h4 className="text-2xl font-serif text-white group-hover:text-primary-400 transition-colors">
                                    {(nextUp as any).canonicalTitle || nextUp.title}
                                </h4>
                                <p className="text-neutral-400 mt-2 line-clamp-2 max-w-2xl">
                                    {nextUp.description}
                                </p>
                            </div>
                            <div className="hidden md:flex shrink-0 w-12 h-12 rounded-full border border-neutral-700 items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                                <span className="text-neutral-400 group-hover:text-primary-400">→</span>
                            </div>
                        </div>
                    </Link>
                </section>
            )}

            {relatedCards.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-serif text-white uppercase tracking-widest">Continue The Journey</h3>
                        <Link href="/discovery" className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                            Explore Sufi Discovery →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {relatedCards.map((rel) => (
                            <Link
                                key={rel.id}
                                href={`/release-detail/${rel.slug}`}
                                className="bg-neutral-900/70 border border-neutral-800 hover:border-amber-500/40 rounded-lg p-5 transition-colors group flex flex-col justify-between"
                            >
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-amber-400/80 font-semibold mb-2">
                                        Full-Length Sufi Kalam
                                    </p>
                                    <h4 className="text-base font-serif text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                                        {(rel as any).canonicalTitle || rel.title}
                                    </h4>
                                    {rel.description && (
                                        <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                                            {rel.description}
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs text-neutral-500 group-hover:text-amber-400 mt-4 inline-block">
                                    Listen & Read Lyrics →
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
