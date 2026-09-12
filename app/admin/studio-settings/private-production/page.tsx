"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { AlertCircle, CheckCircle2, Server, Key, Save, Activity } from 'lucide-react';

export default function PrivateProductionConnectionSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role?.includes('admin') ?? false;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [testResult, setTestResult] = useState<{
    alignment: string;
    stream: string;
    auth: string;
    error?: string;
  } | null>(null);

  const [form, setForm] = useState({
    alignmentUrlTemplate: '',
    alignmentAuthorization: '',
    alignmentExtraHeadersJson: '',
    streamUrlTemplate: '',
    streamAuthorization: '',
    streamExtraHeadersJson: '',
    providerKey: '',
  });

  const [status, setStatus] = useState({
    alignmentConfigured: false,
    streamConfigured: false,
  });

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/studio-settings/private-production');
      if (res.ok) {
        const data = await res.json();
        setStatus({
          alignmentConfigured: data.alignmentConfigured,
          streamConfigured: data.streamConfigured,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchStatus();
  }, [isAdmin]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/studio-settings/private-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', settings: form }),
      });
      if (res.ok) {
        setForm({
          alignmentUrlTemplate: '',
          alignmentAuthorization: '',
          alignmentExtraHeadersJson: '',
          streamUrlTemplate: '',
          streamAuthorization: '',
          streamExtraHeadersJson: '',
          providerKey: '',
        });
        await fetchStatus();
      } else {
        const errorData = await res.json();
        alert(`Error saving: ${errorData.error}`);
      }
    } catch (err: any) {
      alert(`Error saving connection settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/studio-settings/private-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ alignment: 'FAIL', stream: 'FAIL', auth: 'FAIL', error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable and clear the private production connection?')) return;
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/studio-settings/private-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      if (res.ok) {
        await fetchStatus();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Private Production Connection</h1>
          <p className="mt-1 text-sm text-white/60">Configure the secure server-side connection for SufiPulse Studio USA.</p>
        </div>

        {/* Current Status */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-medium text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" /> Connection Status
          </h2>
          {loading ? (
            <div className="text-sm text-white/50">Loading status...</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Alignment Service</div>
                <div className="flex items-center gap-2 font-medium">
                  {status.alignmentConfigured ? (
                    <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> <span className="text-emerald-400">Configured</span></>
                  ) : (
                    <><AlertCircle className="h-4 w-4 text-amber-400" /> <span className="text-amber-400">Missing</span></>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Studio Audio Service</div>
                <div className="flex items-center gap-2 font-medium">
                  {status.streamConfigured ? (
                    <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> <span className="text-emerald-400">Configured</span></>
                  ) : (
                    <><AlertCircle className="h-4 w-4 text-amber-400" /> <span className="text-amber-400">Missing</span></>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleTest}
              disabled={testing || (!status.alignmentConfigured && !status.streamConfigured)}
              className="rounded-lg bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleDisable}
              disabled={saving || (!status.alignmentConfigured && !status.streamConfigured)}
              className="rounded-lg border border-red-500/20 hover:bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition disabled:opacity-50"
            >
              Disable Connection
            </button>
          </div>

          {testResult && (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
              <div className="font-semibold text-white mb-2">Diagnostic Summary</div>
              <div className="grid grid-cols-2 gap-2 text-white/70">
                <div>Alignment Service: <span className={testResult.alignment === 'PASS' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>{testResult.alignment}</span></div>
                <div>Studio Audio Service: <span className={testResult.stream === 'PASS' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>{testResult.stream}</span></div>
                <div>Authentication: <span className={testResult.auth === 'PASS' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>{testResult.auth}</span></div>
              </div>
              {testResult.error && (
                <div className="mt-3 text-red-400/80 text-xs">Error: {testResult.error}</div>
              )}
            </div>
          )}
        </section>

        {/* Configuration Form */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-medium text-white mb-4 flex items-center gap-2">
            <Server className="h-5 w-5" /> Update Configuration
          </h2>
          <p className="text-xs text-white/50 mb-6">Values are encrypted server-side and never returned to the browser after saving. Leave fields blank to keep their existing secure values.</p>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white border-b border-white/10 pb-2">Alignment Service</h3>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">URL Template</label>
                <input
                  type="text"
                  value={form.alignmentUrlTemplate}
                  onChange={(e) => setForm({ ...form, alignmentUrlTemplate: e.target.value })}
                  placeholder="https://.../api/external/song/{assetId}"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50 placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Authentication Header</label>
                <input
                  type="password"
                  value={form.alignmentAuthorization}
                  onChange={(e) => setForm({ ...form, alignmentAuthorization: e.target.value })}
                  placeholder="Bearer ..."
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50 placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Additional Headers (JSON)</label>
                <input
                  type="password"
                  value={form.alignmentExtraHeadersJson}
                  onChange={(e) => setForm({ ...form, alignmentExtraHeadersJson: e.target.value })}
                  placeholder='{"Cookie": "..."}'
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50 placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-medium text-white border-b border-white/10 pb-2">Studio Audio Service</h3>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">URL Template</label>
                <input
                  type="text"
                  value={form.streamUrlTemplate}
                  onChange={(e) => setForm({ ...form, streamUrlTemplate: e.target.value })}
                  placeholder="https://.../api/external/stream/{assetId}"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50 placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Authentication Header</label>
                <input
                  type="password"
                  value={form.streamAuthorization}
                  onChange={(e) => setForm({ ...form, streamAuthorization: e.target.value })}
                  placeholder="Bearer ..."
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50 placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Additional Headers (JSON)</label>
                <input
                  type="password"
                  value={form.streamExtraHeadersJson}
                  onChange={(e) => setForm({ ...form, streamExtraHeadersJson: e.target.value })}
                  placeholder='{"Cookie": "..."}'
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50 placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-amber-400 hover:bg-amber-300 px-6 py-2.5 text-sm font-semibold text-black transition flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> Save Configuration
              </button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}
