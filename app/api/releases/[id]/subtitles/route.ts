import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

const toSrtTime = (vttTime: string) => vttTime.replace('.', ',');

const parseMs = (time: string): number => {
  // Accept HH:MM:SS.mmm
  const [hh, mm, ssMs] = time.split(':');
  const [ss, ms = '0'] = (ssMs || '0').split('.');
  return (
    Number(hh || 0) * 3600000 +
    Number(mm || 0) * 60000 +
    Number(ss || 0) * 1000 +
    Number((ms + '000').slice(0, 3))
  );
};

const toVtt = (items: Array<{ start: string; end: string; text: string }>) => {
  const body = items
    .map((item) => `${item.start} --> ${item.end}\n${item.text || ''}`)
    .join('\n\n');
  return `WEBVTT\n\n${body}`;
};

const toSrt = (items: Array<{ start: string; end: string; text: string }>) => {
  return items
    .map((item, idx) => `${idx + 1}\n${toSrtTime(item.start)} --> ${toSrtTime(item.end)}\n${item.text || ''}`)
    .join('\n\n');
};

const toAssTime = (time: string) => {
  const [hh = '00', mm = '00', ssMs = '00.000'] = (time || '').split(':');
  const [ss = '00', ms = '000'] = ssMs.split('.');
  return `${Number(hh)}:${String(Number(mm)).padStart(2, '0')}:${String(Number(ss)).padStart(2, '0')}.${String(Number(ms)).padStart(2, '0')}`;
};

const cssHexToAssColor = (value?: string, alpha = '00') => {
  const raw = String(value || '').trim();
  if (!raw) return `&H${alpha}FFFFFF`;
  if (/^&?H[0-9A-Fa-f]{8}$/.test(raw)) {
    return raw.startsWith('&') ? raw : `&${raw}`;
  }

  const hex = raw.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return `&H${alpha}FFFFFF`;

  const rr = hex.slice(0, 2).toUpperCase();
  const gg = hex.slice(2, 4).toUpperCase();
  const bb = hex.slice(4, 6).toUpperCase();
  return `&H${alpha}${bb}${gg}${rr}`;
};

const escapeAssText = (text: string) => {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/\n/g, '\\N')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
};

const parseKaraokeDurationsMs = (value: unknown): number[] => {
  if (typeof value !== 'string') return [];
  return value
    .split(/[;,\s]+/)
    .map((part) => Number(part))
    .filter((num) => Number.isFinite(num) && num > 0);
};

const buildKaraokeText = (
  text: string,
  start: string,
  end: string,
  effect: 'k' | 'kf' | 'ko',
  durationsMsRaw?: unknown,
): string => {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return '';
  }

  const totalMs = Math.max(10, parseMs(end) - parseMs(start));
  const totalCs = Math.max(1, Math.round(totalMs / 10));

  let durationsCs: number[] = [];
  const providedMs = parseKaraokeDurationsMs(durationsMsRaw);

  if (providedMs.length === words.length) {
    durationsCs = providedMs.map((ms) => Math.max(1, Math.round(ms / 10)));
  } else {
    const base = Math.floor(totalCs / words.length);
    const remainder = totalCs - base * words.length;
    durationsCs = words.map((_, index) => Math.max(1, base + (index < remainder ? 1 : 0)));
  }

  const assignedTotal = durationsCs.reduce((sum, value) => sum + value, 0);
  if (assignedTotal !== totalCs) {
    durationsCs[durationsCs.length - 1] = Math.max(1, durationsCs[durationsCs.length - 1] + (totalCs - assignedTotal));
  }

  return words
    .map((word, index) => `{\\${effect}${durationsCs[index]}}${escapeAssText(word)}`)
    .join(' ');
};

