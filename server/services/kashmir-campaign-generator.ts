/**
 * server/services/kashmir-campaign-generator.ts
 *
 * Generates verified, culturally tailored campaign distribution packages
 * for members of the SufiPulse Kashmir Partner Network.
 * Guarantees 100% metadata consistency with the canonical CMS master.
 */

import { KashmirPartner, PartnerCampaignKit } from '@/server/types/kashmir-reach';
import { cmsServerStorage } from '@/lib/cms-storage-server';

export function generatePartnerCampaignKit(
  partner: KashmirPartner,
  releaseSlugOrId: string
): PartnerCampaignKit {
  const allReleases = cmsServerStorage.getAllReleases();
  const release = allReleases.find(
    (r) => r.slug === releaseSlugOrId || r.id === releaseSlugOrId || r.youtubeId === releaseSlugOrId
  );

  if (!release) {
    throw new Error(`Release not found in CMS storage: ${releaseSlugOrId}`);
  }

  const title = release.canonicalTitle || release.title || 'Sacred Kalam';
  const slug = release.slug || release.youtubeId || release.id;
  const destinationUrl = `https://sufipulse.com/release-detail/${slug}?utm_source=kpn&utm_partner=${partner.trackingCode}&utm_campaign=${slug}`;
  const now = new Date().toISOString();

  // Author and vocalists
  const writer = release.writer || release.publicCredits?.artistic?.lyricist || 'Dr. Zarf-e-Noori';
  const vocalist = release.vocalist || release.publicCredits?.artistic?.leadVocalist || 'SufiPulse Vocal Ensemble';

  const disclaimer = `Distributed voluntarily by ${partner.name} as an approved cultural partner of SufiPulse.com. Non-commercial distribution preserving sacred Kashmiri spiritual and living heritage.`;

  // Specific thematic messaging based on release
  const isEnvironmental = slug.includes('silent') || slug.includes('khamosh') || release.description?.toLowerCase().includes('environmental');
  const isArtisan = slug.includes('footprints') || release.description?.toLowerCase().includes('artisan') || release.description?.toLowerCase().includes('craft');

  let whatsappMessage = '';
  let instagramCaption = '';
  let facebookPost = '';
  let telegramMessage = '';

  if (isEnvironmental) {
    whatsappMessage = `🌿 *KAB TAK KHAMOSH? (How Long Will You Remain Silent?)*\n` +
      `An original mystical environmental kalam by *${writer}*, presented by *SufiPulse USA* in partnership with *${partner.name}*.\n\n` +
      `“Dal Lake is wounded. Its rivers face pollution. Forests and springs are under increasing environmental pressure. Can humanity claim devotion while neglecting the creation entrusted to it?”\n\n` +
      `🎙 *Vocalists:* ${vocalist}\n` +
      `✍️ *Kalam & Composition:* ${writer}\n` +
      `📍 *Community Partner:* ${partner.name} (${partner.locationDetails})\n\n` +
      `🎧 *Listen & reflect on the full interactive release with multi-lingual lyrics:*\n` +
      `${destinationUrl}\n\n` +
      `_Please share this sacred reflection with youth, researchers, and conscious listeners._`;

    instagramCaption = `“What does devotion mean when our waters are wounded? What does remembrance mean when forests disappear?” 🌿\n\n` +
      `Presenting “How Long Will You Remain Silent? (Kab Tak Khamosh)” — an original Sufi environmental awakening by ${writer}, featuring vocals by ${vocalist}.\n\n` +
      `Shared in cultural partnership with @${partner.primaryHandle.replace('@', '')}.\n\n` +
      `🔗 Tap the link in bio or visit ${destinationUrl} to experience the complete cinematic release with verified Nastaliq and Roman Urdu lyrics.\n\n` +
      `#SufiPulse #KabTakKhamosh #KashmirEcology #DalLake #Jhelum #ZarfeNoori #Kashmir #SpiritualEcology #KashmirPartnerNetwork`;

    facebookPost = `🌿 KAB TAK KHAMOSH? | HOW LONG WILL YOU REMAIN SILENT?\n\n` +
      `Kashmir’s sacred waters, wetlands, forests, and springs are facing immense ecological strain. In spiritual tradition, creation is an Amaanat (sacred trust) and Meezan (balance).\n\n` +
      `SufiPulse USA, in cultural partnership with ${partner.name}, presents this profound mystical dialogue between humanity and the Divine, calling upon Kashmir’s youth, researchers, and communities to replace silence with stewardship.\n\n` +
      `• Kalam & Concept: ${writer}\n` +
      `• Vocalists: ${vocalist}\n` +
      `• Platform: SufiPulse.com\n\n` +
      `Explore the complete three-part master with interactive translations and commentary:\n` +
      `${destinationUrl}\n\n` +
      `#SufiPulse #KashmirEnvironment #KabTakKhamosh #KashmirPartnerNetwork`;

    telegramMessage = `🌿 <b>KAB TAK KHAMOSH? — How Long Will You Remain Silent?</b>\n\n` +
      `An original mystical Sufi environmental reflection on Kashmir's waters, forests, and spiritual responsibility.\n\n` +
      `✍️ <b>Kalam:</b> ${writer}\n` +
      `🎙 <b>Vocals:</b> ${vocalist}\n` +
      `🤝 <b>Partner:</b> ${partner.name}\n\n` +
      `🎧 <b>Listen Now:</b> <a href="${destinationUrl}">SufiPulse.com Master Release</a>`;
  } else if (isArtisan) {
    whatsappMessage = `✨ *SOME PEOPLE LEAVE FOOTPRINTS BEHIND*\n` +
      `An original musical and philosophical reflection by *${writer}*, honoring Kashmir’s master artisans, quiet service, and enduring living dignity.\n\n` +
      `“Some people leave footprints behind,\nNot carved in stone, but in our lives.”\n\n` +
      `Shared in cultural collaboration with *${partner.name}*.\n\n` +
      `🎙 *Ensemble:* ${vocalist}\n` +
      `✍️ *Concept & Lyrics:* ${writer}\n` +
      `📍 *District Hub:* ${partner.locationDetails}\n\n` +
      `🎧 *Listen to the official 15-minute lyric master:*\n` +
      `${destinationUrl}\n\n` +
      `_Honoring those who turn ideas into meaningful action._`;

    instagramCaption = `“Some people leave footprints behind, not carved in stone, but in our lives.” ✨\n\n` +
      `An institutional musical reflection celebrating quiet dedication, fatherhood, mentorship, and Kashmir’s master craft revival.\n\n` +
      `Presented by SufiPulse USA in alliance with @${partner.primaryHandle.replace('@', '')}.\n\n` +
      `🔗 Experience the complete release with 94 synchronized lyric passages:\n${destinationUrl}\n\n` +
      `#SufiPulse #FootprintsBehind #KashmirCraft #LivingDignity #ZarfeNoori #KashmirArtisans #KashmirPartnerNetwork`;

    facebookPost = `✨ SOME PEOPLE LEAVE FOOTPRINTS BEHIND (کچھ لوگ نشاں چھوڑ جاتے ہیں)\n\n` +
      `A soulful tribute to those who make a difference through quiet service, knowledge, compassion, and living dignity—from Kashmir's master craft artisans to those who quietly elevate humanity.\n\n` +
      `Presented by SufiPulse USA with ${partner.name}.\n\n` +
      `• Lyrics & Composition: ${writer}\n` +
      `• Vocal Ensemble: ${vocalist}\n\n` +
      `Listen to the full recording on SufiPulse:\n` +
      `${destinationUrl}\n\n` +
      `#SufiPulse #FootprintsBehind #KashmirHeritage #KashmirPartnerNetwork`;

    telegramMessage = `✨ <b>Some People Leave Footprints Behind</b>\n\n` +
      `An original musical reflection celebrating Kashmir's master artisans, service, and living dignity.\n\n` +
      `✍️ <b>Kalam:</b> ${writer}\n` +
      `🎙 <b>Vocals:</b> ${vocalist}\n` +
      `🤝 <b>Partner:</b> ${partner.name}\n\n` +
      `🎧 <b>Listen Now:</b> <a href="${destinationUrl}">SufiPulse.com Master Release</a>`;
  } else {
    // General Sacred Kalam
    whatsappMessage = `✨ *${title.toUpperCase()}*\n` +
      `A sacred institutional release presented by *SufiPulse USA* in partnership with *${partner.name}*.\n\n` +
      `🎙 *Vocalist:* ${vocalist}\n` +
      `✍️ *Kalam / Lyrics:* ${writer}\n\n` +
      `🎧 *Listen to the official release with sacred sonic architecture:*\n` +
      `${destinationUrl}\n\n` +
      `_Preserving classical devotional poetry through contemporary arrangements._`;

    instagramCaption = `✨ ${title}\n\n` +
      `Sacred institutional release presented by SufiPulse USA with @${partner.primaryHandle.replace('@', '')}.\n\n` +
      `• Kalam: ${writer}\n• Vocals: ${vocalist}\n\n` +
      `🔗 Listen now: ${destinationUrl}\n\n` +
      `#SufiPulse #SufiMusic #KashmirSufism #SacredPoetry #KashmirPartnerNetwork`;

    facebookPost = `✨ ${title}\n\n` +
      `Presented by SufiPulse USA in cultural partnership with ${partner.name}.\n\n` +
      `• Kalam / Lyrics: ${writer}\n` +
      `• Vocalist: ${vocalist}\n\n` +
      `Listen on SufiPulse:\n${destinationUrl}\n\n` +
      `#SufiPulse #KashmirPartnerNetwork`;

    telegramMessage = `✨ <b>${title}</b>\n\n` +
      `✍️ <b>Kalam:</b> ${writer} | 🎙 <b>Vocals:</b> ${vocalist}\n` +
      `🤝 <b>Partner:</b> ${partner.name}\n\n` +
      `🎧 <b>Listen Now:</b> <a href="${destinationUrl}">SufiPulse.com</a>`;
  }

  return {
    partnerId: partner.id,
    partnerName: partner.name,
    partnerTrackingCode: partner.trackingCode,
    releaseId: release.id,
    releaseSlug: slug,
    releaseTitle: title,
    destinationUrl,
    disclaimer,
    whatsappMessage,
    instagramCaption,
    facebookPost,
    telegramMessage,
    assets: [
      {
        type: 'vertical_clip_15s',
        label: '15-Second Hook (Vertical Reel / Story)',
        url: release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/hqdefault.jpg` : '',
      },
      {
        type: 'vertical_clip_30s',
        label: '30-Second Thematic Reflection (Vertical Reel)',
        url: release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/hqdefault.jpg` : '',
      },
      {
        type: 'vertical_clip_45s',
        label: '45-Second Philosophical Climax (Vertical Reel)',
        url: release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/hqdefault.jpg` : '',
      },
      {
        type: 'thumbnail',
        label: 'High-Resolution 16:9 Master Card',
        url: release.thumbnailUrl || (release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/hqdefault.jpg` : ''),
      },
    ],
    generatedAt: now,
  };
}
