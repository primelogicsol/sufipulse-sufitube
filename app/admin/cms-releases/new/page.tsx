"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AudioLines, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import DashboardLayout from '../../../components/layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

export default function NewCMSReleasePage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role?.includes('admin') ?? false;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [releaseDate, setReleaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveSlug = useMemo(() => slugTouched ? slug : slugify(title), [slug, slugTouched, title]);
  const canSubmit = title.trim().length >= 3 && effectiveSlug.length >= 3 && !submitting;

  useEffect(() => {
    if (user && !isAdmin) router.replace('/admin');
  }, [isAdmin, router, user]);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl px-6 py-10 text-sm text-white/60">Loading…</div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch('/api/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: effectiveSlug,
          description: description.trim(),
          releaseDate: releaseDate ? new Date(`${releaseDate}T00:00:00`).toISOString() : new Date().toISOString(),
          status: 'draft',
          visibility: 'private',
          format: 'audio',
          webOnly: true,
          source: 'studio_native',
          governanceOrigin: 'native_governed',
          canonicalStatus: 'verified',
          defaultLanguage: defaultLanguage.trim().toLowerCase() || 'en',
          availableLanguages: [defaultLanguage.trim().toLowerCase() || 'en'],
          youtubeId: '',
          youtubeUrl: '',
          durationSeconds: 0,
          durationFormatted: '0:00',
          viewCount: 0,
          likeCount: 0,
          enableLyrics: true,
          enableCommentary: true,
          enableSponsors: false,
          enableAdoption: true,
          enableCredits: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const details = data?.details ? ` ${JSON.stringify(data.details)}` : '';
        throw new Error(`${data?.error || `Create failed with HTTP ${response.status}`}${details}`);
      }

      if (!data?.id) throw new Error('Release was created but no canonical release ID was returned.');

      router.push(`/admin/cms-releases/${encodeURIComponent(data.id)}/audio-alignment`);
    } catch (err: any) {
      setError(String(err?.message || err || 'Release could not be created.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div>
          <Link href="/admin/cms-releases" className="mb-3 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to CMS Releases
          </Link>
          <h1 className="text-2xl font-semibold text-white">New Studio Release</h1>
          <p className="mt-1 text-sm text-white/60">
            Create the canonical SufiPulse release first. The private audio source, lyric alignment and temporary stream are linked in the next step; YouTube can be attached later without creating a second release.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
            <div>
              <div className="font-medium text-white">Safe production default</div>
              <p className="mt-1 text-sm leading-6 text-white/60">
                New Studio releases start as private drafts in audio-first mode. Creating this record does not publish audio, expose a provider, upload anything to YouTube, or save an audio file.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-6 flex items-center gap-2">
            <AudioLines className="h-5 w-5 text-amber-300" />
            <h2 className="font-medium text-white">Canonical release identity</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">Release title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Song title"
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">Public slug</span>
              <input
                value={effectiveSlug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
                placeholder="song-title"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-amber-400/50"
              />
              <span className="mt-1 block text-xs text-white/35">This stays stable when the final Canva/YouTube video is attached later.</span>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">Master language</span>
              <input
                value={defaultLanguage}
                onChange={(event) => setDefaultLanguage(event.target.value)}
                placeholder="en"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">Release date</span>
              <input
                type="date"
                value={releaseDate}
                onChange={(event) => setReleaseDate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">Description — optional</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                placeholder="Internal/editorial release description. This can be completed later."
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
              />
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/15 p-4 text-xs leading-5 text-white/50">
            Initial state: <span className="text-white/75">draft · private · audio · web-only · Studio native</span>. After creation you will be taken directly to the private audio/alignment workspace.
          </div>

          {error ? <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <Link href="/admin/cms-releases" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:text-white">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Creating…' : 'Create draft & link private audio'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
