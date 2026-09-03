from pathlib import Path
import re

path = Path('app/(public)/release-detail/[slug]/page.tsx')
text = path.read_text()

import_needle = 'import SufiPulsePlayer from "@/components/SufiPulsePlayer";\n'
import_add = (
    import_needle
    + 'import TemporaryStreamAudioPlayer from "@/app/components/release/TemporaryStreamAudioPlayer";\n'
    + 'import { useRuntimeReleaseMedia } from "./components/useRuntimeReleaseMedia";\n'
)
if 'useRuntimeReleaseMedia' not in text:
    if import_needle not in text:
        raise SystemExit('SufiPulsePlayer import needle not found')
    text = text.replace(import_needle, import_add, 1)

state_needle = '  const [release, setRelease] = useState<any>(null);\n'
state_add = state_needle + '  const { media: runtimeMedia } = useRuntimeReleaseMedia(release?.id);\n'
if 'media: runtimeMedia' not in text:
    if state_needle not in text:
        raise SystemExit('release state needle not found')
    text = text.replace(state_needle, state_add, 1)

audio_pattern = re.compile(
    r'            \{/\* Audio Player — shown for audio-format releases with an audioUrl \*/\}.*?(?=            \{/\* Video Player - Hero Position \*/\})',
    re.S,
)
audio_replacement = '''            {/* Temporary audio-first release playback. The browser only receives the
                SufiPulse relay URL; no provider URL or downloadable audio asset is exposed. */}
            {runtimeMedia?.mode === "audio_stream" && runtimeMedia.audioUrl && (
              <div className="mb-8">
                <div className="relative">
                  <TemporaryStreamAudioPlayer
                    title={release.release_title || release.title || "SufiPulse Audio Release"}
                    audioUrl={runtimeMedia.audioUrl}
                    durationLabel={release.durationFormatted || release.duration_formatted || undefined}
                    onReady={(adapter) => {
                      setPlayerTarget(adapter);
                      setVideoLoaded(true);
                      setVideoReady(true);
                    }}
                    onPlayingChange={(playing) => {
                      setIsPlaying(playing);
                      if (playing) setIsVideoEnded(false);
                    }}
                    onDurationChange={(duration) => setVideoDuration(duration)}
                  />
                  {videoReady && activeOverlayTrack && (
                    <VideoOverlay
                      track={activeOverlayTrack}
                      currentTime={currentTime}
                      captionsEnabled={captionsEnabled}
                    />
                  )}
                </div>
              </div>
            )}

'''
text, count = audio_pattern.subn(audio_replacement, text, count=1)
if count != 1:
    raise SystemExit(f'audio block replacement count={count}')

old_guard = '''            {!release.audioUrl &&
            (resolvedVideoId ||'''
new_guard = '''            {runtimeMedia?.mode !== "audio_stream" &&
            (resolvedVideoId ||'''
if old_guard not in text:
    raise SystemExit('video guard needle not found')
text = text.replace(old_guard, new_guard, 1)

path.write_text(text)
print('patched', path)
