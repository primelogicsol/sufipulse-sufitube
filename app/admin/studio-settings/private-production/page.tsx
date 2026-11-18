"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';

export default function PrivateProductionConnectionSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role?.includes('admin') ?? false;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState('');
  const [testSongUrl, setTestSongUrl] = useState('https://suno.com/song/6a79ea36-a31d-45db-aae1-6862e99db69e');
  
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
    localSunoBrowserAvailable: false,
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
          localSunoBrowserAvailable: data.localSunoBrowserAvailable,
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
        setNotice(form.streamUrlTemplate.trim() ? 'Audio provider saved. Test it with a Suno link before importing.' : 'Advanced settings saved.');
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
        body: JSON.stringify({ action: 'test', sourceAssetId: testSongUrl }),
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
      if (res.ok) {
        setNotice('');
        setTestResult(null);
        await fetchStatus();
      }
    } finally {
      setSaving(false);
    }
  };

  const hasAnyConfig = status.alignmentConfigured || status.streamConfigured || status.authConfigured;
  const inputClass = "mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white";
  const fields = [
    ["streamAuthorization", "Audio service authorization"],
    ["streamExtraHeadersJson", "Audio service headers (JSON)"],
    ["alignmentUrlTemplate", "Lyric alignment URL template"],
    ["alignmentAuthorization", "Lyric alignment authorization"],
    ["alignmentExtraHeadersJson", "Lyric alignment headers (JSON)"],
  ] as const;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6 py-8 text-white">
        <header>
          <h1 className="text-2xl font-bold">Private Production</h1>
          <p className="mt-2 text-sm text-white/70">Paste each Suno song link in its release draft. SufiPulse can use your Chrome Suno sign-in or a saved audio provider.</p>
        </header>
        <section className="space-y-4 rounded-xl border border-white/10 bg-[#111] p-5">
          <h2 className="font-semibold">Suno link import</h2>
          <p role="status" className="text-sm text-white/80">
            {loading ? "Checking connection..." : status.streamConfigured ? "Audio provider configured" : status.localSunoBrowserAvailable ? "Chrome export available. Sign in when Chrome prompts you." : "Audio provider needed for link imports"}
          </p>
          <form onSubmit={handleSave} className="space-y-4">
            <label className="block text-sm">
              Audio provider URL template (optional with Chrome)
              <input className={inputClass} value={form.streamUrlTemplate} onChange={e => setForm({ ...form, streamUrlTemplate: e.target.value })} placeholder="https://provider.example/audio/{assetId}" />
            </label>
            <p className="text-xs text-amber-350/90 text-amber-300">
              Note: Do not paste song links (e.g. <code>https://suno.com/song/...</code>) here. Paste individual song links directly inside your release drafts.
            </p>
            <p className="text-xs text-white/65">Use the audio endpoint from your provider with {"{assetId}"}. Leave saved fields blank to keep their values.</p>
            <details className="rounded-lg border border-white/10 p-3">
              <summary className="cursor-pointer text-sm font-medium">Advanced settings</summary>
              <div className="mt-3 space-y-3">
                {fields.map(([key, label]) => (
                  <label key={key} className="block text-sm">
                    {label}
                    <input className={inputClass} type={key === "alignmentUrlTemplate" ? "text" : "password"} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                  </label>
                ))}
                {hasAnyConfig && <button type="button" onClick={handleDisable} disabled={saving || testing} className="text-sm text-red-300">Clear saved connection</button>}
              </div>
            </details>
            {!loading && !status.secureStorageReady && <p className="text-sm text-red-300">Set PRIVATE_PRODUCTION_ENCRYPTION_KEY on the server to enable saving.</p>}
            <button type="submit" disabled={loading || saving || testing || !status.secureStorageReady || !Object.values(form).some(value => value.trim())} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {saving ? "Saving..." : "Save connection"}
            </button>
            {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
          </form>
          {(status.streamConfigured || status.localSunoBrowserAvailable) && (
            <div className="space-y-2 border-t border-white/10 pt-4">
              <label className="block text-sm">Test song link
                <input className={inputClass} value={testSongUrl} onChange={e => { setTestSongUrl(e.target.value); setTestResult(null); }} placeholder="https://suno.com/song/..." />
              </label>
              <button type="button" onClick={handleTest} disabled={testing || saving || !testSongUrl.trim()} className="rounded-lg bg-white/10 px-4 py-2 text-sm disabled:opacity-50">{testing ? "Testing..." : "Test connection"}</button>
              {testResult && <p role="status" className="text-sm text-white/80">{testResult.error || (testResult.stream === "PASS" ? "Audio provider downloaded and decoded successfully." : testResult.stream === "BROWSER_PASS" ? "Local authenticated Suno browser export downloaded and decoded successfully." : "Audio import test failed.")}</p>}
            </div>
          )}
        </section>
        <section className="rounded-xl border border-white/10 bg-[#111] p-5">
          <h2 className="font-semibold">Upload a Suno export</h2>
          <p className="mt-2 text-sm text-white/70">In your release draft, open Master Audio &amp; Suno Ingestion and choose Upload Audio. You can use this option immediately.</p>
          <a href="/admin/pipeline" className="mt-3 inline-block text-sm font-medium text-amber-300">Open Release Pipeline</a>
        </section>
      </div>
    </DashboardLayout>
  );
}