const toAss = (
  items: Array<{ id: string; cueNumber: number; start: string; end: string; text: string }>,
  styleLookup?: Record<number, string>,
  stylePacks?: Record<string, any>,
  cueMetadata?: Record<string, any>
) => {
  const packs = stylePacks && Object.keys(stylePacks).length
    ? stylePacks
    : {
        Mystic_Default: {
          fontFamily: 'Arial',
          fontSize: 42,
          primaryColor: '#FFFFFF',
          secondaryColor: '#FFFF00',
          outlineColor: '#202020',
          backColor: '#000000',
          bold: true,
          italic: false,
          outline: 2,
          shadow: 0,
          alignment: 2,
          marginL: 40,
          marginR: 40,
          marginV: 28,
        },
      };

  const styleLines = Object.entries(packs).map(([styleName, styleRaw]) => {
    const style = styleRaw || {};
    return [
      `Style: ${styleName}`,
      style.fontFamily || 'Arial',
      Number(style.fontSize || 42),
      cssHexToAssColor(style.primaryColor, '00'),
      cssHexToAssColor(style.secondaryColor, '00'),
      cssHexToAssColor(style.outlineColor, '00'),
      cssHexToAssColor(style.backColor, '64'),
      style.bold ? -1 : 0,
      style.italic ? -1 : 0,
      0,
      0,
      100,
      100,
      0,
      0,
      1,
      Number(style.outline || 2),
      Number(style.shadow || 0),
      Number(style.alignment || 2),
      Number(style.marginL || 40),
      Number(style.marginR || 40),
      Number(style.marginV || 28),
      1,
    ].join(',');
  });

  const header = `[Script Info]\nTitle: SufiPulse Subtitle Export\nScriptType: v4.00+\nWrapStyle: 0\nScaledBorderAndShadow: yes\nPlayResX: 1920\nPlayResY: 1080\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\n${styleLines.join('\n')}\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text`;

  const lines = items.map((item, idx) => {
    const metadata = cueMetadata?.[item.id] || {};
    const style = styleLookup?.[idx + 1] || metadata.styleName || 'Mystic_Default';

    const tags: string[] = [];
    const alignment = Number(metadata.alignment);
    if (alignment >= 1 && alignment <= 9) {
      tags.push(`\\an${alignment}`);
    }

    if (Number.isFinite(metadata.positionX) && Number.isFinite(metadata.positionY)) {
      const px = Math.max(0, Math.min(100, Number(metadata.positionX)));
      const py = Math.max(0, Math.min(100, Number(metadata.positionY)));
      const assX = Math.round((px / 100) * 1920);
      const assY = Math.round((py / 100) * 1080);
      tags.push(`\\pos(${assX},${assY})`);
    }

    const karaokeEffectRaw = String(metadata.karaokeEffect || '').toLowerCase();
    const karaokeEffect = ['k', 'kf', 'ko'].includes(karaokeEffectRaw)
      ? (karaokeEffectRaw as 'k' | 'kf' | 'ko')
      : null;

    const baseText = karaokeEffect
      ? buildKaraokeText(item.text || '', item.start, item.end, karaokeEffect, metadata.karaokeDurationsMs)
      : escapeAssText(item.text || '');

    const prefix = tags.length ? `{${tags.join('')}}` : '';
    const text = `${prefix}${baseText}`;
    const marginL = Number.isFinite(metadata.marginL) ? Number(metadata.marginL) : 0;
    const marginR = Number.isFinite(metadata.marginR) ? Number(metadata.marginR) : 0;
    const marginV = Number.isFinite(metadata.marginV) ? Number(metadata.marginV) : 0;
    return `Dialogue: 0,${toAssTime(item.start)},${toAssTime(item.end)},${style},,${marginL},${marginR},${marginV},,${text}`;
  });

  return `${header}\n${lines.join('\n')}`;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  try {
    const release = cmsServerStorage.getRelease(id);
    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const language = searchParams.get('lang') || release.defaultLanguage || 'en';

    const cues = (release.subtitleCues || [])
      .filter((cue) => cue.active !== false)
      .sort((a, b) => {
        if (a.cueNumber !== b.cueNumber) return a.cueNumber - b.cueNumber;
        return parseMs(a.startTime) - parseMs(b.startTime);
      });

    const languageMap = release.subtitleTranslations?.[language] || {};

    const items = cues.map((cue) => ({
      id: cue.id,
      cueNumber: cue.cueNumber,
      start: cue.startTime,
      end: cue.endTime,
      text: languageMap[cue.id] || '',
    }));

    const cueMetadata = release.subtitleCueMetadata || {};
    const stylePacks = release.subtitleStylePacks || {};
    const styleLookup: Record<number, string> = {};
    items.forEach((item) => {
      const styleName = cueMetadata[item.id]?.styleName;
      if (styleName) {
        styleLookup[item.cueNumber] = styleName;
      }
    });

    if (format === 'vtt') {
      return new NextResponse(toVtt(items), {
        status: 200,
        headers: {
          'Content-Type': 'text/vtt; charset=utf-8',
          'Content-Disposition': `attachment; filename="${release.slug || id}-${language}.vtt"`,
        },
      });
    }

    if (format === 'srt') {
      return new NextResponse(toSrt(items), {
        status: 200,
        headers: {
          'Content-Type': 'application/x-subrip; charset=utf-8',
          'Content-Disposition': `attachment; filename="${release.slug || id}-${language}.srt"`,
        },
      });
    }

    if (format === 'ass') {
      return new NextResponse(toAss(items, styleLookup, stylePacks, cueMetadata), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${release.slug || id}-${language}.ass"`,
        },
      });
    }

    return NextResponse.json({
      releaseId: release.id,
      slug: release.slug,
      language,
      cueCount: items.length,
      items,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
