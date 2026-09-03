from pathlib import Path

path = Path('app/admin/cms-releases/[id]/audio-alignment/page.tsx')
text = path.read_text()

if 'Rollback draft master timing' in text:
    print('rollback UI already present')
    raise SystemExit(0)

text = text.replace(
    '  publicAudioPreviewUpdatedAt?: string;\n',
    '  publicAudioPreviewUpdatedAt?: string;\n  hasRollbackSnapshot?: boolean;\n  rollbackCapturedAt?: string;\n',
    1,
)

text = text.replace(
    '  const [streamWorking, setStreamWorking] = useState(false);\n  const [confirmReplace, setConfirmReplace] = useState(false);\n',
    '  const [streamWorking, setStreamWorking] = useState(false);\n  const [rollbackWorking, setRollbackWorking] = useState(false);\n  const [confirmReplace, setConfirmReplace] = useState(false);\n  const [confirmRollback, setConfirmRollback] = useState(false);\n',
    1,
)

marker = '  const setPublicAudioPreview = async (enabled: boolean) => {\n'
if marker not in text:
    raise SystemExit('setPublicAudioPreview marker not found')

rollback_fn = '''  const restoreRollbackSnapshot = async () => {
    try {
      setRollbackWorking(true);
      setError('');
      setMessage('');

      const response = await fetch(`/api/admin/releases/${encodeURIComponent(releaseId)}/audio-alignment/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmRestore: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Request failed with HTTP ${response.status}`);

      setConfirmRollback(false);
      setMessage(
        `Rollback restored ${data.cueCount || 0} caption cues at master timing version ${data.masterTimingVersion || '?'}.` +
          (data.warning ? ` ${data.warning}` : '')
      );
    } catch (err: any) {
      setError(String(err?.message || err || 'Timing rollback could not be restored.'));
    } finally {
      setRollbackWorking(false);
    }
  };

'''
text = text.replace(marker, rollback_fn + marker, 1)

section_marker = '''        <section className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.04] p-5">
          <div className="flex items-start gap-3">
            <Radio className="mt-0.5 h-5 w-5 text-sky-300" />
            <div className="min-w-0 flex-1">
              <h2 className="font-medium text-white">3. Temporary audio mode — stream, do not store</h2>'''
if section_marker not in text:
    raise SystemExit('temporary audio section marker not found')

rollback_section = '''        {summary?.hasRollbackSnapshot ? (
          <section className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.04] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-rose-300" />
              <div className="flex-1">
                <h2 className="font-medium text-white">3. Rollback draft master timing</h2>
                <p className="mt-1 text-sm leading-6 text-white/60">
                  Restore the subtitle/timing state captured immediately before the private alignment replaced master timing. The private production source stays linked.
                </p>
                {summary.rollbackCapturedAt ? (
                  <p className="mt-2 text-xs text-white/45">Snapshot captured: {new Date(summary.rollbackCapturedAt).toLocaleString()}</p>
                ) : null}

                <label className="mt-4 flex items-start gap-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={confirmRollback}
                    onChange={(event) => setConfirmRollback(event.target.checked)}
                    className="mt-1"
                  />
                  <span>I understand this restores the captured caption/timing state for this release.</span>
                </label>

                <button
                  type="button"
                  disabled={!confirmRollback || rollbackWorking}
                  onClick={() => void restoreRollbackSnapshot()}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-300/10 px-4 py-2.5 text-sm font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ShieldCheck className="h-4 w-4" /> {rollbackWorking ? 'Restoring…' : 'Restore captured timing'}
                </button>
              </div>
            </div>
          </section>
        ) : null}

'''
text = text.replace(section_marker, rollback_section + section_marker.replace('3. Temporary audio mode', '4. Temporary audio mode'), 1)

path.write_text(text)
print('patched rollback UI')
