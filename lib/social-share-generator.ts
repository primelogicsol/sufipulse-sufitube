import type { CMSRelease } from './cms-storage';
import { getWriterDisplayName, getVocalistDisplayName } from './cms-storage';

interface SocialShareKit {
  generatedAt: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  telegram: string;
  youtube: string;
}

export function generateSocialShareKit(release: CMSRelease): SocialShareKit {
  const title = release.title || 'New Kalam';
  const ytUrl = release.youtubePlaylistId
    ? `https://www.youtube.com/watch?v=${release.youtubeId}&list=${release.youtubePlaylistId}`
    : `https://www.youtube.com/watch?v=${release.youtubeId}`;

  const isFootprints =
    release.id?.includes('1794752884539') ||
    release.slug === 'footprints-behind' ||
    release.slug === 'some-people-leave-footprints-behind' ||
    /footprints behind|کچھ لوگ نشاں/i.test(title);

  if (isFootprints) {
    const footprintsMsg = [
      `SOME PEOPLE LEAVE FOOTPRINTS BEHIND`,
      ``,
      `Some make a difference once. Others make it their way of life, again and again.`,
      ``,
      `A soulful musical reflection on mountains, craftsmanship, fatherhood, guidance and lasting human legacy.`,
      ``,
      `An original SufiPulse USA release by Dr. Zarf-e-Noori.`,
      ``,
      `Watch the complete song:`,
      `${ytUrl}`,
      ``,
      `#SufiPulseUSA #KashmirCrafts #LifeAndLegacy`,
    ].join('\n');

    return {
      generatedAt: new Date().toISOString(),
      whatsapp: footprintsMsg,
      telegram: footprintsMsg,
      facebook: [
        `🎵 SOME PEOPLE LEAVE FOOTPRINTS BEHIND | SufiPulse USA`,
        ``,
        `Some make a difference once. Others make it their way of life, again and again.`,
        ``,
        `An original musical reflection honoring mountains, the living dignity of Kashmir's master artisans, fatherhood, and lasting human legacy.`,
        ``,
        `Written by Dr. Zarf-e-Noori · Dedicated in deep gratitude to Mahmood Ahmad Shah.`,
        ``,
        `▶️ Watch the complete song: ${ytUrl}`,
        ``,
        `#SufiPulseUSA #KashmirCrafts #KashmirArtisans #LifeAndLegacy`,
      ].join('\n'),
      instagram: [
        `SOME PEOPLE LEAVE FOOTPRINTS BEHIND`,
        ``,
        `"Some people leave footprints behind,`,
        `Not carved in stone, but into our lives."`,
        ``,
        `A soulful tribute to Kashmir's master artisans and silent guardians.`,
        ``,
        `🎵 Full song link in bio`,
        ``,
        `#SufiPulseUSA #KashmirArtisans #KashmirCrafts #LifeAndLegacy #Shorts`,
      ].join('\n'),
      twitter: `SOME PEOPLE LEAVE FOOTPRINTS BEHIND\n\nSome make a difference once. Others make it their way of life.\n\nHonoring Kashmir's artisans & lasting legacy.\n\n▶️ ${ytUrl}\n\n#SufiPulseUSA #KashmirCrafts`,
      linkedin: [
        `SOME PEOPLE LEAVE FOOTPRINTS BEHIND | SufiPulse USA`,
        ``,
        `What will remain of us when our footsteps fade? A mountain trail. A written page. A craftsman's livelihood. A life changed through guidance.`,
        ``,
        `Our original release celebrates the silent guardians whose work uplifts others. A tribute in gratitude to Mahmood Ahmad Shah for his leadership in safeguarding Kashmir's living craft traditions.`,
        ``,
        `▶️ Watch on YouTube: ${ytUrl}`,
        ``,
        `#SufiPulseUSA #KashmirArtisans #LivingCrafts #CulturalPreservation`,
      ].join('\n'),
      youtube: [
        `SOME PEOPLE LEAVE FOOTPRINTS BEHIND | SufiPulse USA`,
        ``,
        `An original musical reflection by Dr. Zarf-e-Noori celebrating Kashmir's master artisans, fatherhood, and lasting human legacy.`,
        ``,
        `▶️ Watch the full masterpiece: ${ytUrl}`,
        ``,
        `#SufiPulseUSA #KashmirArtisans #LifeAndLegacy`,
      ].join('\n'),
    };
  }

  const vocalistName = getVocalistDisplayName(release.vocalist) || '';
  const writerName = getWriterDisplayName(release.writer) || '';

  const byLine = [
    vocalistName ? `Vocals: ${vocalistName}` : '',
    writerName ? `Kalam: ${writerName}` : '',
  ].filter(Boolean).join(' · ');

  const coreHashtags = '#SufiMusic #Kalam #SufiPulse #IslamicMusic #DevotionalMusic';
  const instagramHashtags = [
    '#SufiMusic', '#Kalam', '#SufiPulse', '#IslamicMusic', '#DevotionalMusic',
    '#SufiPoetry', '#QawwaliMusic', '#SpiritualMusic', '#UrduPoetry',
    '#KashmiriMusic', '#SacredMusic', '#Mystic', '#Sufi',
  ].join(' ');

  const whatsapp = [
    `🌙 *"${title}"*`,
    byLine || null,
    `A sacred kalam — now live on YouTube with multilingual subtitles.`,
    ``,
    `▶️ ${ytUrl}`,
    ``,
    `Share with someone who loves Sufi music 🎵`,
    `${coreHashtags}`,
  ].filter(l => l !== null).join('\n');

  const facebook = [
    `🎵 New Release: "${title}"`,
    byLine ? byLine : null,
    ``,
    `We have published a new sacred kalam on SufiPulse — with multilingual captions in Urdu, Kashmiri, English and more.`,
    ``,
    `▶️ Watch on YouTube: ${ytUrl}`,
    ``,
    `Subscribe to SufiPulse for sacred music, poetry, and kalam from Kashmir and the Indian Subcontinent.`,
    ``,
    `${coreHashtags} #SufiPoetry #KashmiriMusic`,
  ].filter(l => l !== null).join('\n');

  const instagram = [
    `🌙 New Kalam: "${title}"`,
    byLine ? byLine : null,
    ``,
    `Sacred Sufi music — now live on YouTube`,
    `with multilingual subtitles.`,
    ``,
    `🎵 Link in bio`,
    ``,
    `.`,
    `.`,
    `.`,
    instagramHashtags,
  ].filter(l => l !== null).join('\n');

  // Twitter/X: keep tight — aim under 280 chars for the core message, hashtags as bonus
  const twitterCore = `🎵 "${title}" — Sacred Sufi kalam, now on YouTube.\n\n▶️ ${ytUrl}`;
  const twitterTags = `\n\n#SufiMusic #Kalam #SufiPulse`;
  const twitter = twitterCore.length + twitterTags.length <= 280
    ? twitterCore + twitterTags
    : twitterCore;

  const linkedin = [
    `We have published "${title}" — a sacred Sufi kalam — on YouTube through SufiPulse.`,
    byLine ? byLine : null,
    ``,
    `This release includes multilingual captions (Urdu, Kashmiri, English, Roman Urdu) and full spiritual commentary.`,
    ``,
    `▶️ ${ytUrl}`,
    ``,
    `SufiPulse is building a comprehensive archive of Sufi music and devotional poetry from Kashmir and the Indian Subcontinent.`,
    ``,
    `#SufiMusic #CulturalHeritage #SufiPulse #IslamicArts #DevotionalMusic #KashmiriCulture`,
  ].filter(l => l !== null).join('\n');

  const telegram = [
    `🌙 *New Release on SufiPulse*`,
    ``,
    `*"${title}"*`,
    byLine ? byLine : null,
    ``,
    `A sacred kalam — now live on YouTube with multilingual subtitles.`,
    ``,
    `▶️ ${ytUrl}`,
    ``,
    `Subscribe: https://www.youtube.com/@sufipulse/`,
    ``,
    `${coreHashtags}`,
  ].filter(l => l !== null).join('\n');

  const youtube = [
    `New Release: "${title}"`,
    byLine ? byLine : null,
    ``,
    `A sacred Sufi kalam — now available with multilingual subtitles.`,
    ``,
    `${coreHashtags} #SufiPoetry #KashmiriMusic`,
  ].filter(l => l !== null).join('\n');

  return {
    generatedAt: new Date().toISOString(),
    whatsapp,
    facebook,
    instagram,
    twitter,
    linkedin,
    telegram,
    youtube,
  };
}
