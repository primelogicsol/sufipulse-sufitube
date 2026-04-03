import { NextRequest, NextResponse } from 'next/server';

// Language code mapping: our internal codes → Google Translate codes
const LANG_CODE_MAP: Record<string, string> = {
  'en': 'en',
  'ur': 'ur',
  'ar': 'ar',
  'fa': 'fa',
  'hi': 'hi',
  'pa': 'pa',
  'tr': 'tr',
  'sd': 'sd',
  'skr': 'ur', // Saraiki fallback to Urdu script
  'bal': 'ur', // Balochi fallback — no direct support
  'ps': 'ps',
  'ks': 'ur', // Kashmiri fallback — limited support
  'bn': 'bn',
  'gu': 'gu',
  'mr': 'mr',
  'ta': 'ta',
  'en-rom': 'en', // Roman transliteration — translate as English
};

function resolveGoogleLang(code: string): string {
  return LANG_CODE_MAP[code] ?? code;
}

async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const sl = resolveGoogleLang(sourceLang);
  const tl = resolveGoogleLang(targetLang);

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  });

  if (!res.ok) {
    throw new Error(`Translation API error: ${res.status}`);
  }

  const data = await res.json();

  // Google Translate response shape: [[["translated", "source", ...], ...], ...]
  const translated = (data[0] as Array<[string, string]>)
    .map((segment) => segment[0])
    .join('');

  return translated;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      texts: string[];
      sourceLang: string;
      targetLang: string;
      tone?: string;
    };

    const { texts, sourceLang, targetLang } = body;

    if (!Array.isArray(texts) || !sourceLang || !targetLang) {
      return NextResponse.json({ error: 'texts[], sourceLang, targetLang are required' }, { status: 400 });
    }

    if (sourceLang === targetLang) {
      return NextResponse.json({ translations: texts });
    }

    // Translate in small batches to avoid rate limits
    const BATCH_SIZE = 5;
    const results: string[] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((text) =>
          text.trim()
            ? translateText(text, sourceLang, targetLang)
            : Promise.resolve('')
        )
      );
      results.push(...batchResults);
    }

    return NextResponse.json({ translations: results });
  } catch (err) {
    console.error('[/api/translate]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Translation failed' },
      { status: 500 }
    );
  }
}
