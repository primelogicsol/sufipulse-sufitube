#!/usr/bin/env node
/**
 * SufiPulse USA organic distribution campaign compiler.
 *
 * Generates channel-specific, human-reviewable publishing queues from
 * full-length original YouTube releases. Does not publish, fabricate
 * engagement, message private accounts, or bypass platform restrictions.
 *
 * Usage:
 *   node scripts/distribution/build-organic-campaign.mjs --input .data/cms-releases.json --out ./distribution-output
 *   node scripts/distribution/build-organic-campaign.mjs --input /path/to/export.json --out ./distribution-output --days 30
 *
 * No dependencies beyond Node 20+.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const option = (key, fallback) => {
  const index = args.indexOf('--' + key);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const input = path.resolve(option('input', '.data/cms-releases.json'));
const out = path.resolve(option('out', 'distribution-output'));
const days = Math.max(7, Math.min(180, Number.parseInt(option('days', '30'), 10) || 30));
const start = option('start', new Date().toISOString().slice(0, 10));
const startDate = new Date(start + 'T12:00:00Z');
if (Number.isNaN(startDate.getTime())) throw Error('Invalid --start date. Use YYYY-MM-DD.');

const channels = [
  { id: 'facebook', cadence: 1, label: 'Facebook Page', limit: 1 },
  { id: 'instagram', cadence: 2, label: 'Instagram Business', limit: 1 },
  { id: 'threads', cadence: 2, label: 'Threads', limit: 1 },
  { id: 'whatsapp', cadence: 3, label: 'WhatsApp opt-in broadcast', limit: 1 },
  { id: 'community', cadence: 3, label: 'Approved community partner', limit: 1 },
];
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const raw = JSON.parse(fs.readFileSync(input, 'utf8'));
const releases = Array.isArray(raw) ? raw : Array.isArray(raw.releases) ? raw.releases :
  Array.isArray(raw.data?.releases) ? raw.data.releases : Array.isArray(raw.items) ? raw.items : [];
if (!releases.length) {
  console.error('No releases found. Provide an exported JSON array or an object containing releases, data.releases, or items.');
  process.exit(2);
}
const extracted = [];
const seen = new Set();
for (const r of releases) {
  if (!r || typeof r !== 'object') continue;
  const state = clean(r.status || 'published').toLowerCase();
  if (state !== 'published' && state !== 'public') continue;
  const title = clean(r.title || r.name);
  const possible = clean(r.youtubeId || r.youtube_video_id || r.videoId || r.youtubeDetails?.videoId || r.youtubeUrl || r.youtube_url || r.url);
  const match = possible.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/) || possible.match(/^([A-Za-z0-9_-]{11})$/);
  const id = match?.[1];
  if (!id || !title || seen.has(id)) continue;
  seen.add(id);
  const text = (title + ' ' + clean(r.description)).toLowerCase();
  const theme = /kashmir|koshur|kashmiri|jhelum|dal lake|ganderbal|noorani|hamdan|habba/i.test(text)
    ? 'Kashmir heritage' : /quran|allah|rabb|sajda|tawheed|sufi|ishq|rooh|faqeer/i.test(text)
      ? 'Mystical reflection' : 'Original music';
  extracted.push({ id, title, theme, url: 'https://www.youtube.com/watch?v=' + id });
}
if (!extracted.length) {
  console.error('No published releases with valid YouTube IDs. Export the live CMS with status, title, and youtubeId.');
  process.exit(2);
}
extracted.sort((a, b) => Number(b.theme === 'Kashmir heritage') - Number(a.theme === 'Kashmir heritage') || a.title.localeCompare(b.title));
const templates = {
  facebook: song => `Now listening: ${song.title}. A complete SufiPulse USA recording. Explore the full song and share your reflections: ${song.url}`,
  instagram: song => `SufiPulse USA | ${song.title}\nFull original recording on YouTube: ${song.url}\nOpen the channel link to listen. #SufiPulseUSA #SufiMusic`,
  threads: song => `${song.title} | A full-length SufiPulse USA recording about ${song.theme.toLowerCase()}. Listen: ${song.url}`,
  whatsapp: song => `SufiPulse USA has a full recording you may enjoy: ${song.title}\n${song.url}\nYou are receiving this because you opted in. Reply STOP to unsubscribe.`,
  community: song => `Suggested music feature for your community (share only if relevant): ${song.title}, a SufiPulse USA full-length recording. ${song.url}`,
};
const rows = [];
for (let day = 0; day < days; day++) {
  for (const channel of channels) {
    if (day % channel.cadence !== 0) continue;
    const date = new Date(startDate.getTime() + day * 86400000).toISOString().slice(0, 10);
    const index = (Math.floor(day / channel.cadence) + channels.indexOf(channel) * 7) % extracted.length;
    const song = extracted[index];
    rows.push({
      date,
      channel: channel.id,
      title: song.title,
      youtube_video_id: song.id,
      youtube_url: song.url,
      campaign: song.theme,
      copy: templates[channel.id](song),
      state: 'draft_requires_authorized_account',
      permission: channel.id === 'community' ? 'partner_approval_required' : channel.id === 'whatsapp' ? 'recipient_opt_in_required' : 'owned_account_required',
    });
  }
}
const quote = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
const columns = Object.keys(rows[0]);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'organic-publishing-queue.csv'), columns.join(',') + '\n' + rows.map(row => columns.map(key => quote(row[key])).join(',')).join('\n') + '\n');
fs.writeFileSync(path.join(out, 'campaign-summary.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  catalog: path.basename(input),
  inputReleases: releases.length,
  validPublishedYouTubeSongs: extracted.length,
  days,
  plannedPosts: rows.length,
  perChannel: Object.fromEntries(channels.map(channel => [channel.id, rows.filter(r => r.channel === channel.id).length])),
  compliance: 'Draft queue only. No API posting or unsolicited messaging. Requires OAuth authorization, recipient opt-in when applicable, and per-platform API checks.',
}, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'normalized-full-song-catalog.json'), JSON.stringify(extracted, null, 2) + '\n');
console.log(JSON.stringify({ songs: extracted.length, plannedPosts: rows.length, output: out }, null, 2));
