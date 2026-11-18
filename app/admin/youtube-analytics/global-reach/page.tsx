'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  TrendingUp,
  Activity,
  Globe,
  Eye,
  Clock,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Sliders,
  History,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type {
  GrowthEngineStore,
  MetricValues,
  ReconciliationRecord,
  AuditLogItem,
} from '@/lib/global-reach-growth-engine';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function GlobalReachAdminHub() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [growthStore, setGrowthStore] = useState<GrowthEngineStore | null>(null);
  const [verifiedMetrics, setVerifiedMetrics] = useState<MetricValues | null>(null);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [monthsInfo, setMonthsInfo] = useState<any>(null);
  const [rateBounds, setRateBounds] = useState<any>(null);

  // Form State
  const [enabled, setEnabled] = useState(true);
  const [baselineDate, setBaselineDate] = useState('2026-09-11');
  const [geographicCeiling, setGeographicCeiling] = useState(125);
  const [projectionHorizonMonths, setProjectionHorizonMonths] = useState(24);
  const [seed, setSeed] = useState(4242);
  const [baseRates, setBaseRates] = useState({
    views: 0.028,
    impressions: 0.035,
    watchHours: 0.022,
    geographies: 0.018,
  });

  const [showSchedule, setShowSchedule] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/youtube-analytics/global-reach', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setGrowthStore(data.growthStore);
        setVerifiedMetrics(data.verifiedMetrics);
        setReconciliation(data.reconciliation);
        setMonthsInfo(data.monthsInfo);
        setRateBounds(data.rateBounds);

        // Sync form state
        setEnabled(data.growthStore.enabled);
        setBaselineDate(data.growthStore.baseline?.date || '2026-09-11');
        setGeographicCeiling(data.growthStore.geographicCeiling || 125);
        setProjectionHorizonMonths(data.growthStore.projectionHorizonMonths || 24);
        setSeed(data.growthStore.seed || 4242);
        if (data.growthStore.baseRates) {
          setBaseRates(data.growthStore.baseRates);
        }
      }
    } catch (err: any) {
      setActionMsg({ text: `Failed to load settings: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveConfig = async (regenerate = false) => {
    setSaving(true);
    setActionMsg(null);
    try {
      const payload = {
        enabled,
        baselineDate,
        geographicCeiling: Number(geographicCeiling),
        projectionHorizonMonths: Number(projectionHorizonMonths),
        seed: Number(seed),
        baseRates: {
          views: Number(baseRates.views),
          impressions: Number(baseRates.impressions),
          watchHours: Number(baseRates.watchHours),
          geographies: Number(baseRates.geographies),
        },
        regenerateSchedule: regenerate,
      };

      const res = await fetch('/api/admin/youtube-analytics/global-reach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg({
          text: regenerate
            ? 'Configuration saved & 24-month deterministic schedule regenerated.'
            : 'Configuration saved successfully.',
          type: 'success',
        });
        await fetchData();
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncReconcile = async () => {
    setSyncing(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/admin/youtube-analytics/global-reach/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: 'Admin triggered sync & reconciliation' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg({
          text: 'Verified data synchronized and growth reconciliation completed!',
          type: 'success',
        });
        await fetchData();
      } else {
        throw new Error(data.error || 'Synchronization failed');
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleResetAdjustments = async () => {
    if (!confirm('Are you sure you want to reset all adjustments and reconciliation history?')) return;
    setSaving(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/admin/youtube-analytics/global-reach/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg({ text: 'Reconciliation adjustments reset to zero.', type: 'success' });
        await fetchData();
      } else {
        throw new Error(data.error || 'Reset failed');
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (historyId: string) => {
    if (!confirm('Rollback adjustments to this historical point?')) return;
    setSaving(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/admin/youtube-analytics/global-reach/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'rollback', historyId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg({ text: 'Successfully rolled back to selected reconciliation event.', type: 'success' });
        await fetchData();
      } else {
        throw new Error(data.error || 'Rollback failed');
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const metricRows = [
    {
      key: 'impressions',
      label: 'Impressions',
      icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
      base: growthStore?.baseline.metrics.impressions,
      verified: verifiedMetrics?.impressions,
      trajectory: reconciliation?.modeledTrajectory.impressions,
      adjustment: reconciliation?.modeledAdjustment.impressions,
      combined: reconciliation?.combinedIndex.impressions,
      unit: '',
    },
    {
      key: 'views',
      label: 'Engaged Views',
      icon: <Eye className="w-4 h-4 text-emerald-400" />,
      base: growthStore?.baseline.metrics.views,
      verified: verifiedMetrics?.views,
      trajectory: reconciliation?.modeledTrajectory.views,
      adjustment: reconciliation?.modeledAdjustment.views,
      combined: reconciliation?.combinedIndex.views,
      unit: '',
    },
    {
      key: 'watchHours',
      label: 'Watch Time',
      icon: <Clock className="w-4 h-4 text-teal-400" />,
      base: growthStore?.baseline.metrics.watchHours,
      verified: verifiedMetrics?.watchHours,
      trajectory: reconciliation?.modeledTrajectory.watchHours,
      adjustment: reconciliation?.modeledAdjustment.watchHours,
      combined: reconciliation?.combinedIndex.watchHours,
      unit: ' hrs',
    },
    {
      key: 'geographies',
      label: 'Geographies',
      icon: <Globe className="w-4 h-4 text-blue-400" />,
      base: growthStore?.baseline.metrics.geographies,
      verified: verifiedMetrics?.geographies,
      trajectory: reconciliation?.modeledTrajectory.geographies,
      adjustment: reconciliation?.modeledAdjustment.geographies,
      combined: reconciliation?.combinedIndex.geographies,
      unit: ' countries',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                Institutional Authority
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                /admin/youtube-analytics/global-reach
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <Sliders className="w-6 h-6 text-amber-400" />
              Automated Global Reach Counter & Growth Engine
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-3xl">
              Three-Value Architecture combining verified YouTube Analytics baselines with deterministic monthly growth modeling, automated real-growth reconciliation, and stopping logic.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/youtube-analytics"
              className="px-3 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
            >
              YouTube Analytics
            </Link>
            <Link
              href="/releases"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-xs font-semibold text-amber-400 border border-amber-400/30 transition-colors"
            >
              <span>Public Strip</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionMsg && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              actionMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {actionMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              {actionMsg.text}
            </div>
            <button
              onClick={() => setActionMsg(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Status Indicators Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Engine Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  growthStore?.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
                }`}
              />
              <span className="text-base font-bold text-white">
                {growthStore?.enabled ? 'Active (Modeling ON)' : 'Paused (Verified Only)'}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 mt-1">
              {growthStore?.enabled
                ? 'Three-value reconciliation active'
                : 'Adjustment clamped to zero'}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Projection Horizon
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold text-white">
                {monthsInfo?.completedMonths ?? 0} of {growthStore?.projectionHorizonMonths || 24} mos
              </span>
              {monthsInfo?.isHorizonFrozen && (
                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                  FROZEN
                </span>
              )}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1">
              {monthsInfo?.isHorizonFrozen
                ? '24-month horizon reached; growth frozen'
                : `Active trajectory from ${growthStore?.baseline.date}`}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Geographic Ceiling
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold text-white">
                {growthStore?.geographicCeiling || 125} Countries
              </span>
              {reconciliation?.isGeographicCeilingReached && (
                <span className="px-1.5 py-0.5 rounded bg-blue-400/20 text-blue-300 text-[10px] font-bold">
                  CEILING
                </span>
              )}
            </div>
            <span className="text-[11px] text-neutral-400 mt-1">
              Actual verified countries never capped
            </span>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Deterministic Seed
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-base font-mono font-bold text-white">
                #{growthStore?.seed || 4242}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 mt-1">
              Fixed rate generator across reloads
            </span>
          </div>
        </div>

        {/* Section 1: Three-Value Data Architecture Matrix */}
        <div className="border border-neutral-800 rounded-xl bg-neutral-900/40 overflow-hidden">
          <div className="p-5 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                  Three-Value Data Architecture Matrix
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Formula: <code className="text-amber-300 font-mono">combinedIndex = verifiedTotal + max(0, modeledTrajectory - verifiedTotal)</code>. Modeled values never overwrite verified records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncReconcile}
                disabled={syncing || loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs hover:bg-amber-300 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Verified & Reconcile'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/60 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Metric</th>
                  <th className="py-3 px-4">Stored Baseline ({growthStore?.baseline.date})</th>
                  <th className="py-3 px-4">Latest Verified Total</th>
                  <th className="py-3 px-4">Modeled Trajectory</th>
                  <th className="py-3 px-4 text-amber-400">Modeled Adjustment</th>
                  <th className="py-3 px-4 text-white font-bold">Combined Index</th>
                  <th className="py-3 px-4">Status & Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {metricRows.map((row) => {
                  const verifiedExceedsModel = (row.verified ?? 0) >= (row.trajectory ?? 0);
                  return (
                    <tr key={row.key} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-semibold text-white">
                          {row.icon}
                          <span>{row.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-400">
                        {fmt(row.base)}
                        {row.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-300">
                        {fmt(row.verified)}
                        {row.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-300">
                        {fmt(row.trajectory)}
                        {row.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        +{fmt(row.adjustment)}
                        {row.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-white text-sm">
                        {fmt(row.combined)}
                        {row.unit}
                      </td>
                      <td className="py-3.5 px-4">
                        {verifiedExceedsModel ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-semibold text-emerald-400">
                            Verified Exceeds Model (Adj = 0)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-[10px] font-semibold text-amber-400">
                            Adjusted to Target
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-neutral-950/40 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Strict Non-Overwrite Rule: Verified YouTube Studio CSV & Daily Reports remain untouched.
            </span>
            <span className="text-neutral-500 font-mono">
              Last Sync: {growthStore?.lastReconciliationAt ? new Date(growthStore.lastReconciliationAt).toLocaleString() : 'Pending'}
            </span>
          </div>
        </div>

        {/* Section 2: Engine Configuration Form */}
        <div className="border border-neutral-800 rounded-xl bg-neutral-900/40 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Growth Engine Configuration & Deterministic Rates
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Configure baseline parameters and independent monthly rates within authorized governance bounds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-neutral-300">Engine Enabled</label>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-amber-400 bg-neutral-800 border-neutral-700 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Baseline Date
              </label>
              <input
                type="date"
                value={baselineDate}
                onChange={(e) => setBaselineDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Historical verified baseline anchor.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Geographic Ceiling
              </label>
              <input
                type="number"
                min="53"
                max="250"
                value={geographicCeiling}
                onChange={(e) => setGeographicCeiling(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Default 125. Actual verified counts never capped.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Projection Horizon (Months)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={projectionHorizonMonths}
                onChange={(e) => setProjectionHorizonMonths(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Default 24. Growth freezes once reached.</p>
            </div>
          </div>

          {/* Monthly Rates Controls */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">
              Independent Monthly Growth Rates (Governance Bounds)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/60">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-neutral-300">Views</span>
                  <span className="text-[10px] text-neutral-500 font-mono">1.5% - 4.2%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0.015"
                    max="0.042"
                    value={baseRates.views}
                    onChange={(e) =>
                      setBaseRates({ ...baseRates, views: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs text-white font-mono"
                  />
                  <span className="text-xs font-bold text-amber-400">
                    {(baseRates.views * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/60">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-neutral-300">Impressions</span>
                  <span className="text-[10px] text-neutral-500 font-mono">2.1% - 5.4%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0.021"
                    max="0.054"
                    value={baseRates.impressions}
                    onChange={(e) =>
                      setBaseRates({ ...baseRates, impressions: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs text-white font-mono"
                  />
                  <span className="text-xs font-bold text-amber-400">
                    {(baseRates.impressions * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/60">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-neutral-300">Watch Hours</span>
                  <span className="text-[10px] text-neutral-500 font-mono">1.2% - 3.6%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0.012"
                    max="0.036"
                    value={baseRates.watchHours}
                    onChange={(e) =>
                      setBaseRates({ ...baseRates, watchHours: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs text-white font-mono"
                  />
                  <span className="text-xs font-bold text-amber-400">
                    {(baseRates.watchHours * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/60">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-neutral-300">Geographic Index</span>
                  <span className="text-[10px] text-neutral-500 font-mono">1.2% - 2.9%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0.012"
                    max="0.029"
                    value={baseRates.geographies}
                    onChange={(e) =>
                      setBaseRates({ ...baseRates, geographies: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs text-white font-mono"
                  />
                  <span className="text-xs font-bold text-amber-400">
                    {(baseRates.geographies * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seed & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-neutral-300">PRNG Seed:</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-24 px-2.5 py-1.5 rounded bg-neutral-950 border border-neutral-800 text-xs font-mono text-white"
              />
              <button
                onClick={() => handleSaveConfig(true)}
                disabled={saving}
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition-colors"
              >
                Regenerate Schedule
              </button>
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className="text-xs text-amber-400 hover:underline"
              >
                {showSchedule ? 'Hide 24-Mo Schedule' : 'Inspect 24-Mo Schedule'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetAdjustments}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-xs text-rose-300 font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Adjustments</span>
              </button>
              <button
                onClick={() => handleSaveConfig(false)}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-colors"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>

          {/* 24-Month Saved Schedule Inspector */}
          {showSchedule && growthStore?.savedMonthlySchedule && (
            <div className="pt-4 border-t border-neutral-800/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                Deterministic 24-Month Monthly Rate Schedule (Seed #{growthStore.seed})
              </h4>
              <div className="overflow-x-auto max-h-60 overflow-y-auto border border-neutral-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Month</th>
                      <th className="py-2 px-3">Views Rate</th>
                      <th className="py-2 px-3">Impressions Rate</th>
                      <th className="py-2 px-3">Watch Hours Rate</th>
                      <th className="py-2 px-3">Geographic Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 font-mono text-[11px]">
                    {Array.from({ length: 24 }).map((_, idx) => (
                      <tr key={idx} className={idx < (monthsInfo?.completedMonths ?? 0) ? 'bg-amber-400/5' : ''}>
                        <td className="py-1.5 px-3 font-bold text-white">Month {idx + 1}</td>
                        <td className="py-1.5 px-3 text-emerald-400">
                          {((growthStore.savedMonthlySchedule.views[idx] ?? 0) * 100).toFixed(2)}%
                        </td>
                        <td className="py-1.5 px-3 text-amber-400">
                          {((growthStore.savedMonthlySchedule.impressions[idx] ?? 0) * 100).toFixed(2)}%
                        </td>
                        <td className="py-1.5 px-3 text-teal-400">
                          {((growthStore.savedMonthlySchedule.watchHours[idx] ?? 0) * 100).toFixed(2)}%
                        </td>
                        <td className="py-1.5 px-3 text-blue-400">
                          {((growthStore.savedMonthlySchedule.geographies[idx] ?? 0) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Reconciliation History & Rollback */}
        <div className="border border-neutral-800 rounded-xl bg-neutral-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white">Reconciliation Audit Trail & Rollback</h2>
          </div>
          <p className="text-xs text-neutral-400">
            Immutable log of every synchronization event. Rollback restores adjustments to any prior recorded state.
          </p>

          <div className="overflow-x-auto border border-neutral-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor / Trigger</th>
                  <th className="py-2.5 px-3">Verified After (Imp / Views)</th>
                  <th className="py-2.5 px-3">Modeled Adjustment</th>
                  <th className="py-2.5 px-3">Combined Index</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {growthStore?.reconciliationHistory && growthStore.reconciliationHistory.length > 0 ? (
                  growthStore.reconciliationHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-800/30">
                      <td className="py-2.5 px-3 text-neutral-300">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-white">
                        <span className="font-semibold">{item.adminActor}</span>{' '}
                        <span className="text-[10px] text-neutral-500 uppercase">({item.trigger})</span>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400">
                        {fmt(item.verifiedAfter.impressions)} / {fmt(item.verifiedAfter.views)}
                      </td>
                      <td className="py-2.5 px-3 text-amber-400">
                        +{fmt(item.modeledAdjustment.impressions)} / +{fmt(item.modeledAdjustment.views)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {fmt(item.combinedIndex.impressions)} / {fmt(item.combinedIndex.views)}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400 font-sans text-xs">
                        {item.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={() => handleRollback(item.id)}
                          className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] font-semibold text-neutral-300 transition-colors"
                        >
                          Rollback
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500 font-sans">
                      No reconciliation records recorded yet. Click &quot;Sync Verified &amp; Reconcile&quot; to initialize.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
