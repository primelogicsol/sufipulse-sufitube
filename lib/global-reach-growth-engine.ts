import fs from 'fs';
import path from 'path';

export interface MetricRates {
  views: number;        // Allowed: 0.015 - 0.042 (1.5% - 4.2%)
  impressions: number;  // Allowed: 0.021 - 0.054 (2.1% - 5.4%)
  watchHours: number;   // Allowed: 0.012 - 0.036 (1.2% - 3.6%)
  geographies: number;  // Allowed: 0.012 - 0.029 (1.2% - 2.9%)
}

export const RATE_BOUNDS: Record<keyof MetricRates, { min: number; max: number; label: string }> = {
  views: { min: 0.015, max: 0.042, label: 'Views (1.5% - 4.2%)' },
  impressions: { min: 0.021, max: 0.054, label: 'Impressions (2.1% - 5.4%)' },
  watchHours: { min: 0.012, max: 0.036, label: 'Watch Hours (1.2% - 3.6%)' },
  geographies: { min: 0.012, max: 0.029, label: 'Geographic Index (1.2% - 2.9%)' },
};

export interface MetricValues {
  impressions: number;
  views: number;
  watchHours: number;
  geographies: number;
}

export interface BaselineConfig {
  date: string; // e.g. "2026-09-11"
  metrics: MetricValues;
}

export interface MonthlySchedule {
  views: number[];
  impressions: number[];
  watchHours: number[];
  geographies: number[];
}

export interface ReconciliationRecord {
  id: string;
  timestamp: string;
  adminActor: string;
  trigger: 'sync' | 'manual' | 'scheduled' | 'rollback' | 'config_update';
  monthsElapsed: number;
  verifiedBefore: MetricValues;
  verifiedAfter: MetricValues;
  modeledTrajectory: MetricValues;
  modeledAdjustment: MetricValues;
  combinedIndex: MetricValues;
  notes?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  adminActor: string;
  action: string;
  details: Record<string, any>;
}

export interface GrowthEngineStore {
  enabled: boolean;
  baseline: BaselineConfig;
  projectionHorizonMonths: number; // default 24
  geographicCeiling: number;        // default 125
  seed: number;
  baseRates: MetricRates;
  savedMonthlySchedule: MonthlySchedule;
  lastReconciliationAt?: string;
  reconciliationHistory: ReconciliationRecord[];
  auditLogs: AuditLogItem[];
}

export interface GrowthEnginePublicPayload {
  enabled: boolean;
  label: string;
  description: string;
  monthsElapsed: number;
  isHorizonFrozen: boolean;
  isGeographicCeilingReached: boolean;
  combinedIndex: MetricValues;
  modeledAdjustment: MetricValues;
  verifiedTotal: MetricValues;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'global-reach-growth.json');

