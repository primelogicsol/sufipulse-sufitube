import type { CMSRelease } from './cms-storage';

interface SocialShareKit {
  generatedAt: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  telegram: string;
}

export function generateSocialShareKit(release: CMSRelease): SocialShareKit {
  const title = release.title || 'New Kalam';
  const ytUrl = release.youtubePlaylistId
    ? `https://www.youtube.com/watch?v=${release.youtubeId}&list=${release.youtubePlaylistId}`
    : `https://www.youtube.com/watch?v=${release.youtubeId}`;

  const vocalistName = release.vocalist?.name || '';
  const writerName = release.writer?.name || '';

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

  return {
    generatedAt: new Date().toISOString(),
    whatsapp,
    facebook,
    instagram,
    twitter,
    linkedin,
    telegram,
  };
}
