#!/usr/bin/env node
/**
 * SufiPulse integrated audience-development planner.
 * Builds an evidence-labelled discovery/partner/scheduling/analytics plan.
 * NO publishing or unsolicited messaging takes place.
 * Node 20+, no third-party dependencies.
 *
 * node scripts/distribution/run-growth-engine.mjs --out distribution-output --days 30
 * Optional real measured data: --analytics /path/to/youtube-report.json
 * Optional current release export: --catalog /path/to/releases.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2);
function opt(k, fallback) { const i = argv.indexOf('--' + k); return i === -1 ? fallback : argv[i + 1] || fallback; }
const outDir = path.resolve(opt('out', 'distribution-output'));
const days = Math.min(180, Math.max(7, Number(opt('days', 30)) || 30));
const start = opt('start', new Date().toISOString().slice(0, 10));
const date0 = new Date(start + 'T12:00:00Z');
if (Number.isNaN(date0.getTime())) throw Error('start must be YYYY-MM-DD');
const readJson = location => JSON.parse(fs.readFileSync(location, 'utf8'));
const seed = readJson(path.join(root, 'data/distribution/featured-recordings.json')).songs;
const prospects = readJson(path.join(root, 'data/distribution/partner-prospects.json')).partners;
let songs = seed.map(s => ({...s, source: 'verified_seed', url: 'https://www.youtube.com/watch?v=' + s.id}));
const catalog = opt('catalog', '');
if (catalog) {
  const data = readJson(path.resolve(catalog));
  const rows = Array.isArray(data) ? data : data.releases ?? data.data?.releases ?? data.items ?? [];
  if (!Array.isArray(rows)) throw Error('Catalog must contain an array of releases');
  const seen = new Set(songs.map(s => s.id));
  for (const row of rows) {
    const state = String(row.status || '').toLowerCase();
    if (state !== 'published' && state !== 'public') continue;
    const raw = String(row.youtubeId || row.youtube_video_id || row.videoId || row.youtube_url || '');
    const id = raw.match(/(?:[?&]v=|youtu\.be\/|\/shorts\/)([\w-]{11})/)?.[1] || raw.match(/^[\w-]{11}$/)?.[0];
    const title = String(row.title || '').trim();
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);
    const t = (title + ' ' + String(row.description || '')).toLowerCase();
    const topics = /kashmir|koshur|ganderbal|jhelum|hamdan|noorani/.test(t) ? ['kashmir','heritage'] : /sufi|rabb|ishq|rooh/.test(t) ? ['sufi','mysticism'] : ['music'];
    songs.push({ id,title,topics,source:'cms_export',url:'https://www.youtube.com/watch?v='+id });
  }
}
const metricsPath = opt('analytics', '');
let metrics = {asOf:'2026-11-13',source:'connected_youtube_baseline',views:360,relatedVideoViews:22,searchViews:94,srinagarReportedViews:13,limitations:'Baseline is not real-time and cannot deduplicate viewers'};
let videoMetrics = {};
if (metricsPath) {
  const imported = readJson(path.resolve(metricsPath));
  if (!Array.isArray(imported.videos)) throw Error('Analytics JSON requires videos array');
  metrics = {asOf:imported.asOf || null,source:'imported_report',limitations:'Metrics refer to reported YouTube analytics, not impressions or verified unique individuals'};
  for (const r of imported.videos) {
    if (!/^[\w-]{11}$/.test(String(r.id))) continue;
    videoMetrics[r.id] = {views:Number(r.views)||0,averageViewedPercent:Number(r.averageViewedPercent)||0,relatedVideoViews:Number(r.relatedVideoViews)||0};
  }
}
function relevance(song,partner) {
  const matching = (song.topics||[]).filter(topic => (partner.topics||[]).includes(topic)).length;
  return matching * 10 + (partner.region.toLowerCase().includes('kashmir') ? 5 : 0);
}
const choices = prospects.flatMap(partner => songs.map(song => ({
  partnerId:partner.id,partner:partner.name,website:partner.website,region:partner.region,videoId:song.id,title:song.title,
  relevanceScore:relevance(song,partner),status:'research_only_not_contacted',
  approvalRequired:true,source:partner.source
}))).filter(x=>x.relevanceScore>0).sort((a,b)=>b.relevanceScore-a.relevanceScore || a.partner.localeCompare(b.partner));
const scored = songs.map(song=>{
  const m = videoMetrics[song.id];
  const engagement = m ? Math.min(25,m.averageViewedPercent/4) + Math.min(20,Math.log1p(m.views)*3) : 0;
  const topic = song.topics.includes('kashmir') ? 25 : song.topics.includes('kashmiri') ? 20 : 10;
  const discovery = Math.min(15, Math.log1p(song.lifetimeViews||0)*1.5);
  return {...song,score:Number((topic+discovery+engagement).toFixed(1)),scoreBasis:m?'topic+measured video engagement':'topic+historical proxy only',viewsInWindow:m?.views??null};
}).sort((a,b)=>b.score-a.score);
const platforms=[
{id:'facebook',every:1,mode:'owned_oauth_required'},
{id:'instagram',every:2,mode:'professional_oauth_required'},
{id:'threads',every:2,mode:'owned_oauth_required'},
{id:'whatsapp',every:3,mode:'opted_in_recipient_required'},
{id:'community',every:3,mode:'partner_acceptance_required'}];
const queue=[];
for(let d=0;d<days;d++){
  const iso=new Date(date0.getTime()+d*86400000).toISOString().slice(0,10);
  for(const p of platforms){
    if(d%p.every)continue;
    const index=(Math.floor(d/p.every)*3+platforms.indexOf(p)*2)%scored.length;
    const song=scored[index];
    const copy=`${song.title} | SufiPulse USA. Listen to the complete original recording: ${song.url}`;
    queue.push({id:`${p.id}:${song.id}:${iso}`,date:iso,platform:p.id,mode:p.mode,videoId:song.id,title:song.title,url:song.url,copy,status:'draft_not_published',verifiedImpressions:0,verifiedListeners:null});
  }
}
function csv(rows){const cols=Object.keys(rows[0]||{});const q=x=>'"'+String(x??'').replace(/"/g,'""')+'"';return cols.join(',')+'\n'+rows.map(r=>cols.map(k=>q(r[k])).join(',')).join('\n')+'\n';}
function write(name,obj){fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,name),typeof obj==='string'?obj:JSON.stringify(obj,null,2)+'\n');}
write('discovery-opportunities.csv',csv(choices));
write('partner-registry.json', {count:prospects.length,partners:prospects});
write('distribution-queue.csv',csv(queue));
write('song-priorities.json', {method:'Transparent heuristic, not YouTube algorithm score',songs:scored});
write('measurement-baseline.json',{...metrics,targets:{verifiedAppearances:1000000,verifiedUniqueKashmiriListeners:1000000},verifiedAppearancesSoFar:0,verifiedUniqueListenersSoFar:null});
write('control-center.json',{createdAt:new Date().toISOString(),status:'planning_only_not_publishing',components:{discovery:'prepared',distribution:'draft_queue_only',partners:'research_only',website:'separate_pr_16',intelligence:'baseline_import',optimization:'ranked_transparently'},counts:{songs:scored.length,prospects:prospects.length,matches:choices.length,plannedDrafts:queue.length},nextGate:'Authorized platform API accounts; valid CMS export; verified analytics import',safety:{thirdPartyPosting:'disabled',automatedPlayback:'disabled',messageSending:'disabled'}});
console.log(JSON.stringify({output:outDir,songs:scored.length,prospects:prospects.length,matches:choices.length,plannedDrafts:queue.length,published:0},null,2));
