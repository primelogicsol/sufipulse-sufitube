"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CMSRelease } from "@/lib/cms-storage";

export default function ReleaseRecommendations({ currentId }: { currentId: string }) {
    const [nextUp, setNextUp] = useState<CMSRelease | null>(null);

    useEffect(() => {
        fetch(`/api/releases/${currentId}/next-up`)
            .then(res => res.json())
            .then(setNextUp)
            .catch(console.error);
    }, [currentId]);

    if (!nextUp) return null;

    return (
        <div className="mt-16 border-t border-neutral-800 pt-12 mb-16 space-y-12">
            
            <section>
                <h3 className="text-xl font-serif text-white mb-6 uppercase tracking-widest">Up Next</h3>
                <Link href={`/release-detail/${nextUp.slug}`} className="block group">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-primary-500/50 transition-colors flex items-center justify-between">
                        <div>
                            <p className="text-xs text-primary-400 font-semibold mb-2 tracking-wider">NEXT IN CONTINUOUS PLAY</p>
                            <h4 className="text-2xl font-serif text-white group-hover:text-primary-400 transition-colors">
                                {nextUp.title}
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

            <section>
                <h3 className="text-xl font-serif text-white mb-6 uppercase tracking-widest">Continue The Journey</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Placeholder for now until we have full journey graph endpoint */}
                    <div className="bg-neutral-900/50 rounded-lg p-6 animate-pulse">
                        <div className="h-4 bg-neutral-800 rounded w-1/4 mb-4"></div>
                        <div className="h-6 bg-neutral-800 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-neutral-800 rounded w-full"></div>
                    </div>
                </div>
            </section>
        </div>
    );
}
