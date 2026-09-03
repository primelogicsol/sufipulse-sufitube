from pathlib import Path

path = Path('app/admin/cms-releases/[id]/audio-alignment/page.tsx')
text = path.read_text()

if 'Probe one byte' in text and 'Export current CMS captions' in text:
    print('pilot controls already present')
    raise SystemExit(0)

preview_type = '''type PreviewLine = {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  section?: string;
  isProductionDirection: boolean;
};
'''
probe_type = preview_type + '''
type AudioProbeResult = {
  reachable: boolean;
  status?: number;
  partialContent?: boolean;
  contentType?: string | null;
  contentLength?: string | null;
  contentRange?: string | null;
  acceptRanges?: string | null;
  checkedAt?: string;
};
'''
if 'type AudioProbeResult' not in text:
    if preview_type not in text:
        raise SystemExit('PreviewLine type marker not found')
    text = text.replace(preview_type, probe_type, 1)

state_marker = '  const [rollbackWorking, setRollbackWorking] = useState(false);\n'
if 'probeWorking' not in text:
    if state_marker not in text:
        raise SystemExit('rollback state marker not found')
    text = text.replace(
        state_marker,
        state_marker + '  const [probeWorking, setProbeWorking] = useState(false);\n  const [probeResult, setProbeResult] = useState<AudioProbeResult | null>(null);\n',
        1,
    )

fn_marker = '  const restoreRollbackSnapshot = async () => {\n'
if 'const probeAudioStream' not in text:
    if fn_marker not in text:
        raise SystemExit('rollback function marker not found')
    probe_fn = '''  const probeAudioStream = async () => {
    try {
      setProbeWorking(true);
      setProbeResult(null);
      setError('');
      setMessage('');

      const response = await fetch(`/api/admin/releases/${encodeURIComponent(releaseId)}/audio-probe`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Probe failed with HTTP ${response.status}`);

      setProbeResult(data);
      setMessage(
        data.partialContent
          ? 'Private audio probe succeeded with HTTP byte-range support.'
          : 'Private audio probe succeeded. Upstream was reachable; byte-range support was not confirmed by this response.'
      );
    } catch (err: any) {
      setError(String(err?.message || err || 'Private audio probe failed.'));
    } finally {
      setProbeWorking(false);
    }
  };

'''
    text = text.replace(fn_marker, probe_fn + fn_marker, 1)

rollback_section_marker = '''        {summary?.hasRollbackSnapshot ? (
          <section className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.04] p-5">'''
if 'Export current CMS captions' not in text:
    if rollback_section_marker not in text:
        raise SystemExit('rollback section marker not found')
    export_section = '''        {summary ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-medium text-white">Export current CMS captions</h2>
                <p className="mt-1 text-sm text-white/55">
                  These exports come from the canonical CMS cue timeline. After draft timing is applied, SRT and VTT are generated from that same master rather than maintained as separate timelines.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/releases/${encodeURIComponent(releaseId)}/subtitles?format=srt&lang=${encodeURIComponent(language)}`}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:border-white/30 hover:text-white"
                >
                  Download SRT
                </a>
                <a
                  href={`/api/releases/${encodeURIComponent(releaseId)}/subtitles?format=vtt&lang=${encodeURIComponent(language)}`}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:border-white/30 hover:text-white"
                >
                  Download VTT
                </a>
              </div>
            </div>
          </section>
        ) : null}

'''
    text = text.replace(rollback_section_marker, export_section + rollback_section_marker, 1)

admin_stream_marker = '''              {summary && streamConfigured ? (
                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-white/45">Admin stream test</div>'''
if 'Probe one byte' not in text:
    if admin_stream_marker not in text:
        raise SystemExit('admin stream marker not found')
    probe_ui = '''              {summary && streamConfigured ? (
                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-white/45">Safe connectivity probe</div>
                      <p className="mt-1 text-xs text-white/45">Requests only bytes=0-0, reads response headers, then cancels the body.</p>
                    </div>
                    <button
                      type="button"
                      disabled={probeWorking}
                      onClick={() => void probeAudioStream()}
                      className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {probeWorking ? 'Probing…' : 'Probe one byte'}
                    </button>
                  </div>
                  {probeResult ? (
                    <div className="mt-3 grid gap-2 text-xs text-white/55 sm:grid-cols-2 lg:grid-cols-4">
                      <div>Status: <span className="text-white/80">{probeResult.status || '—'}</span></div>
                      <div>Range: <span className="text-white/80">{probeResult.partialContent ? 'confirmed' : 'not confirmed'}</span></div>
                      <div>Type: <span className="text-white/80">{probeResult.contentType || '—'}</span></div>
                      <div>Accept-Ranges: <span className="text-white/80">{probeResult.acceptRanges || '—'}</span></div>
                    </div>
                  ) : null}
                </div>
              ) : null}

'''
    text = text.replace(admin_stream_marker, probe_ui + admin_stream_marker, 1)

path.write_text(text)
print('patched pilot controls')
