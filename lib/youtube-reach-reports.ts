import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { getYouTubeConnection } from './youtube-connection';
import { getYouTubeStudioLifetimeFunnel } from './youtube-studio-import';

/**
 * Official daily YouTube Reporting API thumbnail impression series.
 * Historical Studio lifetime figure is NEVER extrapolated across missing days.
 */
const JOB_ID = '754ed43e-9f2e-4ebf-9a6f-5ee6894d583f';
const JOB_TYPE = 'channel_reach_basic_a1';
const BASELINE_END = '2026-09-11';
const FIRST_ADDITIONAL_DAY = '2026-09-12';
const DATA_DIR = process.env.DATA_DIR || (fs.existsSync('/app/.data') ? '/app/.data' : path.join(process.cwd(), '.data'));
const FILE = path.join(DATA_DIR, 'youtube-reach-daily.json');
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

export type DailyReach = {
  reportId: string;
  startTime: string;
  endTime: string;
  createTime: string;
  impressions: number;
  clicked: number;
};
type ReachStore = { checkedAt?: string; days: Record<string, DailyReach>; lastError?: string };
export type ReachSummary = {
  source: 'youtube_reporting_api';
  jobId: string;
  baseline: number;
  baselineThrough: string;
  reportingDays: number;
  firstReportDay: string | null;
  lastReportDay: string | null;
  latestPeriodImpressions: number;
  missingDaysSinceBaseline: number;
  isLifetimeReconciled: boolean;
  verifiedLifetimeImpressions: number | null;
  checkedAt: string | null;
  lastError: string | null;
};

function load(): ReachStore {
  try {
    const store = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (store && typeof store.days === 'object' && store.days) return store;
  } catch {}
  return { days: {} };
}
function save(store: ReachStore) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temp = FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(temp, FILE);
}
function nextDay(day: string): string {
  const date = new Date(day + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
function csvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [], field = '', quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (quoted && csv[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      current.push(field); field = '';
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && csv[i + 1] === '\n') i++;
      current.push(field); field = '';
      if (current.some(v => v.trim() !== '')) rows.push(current);
      current = [];
    } else field += ch;
  }
  current.push(field);
  if (current.some(v => v.trim() !== '')) rows.push(current);
  if (quoted) throw new Error('Unclosed quoted CSV field');
  return rows;
}
function parseDailyReport(csv: string, report: {id:string;startTime:string;endTime:string;createTime:string}): { day: string; record: DailyReach } {
  const rows = csvRows(csv.replace(/^\uFEFF/, ''));
  const header = rows.shift()?.map(v => v.trim()) || [];
  const dayIndex = header.indexOf('date');
  const impressionsIndex = header.indexOf('video_thumbnail_impressions');
  const ctrIndex = header.indexOf('video_thumbnail_impressions_ctr');
  if (dayIndex < 0 || impressionsIndex < 0) throw new Error('Not a YouTube reach basic report');
  let day: string | null = null, impressions = 0, clicked = 0;
  for (const row of rows) {
    const value = row[dayIndex]?.trim();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
    if (!date) throw new Error('Invalid date in YouTube report');
    if (day !== null && day !== date) throw new Error('Unexpected multi-day report');
    day = date;
    const count = Number(row[impressionsIndex]);
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid impression count');
    impressions += count;
    if (ctrIndex >= 0) {
      const pct = Number(row[ctrIndex]);
      if (Number.isFinite(pct) && pct >= 0 && pct <= 100) clicked += count * pct / 100;
    }
  }
  // YouTube also publishes header-only reports when the channel had no activity.
  day ||= new Date(report.startTime).toISOString().slice(0,10);
  return { day, record: { reportId: report.id, startTime:report.startTime,endTime:report.endTime,createTime:report.createTime,impressions,clicked } };
}
export function getReachSummary(): ReachSummary {
  const store = load();
  const days = Object.keys(store.days).sort();
  const baseline = getYouTubeStudioLifetimeFunnel().impressions;
  let missingDays = 0;
  const last = days[days.length - 1];
  if (last && last >= FIRST_ADDITIONAL_DAY) {
    for (let cursor = FIRST_ADDITIONAL_DAY; cursor <= last; cursor = nextDay(cursor)) {
      if (!store.days[cursor]) missingDays++;
    }
  }
  const reconciled = !!last && last >= FIRST_ADDITIONAL_DAY && missingDays === 0;
  const recent = days.filter(day => day >= FIRST_ADDITIONAL_DAY);
  const additional = recent.reduce((sum, day) => sum + store.days[day].impressions, 0);
  return {
    source: 'youtube_reporting_api', jobId: JOB_ID, baseline, baselineThrough: BASELINE_END,
    reportingDays: days.length, firstReportDay: days[0] || null, lastReportDay: last || null,
    latestPeriodImpressions: additional, missingDaysSinceBaseline: missingDays,
    isLifetimeReconciled: reconciled,
    verifiedLifetimeImpressions: reconciled ? baseline + additional : null,
    checkedAt: store.checkedAt || null, lastError: store.lastError || null,
  };
}

