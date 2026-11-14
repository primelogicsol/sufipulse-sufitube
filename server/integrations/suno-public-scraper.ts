/**
 * server/integrations/suno-public-scraper.ts
 *
 * Scrapes public song metadata from Suno song pages (https://suno.com/song/[uuid])
 * Extracts: duration (e.g. 285.16s), title, poetry/prompt lyrics, and tags.
 */

export interface PublicSunoSongData {
  assetId: string;
  title?: string;
  durationSeconds: number;
  lyrics?: string;
  tags?: string;
  sourceUrl: string;
  imageUrl?: string;
}

export async function scrapePublicSunoSong(sunoUrlOrId: string): Promise<PublicSunoSongData | null> {
  const uuidMatch = sunoUrlOrId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  if (!uuidMatch) return null;
  const assetId = uuidMatch[0].toLowerCase();
  const pageUrl = `https://suno.com/song/${assetId}`;

  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ur;q=0.8,hi;q=0.7',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`[suno-public-scraper] Failed to fetch Suno page: ${res.status}`);
      return null;
    }

    const html = await res.text();

    // 1. Extract Duration (handles both escaped and unescaped JSON within HTML)
    let durationSeconds = 30.0;
    const durMatch = html.match(/\\?"duration\\?"\s*:\s*([0-9.]+)/i);
    if (durMatch && durMatch[1]) {
      const parsed = parseFloat(durMatch[1]);
      if (parsed > 0) durationSeconds = parsed;
    }

    // 2. Extract Title
    let title: string | undefined;
    const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i) || html.match(/name="twitter:title"\s+content="([^"]+)"/i);
    if (ogTitleMatch && ogTitleMatch[1] && !ogTitleMatch[1].toLowerCase().includes('suno')) {
      title = ogTitleMatch[1].trim();
    }

    // 3. Extract Tags
    let tags: string | undefined;
    const tagsMatch = html.match(/\\?"(?:display_tags|tags)\\?"\s*:\s*\\?"([^"\\]+)\\?"/i);
    if (tagsMatch && tagsMatch[1]) {
      tags = tagsMatch[1].trim();
    }

    // 4. Extract Prompt / Lyrics
    let lyrics: string | undefined;
    // Next.js streaming serialization stores large text chunks like: c5:T2f36,# कब तक ख़ामोश?...
    const promptChunkMatch = html.match(/[a-z0-9]+:T[0-9a-f]+,(#[^\n]+[\s\S]*?)(?=(?:\n[a-z0-9]+:|$))/i);
    if (promptChunkMatch && promptChunkMatch[1]) {
      lyrics = promptChunkMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
    } else {
      const promptMatch = html.match(/\\?"prompt\\?"\s*:\s*\\?"([^"\\]{20,})\\?"/i);
      if (promptMatch && promptMatch[1] && !promptMatch[1].startsWith('$')) {
        lyrics = promptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
      }
    }

    // If lyrics have a main heading (e.g. # कब तक ख़ामोश?), use that as a refined title if title is generic
    if (lyrics) {
      // Strip trailing Next.js streaming serialization metadata (e.g. 58:["$","$Lc4",... or </script>)
      const artifactIndex = lyrics.search(/\d+:\s*\[|\{"prefetched"|<\/script>|\$L[a-z0-9]+/i);
      if (artifactIndex !== -1) {
        lyrics = lyrics.slice(0, artifactIndex).trim();
      }

      const firstHeading = lyrics.match(/^#+\s*(.+)$/m);
      if (firstHeading && firstHeading[1]) {
        const candidate = firstHeading[1].trim();
        if (candidate.length > 2 && candidate.length < 120) {
          title = candidate;
        }
      }
    }

    // 5. Image URL
    let imageUrl: string | undefined;
    const imgMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);
    if (imgMatch && imgMatch[1]) {
      imageUrl = imgMatch[1].trim();
    }

    return {
      assetId,
      title,
      durationSeconds,
      lyrics,
      tags,
      sourceUrl: pageUrl,
      imageUrl,
    };
  } catch (err: any) {
    console.error(`[suno-public-scraper] Error scraping ${pageUrl}:`, err.message);
    return null;
  }
}
