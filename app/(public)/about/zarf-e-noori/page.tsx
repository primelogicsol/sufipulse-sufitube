"use client";

import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Feather, Heart, Briefcase, PenTool, Sparkles, User, Globe, Library, Music, BookOpen, Layers } from 'lucide-react';
import Image from 'next/image';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';

export default function ZarfENooriPage() {
    const philosophyThemes = [
        "Love", "Mercy", "Compassion", "Service", "Humility",
        "Self-discovery", "The journey of the soul", "The search for meaning", "Human unity", "Inner transformation"
    ];

    const professionalFields = [
        "Environmental Science", "Emergency Management", "Critical Infrastructure Resilience",
        "Geographic Information Systems (GIS)", "Remote Sensing", "Disaster Planning",
        "Software Development", "Knowledge Systems", "Institutional Capacity Building"
    ];

    const institutionalWork = [
        "SufiPulse", "Sufi Science Center", "Dr. Kumar Foundation USA",
        "Hamadan Craft Revival Foundation", "Prime Logic Solutions USA",
        "Additional cultural, educational, and community-driven initiatives"
    ];

    const sufiPulseFormats = [
        "Poetry", "Lyrics", "Musical compositions", "Devotional songs",
        "Reflective essays", "Spiritual commentary", "Contemporary Sufi narratives"
    ];

    return (
        <>
            <StudioHero 
                badge="Entity Authority"
                title="Dr. Zarf-e-Noori"
                mysticalName="The Literary Identity of Dr. Fayaz Ahmad Khan"
                description="The principal literary and creative identity within the SufiPulse ecosystem, exploring themes of spirituality, human experience, inner transformation, longing, love, and contemporary Sufi expression."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-5xl mx-auto">
                        <div className="grid md:grid-cols-12 gap-12 items-start">
                            <div className="md:col-span-5">
                                <div className="elite-card p-6 shadow-2xl relative group overflow-hidden">
                                    <div className="aspect-[4/5] rounded-[24px] overflow-hidden border-2 border-amber-400/20 shadow-[0_0_40px_rgba(212,175,55,0.1)] group-hover:border-amber-400/40 transition-all duration-700">
                                        <Image
                                            src="/dr-fayaz-photo.jpg"
                                            alt="Dr. Zarf-e-Noori / Dr. Fayaz Ahmad Khan"
                                            width={500}
                                            height={625}
                                            className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-1000"
                                        />
                                    </div>
                                    <div className="mt-6 text-center">
                                        <p className="text-white font-bold text-xl tracking-tight">Dr. Fayaz Ahmad Khan</p>
                                        <p className="text-amber-400 font-black uppercase tracking-[0.2em] text-[10px] mt-1">Real Person</p>
                                        <div className="my-3 flex justify-center">
                                            <div className="h-[1px] w-12 bg-white/10" />
                                        </div>
                                        <p className="text-white font-bold text-xl tracking-tight">Dr. Zarf-e-Noori</p>
                                        <p className="text-amber-400 font-black uppercase tracking-[0.2em] text-[10px] mt-1">Literary Identity / Pen Name</p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-7 space-y-8">
                                <StudioSectionHeader 
                                    title="Introduction"
                                    subtitle="Distinguishing professional work from creative expression"
                                />
                                <div className="space-y-6 text-neutral-400 text-lg leading-relaxed font-light">
                                    <p>
                                        <strong className="text-white font-medium">Dr. Zarf-e-Noori</strong> is the literary pen name of <strong className="text-white font-medium">Dr. Fayaz Ahmad Khan</strong>, a Kashmiri-American environmental scientist, technology entrepreneur, philanthropist, poet, lyricist, and founder of multiple educational, cultural, and humanitarian initiatives.
                                    </p>
                                    <p>
                                        While Dr. Fayaz Ahmad Khan is known professionally for his work in environmental science, critical infrastructure resilience, emergency planning, geographic information systems (GIS), technology development, and institutional leadership, he writes and creates under the literary identity of Dr. Zarf-e-Noori.
                                    </p>
                                    <p>
                                        Through this identity, he explores themes of spirituality, human experience, inner transformation, longing, love, self-discovery, and contemporary Sufi expression.
                                    </p>
                                </div>
                                <div className="bg-black/20 border-l-4 border-amber-400 p-6 rounded-r-2xl">
                                    <p className="text-white italic text-lg tracking-tight font-light">
                                        The purpose of the pen name is not to separate truth from identity, but to distinguish professional work from creative and contemplative expression.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <StudioSectionHeader 
                                    title="The Meaning of Zarf-e-Noori"
                                    subtitle="A vessel seeking light"
                                />
                                <div className="space-y-6">
                                    <div className="elite-card p-8 group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-amber-400/10 rounded-xl">
                                                <Heart className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white tracking-tight">Zarf</h3>
                                        </div>
                                        <p className="text-neutral-400 leading-relaxed font-light">
                                            Refers to capacity, receptivity, character, refinement, and the inner vessel capable of receiving knowledge, wisdom, and experience.
                                        </p>
                                    </div>
                                    <div className="elite-card p-8 group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-amber-400/10 rounded-xl">
                                                <Sparkles className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white tracking-tight">Noori</h3>
                                        </div>
                                        <p className="text-neutral-400 leading-relaxed font-light">
                                            Refers to light, illumination, enlightenment, and spiritual awareness.
                                        </p>
                                    </div>
                                    <div className="bg-amber-400/5 p-8 rounded-2xl border border-amber-400/20 text-center shadow-lg">
                                        <p className="text-amber-400/80 text-sm font-bold uppercase tracking-widest mb-3">Together, Zarf-e-Noori means:</p>
                                        <p className="text-white font-bold text-3xl tracking-tight">"A vessel seeking light."</p>
                                    </div>
                                    <p className="text-neutral-500 italic text-sm text-center px-4">
                                        The identity does not claim spiritual authority, sainthood, scholarship, or perfection. Rather, it reflects a continuing journey of learning, reflection, questioning, and personal growth.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-8">
                                <StudioSectionHeader 
                                    title="Why a Pen Name?"
                                    subtitle="A dedicated space for expression"
                                />
                                <div className="space-y-6 text-neutral-400 text-lg leading-relaxed font-light">
                                    <p>
                                        Throughout history, poets, writers, and thinkers have adopted literary identities to distinguish their creative voice from their professional responsibilities.
                                    </p>
                                    <p>
                                        For Dr. Fayaz Ahmad Khan, the identity of Dr. Zarf-e-Noori provides a dedicated space for:
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 my-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        {[
                                            "Poetry", "Lyrics", "Musical expression", 
                                            "Spiritual reflection", "Philosophical exploration", "Contemporary Sufi creativity"
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <PenTool className="w-4 h-4 text-amber-400/60" />
                                                <span className="text-white font-medium text-sm">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p>
                                        The pen name allows the work to stand on its own merit, independent of academic titles, professional achievements, or institutional affiliations. The emphasis remains on the ideas, emotions, experiences, and reflections being shared.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <StudioSectionHeader 
                                    title="Creative Philosophy"
                                    subtitle="Authentic expression over literary perfection"
                                />
                                <div className="space-y-6 text-neutral-400 text-lg leading-relaxed font-light">
                                    <div className="bg-black/20 border-l-4 border-amber-400 p-8 rounded-r-3xl mb-8 shadow-xl">
                                        <p className="text-white text-2xl leading-relaxed italic font-light tracking-tight">
                                            "Authentic expression is more important than literary perfection."
                                        </p>
                                    </div>
                                    <p>
                                        Many works published under this identity emerge from lived experience, reflection, observation, gratitude, struggle, hope, and spiritual inquiry.
                                    </p>
                                    <p>
                                        The objective is not academic interpretation of spirituality, but sincere engagement with the human condition.
                                    </p>
                                </div>

                                <div className="mt-8">
                                    <p className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-4">Recurring Themes</p>
                                    <div className="flex flex-wrap gap-2">
                                        {philosophyThemes.map((theme, i) => (
                                            <span key={i} className="text-[11px] font-black uppercase tracking-widest text-neutral-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-amber-400/30 hover:bg-white/10 transition-colors">
                                                {theme}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <StudioSectionHeader 
                                    title="Relationship with SufiPulse"
                                    subtitle="The principal literary identity"
                                />
                                <div className="elite-card p-10">
                                    <p className="text-neutral-300 text-lg leading-relaxed font-light mb-6">
                                        Dr. Zarf-e-Noori serves as the principal literary and creative identity within the <strong className="text-white">SufiPulse ecosystem</strong>.
                                    </p>
                                    <p className="text-neutral-400 text-base leading-relaxed font-light mb-8">
                                        Through SufiPulse, original works are published across multiple formats including:
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-8">
                                        {sufiPulseFormats.map((format, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                <span className="text-white text-sm font-medium">{format}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="pt-6 border-t border-white/10">
                                        <p className="text-neutral-400 text-sm italic">
                                            SufiPulse functions as a creative platform dedicated to authentic, original, and accessible expressions of spirituality, culture, music, and reflection.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Dual Identity Summary"
                            subtitle="Balancing professional excellence with contemplative creativity"
                            align="center"
                        />
                        
                        <div className="grid md:grid-cols-2 gap-8 mt-12">
                            <div className="elite-card p-10 hover:border-amber-400/30 transition-all group">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold text-white">Professional Background</h3>
                                    <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-amber-400/10 transition-colors">
                                        <Briefcase className="w-6 h-6 text-amber-400" />
                                    </div>
                                </div>
                                <p className="text-neutral-400 mb-8 font-light">
                                    Outside his literary work, Dr. Fayaz Ahmad Khan has built a career spanning science, technology, public service, and institutional development.
                                </p>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-white font-bold text-sm mb-3">Professional Fields:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {professionalFields.map((field, i) => (
                                                <span key={i} className="text-xs bg-black/40 text-neutral-300 px-3 py-1.5 rounded-md border border-white/5">{field}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-white font-bold text-sm mb-3">Institutional Founder:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {institutionalWork.map((work, i) => (
                                                <span key={i} className="text-xs bg-amber-400/5 text-amber-100/80 px-3 py-1.5 rounded-md border border-amber-400/10">{work}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="elite-card p-10 hover:border-amber-400/30 transition-all group">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold text-white">Poetry, Music & Expression</h3>
                                    <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-amber-400/10 transition-colors">
                                        <Music className="w-6 h-6 text-amber-400" />
                                    </div>
                                </div>
                                <div className="space-y-6 text-neutral-400 font-light leading-relaxed">
                                    <p>
                                        For Dr. Zarf-e-Noori, poetry and music are not professions. They are forms of reflection.
                                    </p>
                                    <p>
                                        Many of the works published under this identity are created during personal time, often emerging from moments of contemplation, observation, gratitude, longing, or spiritual curiosity.
                                    </p>
                                    <p>
                                        The intention is not commercial success, but meaningful expression.
                                    </p>
                                    <div className="bg-amber-400/10 p-5 rounded-xl border border-amber-400/20 mt-4">
                                        <p className="text-amber-100 italic text-sm">
                                            Through lyrics, melodies, and verse, the work seeks to connect timeless spiritual ideas with contemporary human experiences.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-4xl mx-auto">
                        <div className="elite-card p-12 text-center relative overflow-hidden group">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">
                                <Layers size={300} className="text-amber-400" />
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-3xl font-bold text-white mb-6">A Note to Readers and Listeners</h3>
                                <p className="text-neutral-300 text-lg leading-relaxed font-light max-w-2xl mx-auto mb-8">
                                    Dr. Zarf-e-Noori should not be viewed as a spiritual authority, religious institution, or academic school of thought. The identity represents a personal creative journey.
                                </p>
                                <p className="text-neutral-400 text-base leading-relaxed font-light max-w-2xl mx-auto mb-10">
                                    Readers and listeners are encouraged to engage with the work thoughtfully, reflect on its themes, and draw their own insights. If any value exists in these words, songs, or reflections, it belongs to the ideas themselves rather than to the individual who authored them.
                                </p>
                                
                                <div className="bg-black/30 p-8 rounded-2xl border border-white/5 max-w-3xl mx-auto mt-8">
                                    <p className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-4">Guiding Principle</p>
                                    <p className="text-white text-xl italic font-light tracking-tight">
                                        "The journey is not to become someone extraordinary. The journey is to become more sincere, more aware, and more human."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <style jsx global>{`
                .elite-card {
                    background: rgba(18, 18, 18, 0.4);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-radius: 32px;
                    box-shadow: 
                        0 20px 40px rgba(0,0,0,0.4),
                        inset 0 1px 1px rgba(255,255,255,0.02);
                }
            `}</style>
        </>
    );
}