/** Idempotent: one report per day, replacing previous data when YouTube backfills. */
export async function syncYouTubeReachReports(force = false): Promise<ReachSummary> {
  const store = load();
  const lastCheck = Date.parse(store.checkedAt || '');
  if (!force && Number.isFinite(lastCheck) && Date.now() - lastCheck < CHECK_INTERVAL_MS) return getReachSummary();
  try {
    const yt = await getYouTubeConnection();
    let pageToken = '', pages = 0;
    const latest = new Map<string,{id:string;startTime:string;endTime:string;createTime:string;downloadUrl:string}>();
    do {
      const url = new URL('https://youtubereporting.googleapis.com/v1/jobs/' + JOB_ID + '/reports');
      url.searchParams.set('pageSize', '100');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const res = await yt.fetch(url.toString(), {cache:'no-store'});
      if (!res.ok) throw new Error('YouTube reporting index HTTP ' + res.status);
      const json = await res.json();
      for (const item of json.reports || []) {
        if (!item.id || !item.startTime || !item.downloadUrl) continue;
        const key = item.startTime + '|' + item.endTime;
        const previous = latest.get(key);
        if (!previous || Date.parse(item.createTime) > Date.parse(previous.createTime)) latest.set(key,item);
      }
      pageToken = json.nextPageToken || '';
      if (++pages >= 8) break;
    } while (pageToken);
    const pending = [...latest.values()].filter(r => {
      const day = new Date(r.startTime).toISOString().slice(0,10);
      return !store.days[day] || store.days[day].reportId !== r.id;
    }).sort((a,b) => a.startTime.localeCompare(b.startTime));
    for (const report of pending.slice(0, 60)) {
      const u = new URL(report.downloadUrl);
      if (u.protocol !== 'https:' || !['youtubereporting.googleapis.com','www.googleapis.com','storage.googleapis.com'].includes(u.hostname)) throw new Error('Unexpected reporting download origin');
      const res = await yt.fetch(report.downloadUrl,{cache:'no-store'});
      if (!res.ok) throw new Error('YouTube report download HTTP ' + res.status);
      const raw = await res.text();
      const { day, record } = parseDailyReport(raw,report);
      const prev = store.days[day];
      if (!prev || Date.parse(record.createTime) >= Date.parse(prev.createTime)) store.days[day] = record;
    }
    store.checkedAt = new Date().toISOString();
    store.lastError = undefined;
    save(store);
  } catch (error) {
    store.checkedAt = new Date().toISOString();
    store.lastError = error instanceof Error ? error.message : 'YouTube Reporting API unavailable';
    try { save(store); } catch {}
    console.warn('[youtube-reach-reports]',store.lastError);
  }
  return getReachSummary();
}
