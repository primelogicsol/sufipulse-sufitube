import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kashmiri Sufi Music & Kalam | Full Songs | SufiPulse USA',
  description: 'Listen to complete Kashmiri and Kashmir-inspired Sufi music, mystical Urdu kalam, spiritual poetry, and recordings about the valley and its Sufi heritage from SufiPulse USA.',
  alternates: { canonical: 'https://sufipulse.com/kashmir' },
  openGraph: {
    title: 'Kashmiri Sufi Music & Kalam | SufiPulse USA',
    description: 'A curated listening journey through the full-length original recordings of SufiPulse USA.',
    url: 'https://sufipulse.com/kashmir',
    type: 'website',
  },
};

const collections = [
  {
    title: 'Kashmir and belonging',
    description: 'Original musical reflections on Kashmir, landscape, memory and belonging.',
    songs: [
      { title: 'Kashmir, Har Manzar Mein Tu', id: '8nmW-vJbwMA', note: 'Kashmir landscape and remembrance' },
      { title: 'Teri Mitti... Mera Kashmir', id: '3axIOaWesf0', note: 'A Sufi anthem for Kashmir’s soul' },
      { title: 'PANI GAWAH HAI | Kashmir Water Bears Witness', id: 'dXqkrpP-41I', note: 'Environmental responsibility through Sufi poetry' },
    ],
  },
  {
    title: 'Saints, seekers and spiritual heritage',
    description: 'Listen to original reflections associated with Kashmiri Sufi heritage.',
    songs: [
      { title: 'Kumar Ganderbal | Qalandar-e-Zaman', id: 'LMen31sMjMg', note: 'A tribute to a spiritual figure of Ganderbal' },
      { title: 'Sheikh! Sheikh! Noorani (RA)', id: 'hXAJUFwEuGk', note: 'A reflection on Sheikh Noor-ud-Din Noorani' },
      { title: 'Kemis Taani Chhu Aav Aav', id: 'D7hvqyQYJrk', note: 'Kashmiri-English Sufi kalam' },
    ],
  },
  {
    title: 'Mystical reflection',
    description: 'Full-length spiritual songs for contemplative listening.',
    songs: [
      { title: 'Ik Khamoshi, Tu Aur Main', id: 'Dbd0fhJty4A', note: 'Ishq, fanā and baqā' },
      { title: 'PEHCHAAN KHUD KO', id: 'Hc1TjcyZLnM', note: 'Self-knowledge and the inward path' },
    ],
  },
] as const;

export default function KashmirListeningPage() {
  const allSongs = collections.flatMap(section => section.songs);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Kashmiri Sufi Music & Kalam | SufiPulse USA',
    url: 'https://sufipulse.com/kashmir',
    description: 'A curated collection of full-length original SufiPulse USA recordings associated with Kashmir and mystical reflection.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: allSongs.map((song, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: song.title,
        url: `https://www.youtube.com/watch?v=${song.id}`,
      })),
    },
  };

  return (
    <main className="min-h-screen bg-[#0b1715] text-[#f6f1e7]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <a href="/" className="text-sm text-[#b9d3c8] underline underline-offset-4">SufiPulse USA home</a>
        <header className="mt-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-[#b9d3c8]">Listen to the complete recordings</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">Kashmiri Sufi Music &amp; Kalam</h1>
          <p className="mt-5 text-lg leading-relaxed text-[#d5ded8]">Music inspired by Kashmir’s heritage, landscape, saints, and the inward journey. Explore the original, full-length SufiPulse USA recordings, then continue listening on YouTube.</p>
          <a href="https://www.youtube.com/@SufiPulseUSA" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex rounded-md bg-[#e9c98e] px-5 py-3 font-semibold text-[#152820] hover:bg-[#f5dba9]">Visit the official YouTube channel</a>
        </header>
        {collections.map(section => (
          <section key={section.title} className="mt-16" aria-labelledby={section.title.replace(/[^a-z]+/gi,'-').toLowerCase()}>
            <h2 id={section.title.replace(/[^a-z]+/gi,'-').toLowerCase()} className="text-2xl font-semibold sm:text-3xl">{section.title}</h2>
            <p className="mt-2 max-w-2xl text-[#cad9d1]">{section.description}</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {section.songs.map(song => (
                <article key={song.id} className="overflow-hidden rounded-xl border border-[#345047] bg-[#162923]">
                  <a href={`https://www.youtube.com/watch?v=${song.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${song.title} on YouTube`}>
                    {/* Native thumbnail, never auto-play or fabricate video interactions. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://i.ytimg.com/vi/${song.id}/hqdefault.jpg`} alt={`Artwork for ${song.title}`} loading="lazy" className="aspect-video w-full object-cover" />
                  </a>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold">{song.title}</h3>
                    <p className="mt-2 text-sm text-[#cad9d1]">{song.note}</p>
                    <a className="mt-5 inline-block font-semibold text-[#e9c98e] underline underline-offset-4" href={`https://www.youtube.com/watch?v=${song.id}`} target="_blank" rel="noopener noreferrer">Listen to the full song on YouTube</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        <footer className="mt-16 border-t border-[#345047] pt-8 text-sm text-[#cad9d1]">Original recordings by SufiPulse USA. No automated views or autoplay. Explore more in the <a href="/releases" className="underline underline-offset-4">full release catalog</a>.</footer>
      </div>
    </main>
  );
}
