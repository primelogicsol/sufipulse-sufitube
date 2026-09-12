"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { AlertCircle, CheckCircle2, Server, Save } from 'lucide-react';

export default function PrivateProductionConnectionSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role?.includes('admin') ?? false;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
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
    authConfigured: false,
    secureStorageReady: false,
  });

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/studio-settings/private-production');
      if (res.ok) {
        const data = await res.json();
        setStatus({
          alignmentConfigured: data.alignmentConfigured,
          streamConfigured: data.streamConfigured,
          authConfigured: data.authConfigured,
          secureStorageReady: data.secureStorageReady,
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
    if (!status.secureStorageReady) return;
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
    if (!confirm('Are you sure you want to clear all private production connection settings?')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/studio-settings/private-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      if (res.ok) await fetchStatus();
    } finally {
      setSaving(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const hasAnyConfig = status.alignmentConfigured || status.streamConfigured || status.authConfigured;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Private Production Connection</h1>

        {/* Status Section */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-[#111] p-6 shadow-xl">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-6">Connection Status</h2>
          
          {loading ? (
            <div className="text-white/50 text-sm animate-pulse">Loading status...</div>
          ) : (
            <div className="space-y-4 text-sm font-medium">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-white/80">Alignment Service</span>
                <span className={status.alignmentConfigured ? 'text-emerald-400' : 'text-amber-500'}>
                  {status.alignmentConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-white/80">Studio Audio Service</span>
                <span className={status.streamConfigured ? 'text-emerald-400' : 'text-amber-500'}>
                  {status.streamConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-white/80">Authentication</span>
                <span className={status.authConfigured ? 'text-emerald-400' : 'text-amber-500'}>
                  {status.authConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                </span>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={handleTest}
              disabled={testing || !hasAnyConfig}
              className="rounded-lg bg-white/10 hover:bg-white/15 px-6 py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={scrollToForm}
              className="rounded-lg border border-amber-400/50 hover:bg-amber-400/10 px-6 py-2.5 text-sm font-medium text-amber-400 transition"
            >
              Configure Connection
            </button>
            <button
              onClick={handleDisable}
              disabled={saving || !hasAnyConfig}
              className="ml-auto rounded-lg border border-red-500/20 hover:bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition disabled:opacity-50 disabled:hidden"
            >
              Disable Connection
            </button>
          </div>

          {testResult && (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
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
          <h2 className="font-medium text-white mb-2 flex items-center gap-2">
            <Server className="h-5 w-5" /> Update Configuration
          </h2>
          <p className="text-xs text-white/50 mb-6">Leave fields blank to keep their existing secure values. Authentication is never exposed back to the browser.</p>

          <form ref={formRef} onSubmit={handleSave} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-amber-400 border-b border-white/10 pb-2">Alignment Service</h3>
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

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-amber-400 border-b border-white/10 pb-2">Studio Audio Service</h3>
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

            {!loading && !status.secureStorageReady ? (
              <div className="pt-4 border-t border-white/10">
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-400">Secure storage is not configured.</p>
                  <p className="text-xs text-red-400/80 mt-1">Connection credentials cannot be saved yet. Ensure PRIVATE_PRODUCTION_ENCRYPTION_KEY is present.</p>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-white/10">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-white/90">Advanced connection settings</p>
                  <p className="text-xs text-white/50 mt-1">Configure only after the private production connection contract has been verified. These values are encrypted server-side and apply to all Studio releases.</p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-amber-400 hover:bg-amber-300 px-8 py-3 text-sm font-semibold text-black transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" /> Save Configuration
                  </button>
                </div>
              </div>
            )}
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}