// Pseudo-random number generator (Mulberry32) for deterministic schedules
function mulberry32(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDeterministicSchedule(
  seed: number,
  baseRates: MetricRates,
  horizon = 24
): MonthlySchedule {
  const rng = mulberry32(seed);

  const generateForMetric = (metric: keyof MetricRates) => {
    const { min, max } = RATE_BOUNDS[metric];
    const center = Math.max(min, Math.min(max, baseRates[metric]));
    const halfSpan = Math.min(center - min, max - center);
    const schedule: number[] = [];

    for (let i = 0; i < horizon; i++) {
      // Deterministic jitter around center within bounds
      const jitter = (rng() * 2 - 1) * (halfSpan * 0.85);
      const val = Number(Math.max(min, Math.min(max, center + jitter)).toFixed(4));
      schedule.push(val);
    }
    return schedule;
  };

  return {
    views: generateForMetric('views'),
    impressions: generateForMetric('impressions'),
    watchHours: generateForMetric('watchHours'),
    geographies: generateForMetric('geographies'),
  };
}

const DEFAULT_STORE: GrowthEngineStore = {
  enabled: true,
  baseline: {
    date: '2026-09-11',
    metrics: {
      impressions: 994300,
      views: 160611,
      watchHours: 10410,
      geographies: 53,
    },
  },
  projectionHorizonMonths: 24,
  geographicCeiling: 125,
  seed: 4242,
  baseRates: {
    views: 0.028,        // 2.8% (bound 1.5% - 4.2%)
    impressions: 0.035,  // 3.5% (bound 2.1% - 5.4%)
    watchHours: 0.022,   // 2.2% (bound 1.2% - 3.6%)
    geographies: 0.018,  // 1.8% (bound 1.2% - 2.9%)
  },
  savedMonthlySchedule: {
    views: [],
    impressions: [],
    watchHours: [],
    geographies: [],
  },
  reconciliationHistory: [],
  auditLogs: [],
};

// Populate initial default schedule
DEFAULT_STORE.savedMonthlySchedule = generateDeterministicSchedule(
  DEFAULT_STORE.seed,
  DEFAULT_STORE.baseRates,
  DEFAULT_STORE.projectionHorizonMonths
);

export class GlobalReachGrowthEngine {
  private store: GrowthEngineStore;

  constructor() {
    this.store = this.loadStore();
  }

  private loadStore(): GrowthEngineStore {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all required fields exist
        return {
          ...DEFAULT_STORE,
          ...parsed,
          baseline: {
            ...DEFAULT_STORE.baseline,
            ...(parsed.baseline || {}),
            metrics: {
              ...DEFAULT_STORE.baseline.metrics,
              ...(parsed.baseline?.metrics || {}),
            },
          },
          baseRates: {
            ...DEFAULT_STORE.baseRates,
            ...(parsed.baseRates || {}),
          },
          savedMonthlySchedule:
            parsed.savedMonthlySchedule && parsed.savedMonthlySchedule.views?.length === 24
              ? parsed.savedMonthlySchedule
              : generateDeterministicSchedule(
                  parsed.seed || DEFAULT_STORE.seed,
                  parsed.baseRates || DEFAULT_STORE.baseRates,
                  parsed.projectionHorizonMonths || 24
                ),
          reconciliationHistory: parsed.reconciliationHistory || [],
          auditLogs: parsed.auditLogs || [],
        };
      }
    } catch (err) {
      console.error('[GlobalReachGrowthEngine] Failed to read store, using default:', err);
    }
    const fresh = JSON.parse(JSON.stringify(DEFAULT_STORE));
    this.saveStore(fresh);
    return fresh;
  }

  private saveStore(s: GrowthEngineStore) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(s, null, 2), 'utf-8');
      this.store = s;
    } catch (err) {
      console.error('[GlobalReachGrowthEngine] Failed to persist store:', err);
    }
  }

  public getStore(): GrowthEngineStore {
    return JSON.parse(JSON.stringify(this.store));
  }

  /**
   * Calculate elapsed completed months from baselineDate up to horizon.
   */
  public calculateMonthsElapsed(asOfDate = new Date()): {
    completedMonths: number;
    rawMonths: number;
    isHorizonFrozen: boolean;
  } {
    const baselineDate = new Date(this.store.baseline.date);
    const diffMs = asOfDate.getTime() - baselineDate.getTime();
    if (diffMs <= 0) {
      return { completedMonths: 0, rawMonths: 0, isHorizonFrozen: false };
    }

    // Standard astronomical/calendar average month = 30.4375 days
    const daysElapsed = diffMs / (1000 * 60 * 60 * 24);
    const rawMonths = Number((daysElapsed / 30.4375).toFixed(2));
    const completedMonths = Math.floor(rawMonths);

    const horizon = this.store.projectionHorizonMonths || 24;
    const cappedCompleted = Math.min(completedMonths, horizon);
    const isHorizonFrozen = completedMonths >= horizon;

    return {
      completedMonths: cappedCompleted,
      rawMonths,
      isHorizonFrozen,
    };
  }

  /**
   * Deterministically calculates modeled trajectory for a given number of completed months.
   */
  public calculateModeledTrajectory(completedMonths: number): MetricValues {
    const schedule = this.store.savedMonthlySchedule;
    const base = this.store.baseline.metrics;
    const ceiling = this.store.geographicCeiling || 125;
    const horizon = this.store.projectionHorizonMonths || 24;
    const cappedMonths = Math.min(completedMonths, horizon);

    let impMultiplier = 1;
    let viewMultiplier = 1;
    let watchMultiplier = 1;
    let geoMultiplier = 1;

    for (let i = 0; i < cappedMonths; i++) {
      impMultiplier *= 1 + (schedule.impressions[i] ?? this.store.baseRates.impressions);
      viewMultiplier *= 1 + (schedule.views[i] ?? this.store.baseRates.views);
      watchMultiplier *= 1 + (schedule.watchHours[i] ?? this.store.baseRates.watchHours);
      geoMultiplier *= 1 + (schedule.geographies[i] ?? this.store.baseRates.geographies);
    }

    const modeledImpressions = Math.round(base.impressions * impMultiplier);
    const modeledViews = Math.round(base.views * viewMultiplier);
    const modeledWatchHours = Math.round(base.watchHours * watchMultiplier);
    const rawGeo = Math.round(base.geographies * geoMultiplier);
    // Geographic modeling ceiling stops at 125
    const modeledGeographies = Math.min(ceiling, rawGeo);

    return {
      impressions: modeledImpressions,
      views: modeledViews,
      watchHours: modeledWatchHours,
      geographies: modeledGeographies,
    };
  }

  /**
   * Compute the three-value architecture for the current state:
   * verifiedTotal, modeledAdjustment, combinedIndex.
   *
   * Formulas:
   * modeledAdjustment = max(0, modeledTrajectory - verifiedTotal)
   * combinedIndex = verifiedTotal + modeledAdjustment
   *
   * Rules:
   * 1. If verifiedTotal >= modeledTrajectory, modeledAdjustment = 0, combinedIndex = verifiedTotal.
   * 2. Country modeling stops at 125, BUT actual verified country count is NEVER capped!
   *    If verified countries > 125, combinedIndex = verified countries.
   * 3. If growth engine is disabled, modeledAdjustment = 0, combinedIndex = verifiedTotal.
   * 4. Never negative.
   */
  public computeReconciledIndex(
    verifiedTotal: MetricValues,
    asOfDate = new Date()
  ): {
    verifiedTotal: MetricValues;
    modeledTrajectory: MetricValues;
    modeledAdjustment: MetricValues;
    combinedIndex: MetricValues;
    monthsElapsed: number;
    isHorizonFrozen: boolean;
    isGeographicCeilingReached: boolean;
    dataHealth: {
      isConsistent: boolean;
      warnings: string[];
    };
  } {
    const { completedMonths, isHorizonFrozen } = this.calculateMonthsElapsed(asOfDate);
    const trajectory = this.calculateModeledTrajectory(completedMonths);
    const ceiling = this.store.geographicCeiling || 125;
    const isCeilingReached = trajectory.geographies >= ceiling;

    const warnings: string[] = [];
    if (verifiedTotal.impressions < this.store.baseline.metrics.impressions) {
      warnings.push('Verified impressions below baseline');
    }
    if (verifiedTotal.views < this.store.baseline.metrics.views) {
      warnings.push('Verified views below baseline');
    }
    if (verifiedTotal.geographies < this.store.baseline.metrics.geographies) {
      warnings.push('Verified geographies below baseline');
    }

    if (!this.store.enabled) {
      return {
        verifiedTotal: { ...verifiedTotal },
        modeledTrajectory: { ...trajectory },
        modeledAdjustment: { impressions: 0, views: 0, watchHours: 0, geographies: 0 },
        combinedIndex: { ...verifiedTotal },
        monthsElapsed: completedMonths,
        isHorizonFrozen,
        isGeographicCeilingReached: isCeilingReached,
        dataHealth: {
          isConsistent: warnings.length === 0,
          warnings,
        },
      };
    }

    // modeledAdjustment = max(0, modeledTrajectory - verifiedTotal)
    const impAdj = Math.max(0, trajectory.impressions - verifiedTotal.impressions);
    const viewAdj = Math.max(0, trajectory.views - verifiedTotal.views);
    const watchAdj = Math.max(0, trajectory.watchHours - verifiedTotal.watchHours);

    // Geographies: modeled trajectory capped at ceiling (125).
    // If verified >= trajectory (e.g. verified is 130 and trajectory is 125), adjustment is 0.
    // CombinedIndex = verifiedTotal + adjustment. Never artificially caps verified countries!
    const geoAdj = Math.max(0, trajectory.geographies - verifiedTotal.geographies);

    const modeledAdjustment: MetricValues = {
      impressions: impAdj,
      views: viewAdj,
      watchHours: watchAdj,
      geographies: geoAdj,
    };

    const combinedIndex: MetricValues = {
      impressions: verifiedTotal.impressions + impAdj,
      views: verifiedTotal.views + viewAdj,
      watchHours: verifiedTotal.watchHours + watchAdj,
      geographies: verifiedTotal.geographies + geoAdj,
    };

    return {
      verifiedTotal: { ...verifiedTotal },
      modeledTrajectory: trajectory,
      modeledAdjustment,
      combinedIndex,
      monthsElapsed: completedMonths,
      isHorizonFrozen,
      isGeographicCeilingReached: isCeilingReached || verifiedTotal.geographies >= ceiling,
      dataHealth: {
        isConsistent: warnings.length === 0,
        warnings,
      },
    };
  }

  /**
   * Public-facing payload: Never leaks formulas, seeds, rates or internal controls.
   */
  public getPublicPayload(
    verifiedTotal: MetricValues,
    asOfDate = new Date()
  ): GrowthEnginePublicPayload {
    const computed = this.computeReconciledIndex(verifiedTotal, asOfDate);

    return {
      enabled: this.store.enabled,
      label: 'Global Reach Index',
      description:
        'Modeled index combining verified audience activity with conservative demographic projection.',
      monthsElapsed: computed.monthsElapsed,
      isHorizonFrozen: computed.isHorizonFrozen,
      isGeographicCeilingReached: computed.isGeographicCeilingReached,
      combinedIndex: computed.combinedIndex,
      modeledAdjustment: computed.modeledAdjustment,
      verifiedTotal: computed.verifiedTotal,
    };
  }

  /**
   * Reconcile with updated verified analytics data.
   * Logs a reconciliation event and updates audit logs.
   */
  public reconcileWithVerified(
    newVerified: MetricValues,
    adminActor = 'system',
    trigger: ReconciliationRecord['trigger'] = 'sync',
    notes?: string
  ): ReconciliationRecord {
    const previousVerified = this.store.reconciliationHistory[0]?.verifiedAfter || {
      ...this.store.baseline.metrics,
    };

    const computed = this.computeReconciledIndex(newVerified);

    const event: ReconciliationRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      adminActor,
      trigger,
      monthsElapsed: computed.monthsElapsed,
      verifiedBefore: previousVerified,
      verifiedAfter: { ...newVerified },
      modeledTrajectory: computed.modeledTrajectory,
      modeledAdjustment: computed.modeledAdjustment,
      combinedIndex: computed.combinedIndex,
      notes,
    };

    const store = this.getStore();
    store.reconciliationHistory.unshift(event);
    if (store.reconciliationHistory.length > 50) {
      store.reconciliationHistory.pop();
    }
    store.lastReconciliationAt = event.timestamp;

    store.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      timestamp: event.timestamp,
      adminActor,
      action: `reconcile_${trigger}`,
      details: {
        verifiedImpressions: newVerified.impressions,
        verifiedViews: newVerified.views,
        modeledAdjustment: computed.modeledAdjustment,
        combinedIndex: computed.combinedIndex,
      },
    });
    if (store.auditLogs.length > 100) {
      store.auditLogs.pop();
    }

    this.saveStore(store);
    return event;
  }

  /**
   * Update admin configuration with validation.
   */
  public updateConfig(
    updates: {
      enabled?: boolean;
      baselineDate?: string;
      geographicCeiling?: number;
      projectionHorizonMonths?: number;
      seed?: number;
      baseRates?: Partial<MetricRates>;
      regenerateSchedule?: boolean;
    },
    adminActor = 'admin'
  ): { success: boolean; error?: string } {
    const store = this.getStore();

    if (typeof updates.enabled === 'boolean') {
      store.enabled = updates.enabled;
    }

    if (updates.baselineDate) {
      const d = new Date(updates.baselineDate);
      if (isNaN(d.getTime())) {
        return { success: false, error: 'Invalid baseline date format' };
      }
      store.baseline.date = updates.baselineDate;
    }

    if (typeof updates.geographicCeiling === 'number') {
      if (updates.geographicCeiling < 53 || updates.geographicCeiling > 250) {
        return { success: false, error: 'Geographic ceiling must be between 53 and 250' };
      }
      store.geographicCeiling = updates.geographicCeiling;
    }

    if (typeof updates.projectionHorizonMonths === 'number') {
      if (updates.projectionHorizonMonths < 1 || updates.projectionHorizonMonths > 60) {
        return { success: false, error: 'Projection horizon must be between 1 and 60 months' };
      }
      store.projectionHorizonMonths = updates.projectionHorizonMonths;
    }

    let seedChanged = false;
    if (typeof updates.seed === 'number' && updates.seed !== store.seed) {
      store.seed = updates.seed;
      seedChanged = true;
    }

    let ratesChanged = false;
    if (updates.baseRates) {
      for (const [k, v] of Object.entries(updates.baseRates)) {
        const metricKey = k as keyof MetricRates;
        const bounds = RATE_BOUNDS[metricKey];
        if (bounds) {
          if (typeof v !== 'number' || v < bounds.min || v > bounds.max) {
            return {
              success: false,
              error: `Rate for ${metricKey} must be between ${(bounds.min * 100).toFixed(1)}% and ${(bounds.max * 100).toFixed(1)}%`,
            };
          }
          store.baseRates[metricKey] = Number(v.toFixed(4));
          ratesChanged = true;
        }
      }
    }

    if (seedChanged || ratesChanged || updates.regenerateSchedule) {
      store.savedMonthlySchedule = generateDeterministicSchedule(
        store.seed,
        store.baseRates,
        store.projectionHorizonMonths
      );
    }

    store.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminActor,
      action: 'update_configuration',
      details: updates,
    });
    if (store.auditLogs.length > 100) {
      store.auditLogs.pop();
    }

    this.saveStore(store);
    return { success: true };
  }

  /**
   * Reset / Rollback modeled adjustments or restore to default baseline.
   */
  public resetAdjustments(adminActor = 'admin'): void {
    const store = this.getStore();
    store.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminActor,
      action: 'reset_adjustments',
      details: { previousReconciliations: store.reconciliationHistory.length },
    });
    store.reconciliationHistory = [];
    this.saveStore(store);
  }

  /**
   * Rollback to a specific reconciliation record.
   */
  public rollback(historyId: string, adminActor = 'admin'): boolean {
    const store = this.getStore();
    const idx = store.reconciliationHistory.findIndex((h) => h.id === historyId);
    if (idx === -1) return false;

    const target = store.reconciliationHistory[idx];
    store.reconciliationHistory = store.reconciliationHistory.slice(idx);

    store.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminActor,
      action: 'rollback_reconciliation',
      details: { rolledBackTo: target.id, targetTimestamp: target.timestamp },
    });

    this.saveStore(store);
    return true;
  }
}

export const globalReachGrowthEngine = new GlobalReachGrowthEngine();
