from faster_whisper import WhisperModel
import wave

vocal_wav = r".data\pipeline-drafts\draft_1794752884539_0eb391d5\alignment\vocals\master_rev1_(Vocals)_UVR-MDX-NET-Voc_FT.wav"

with wave.open(vocal_wav, 'rb') as w:
    sr = w.getframerate()
    ch = w.getnchannels()
    sampwidth = w.getsampwidth()
    w.setpos(int(185 * sr))
    frames = w.readframes(int(20 * sr))

chunk_path = r"scripts\chunk_185_205.wav"
with wave.open(chunk_path, 'wb') as out:
    out.setnchannels(ch)
    out.setsampwidth(sampwidth)
    out.setframerate(sr)
    out.writeframes(frames)

model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe(chunk_path, beam_size=5)

print("Segments in 185s-205s:")
for seg in segments:
    print(f"[{185 + seg.start:.2f}s - {185 + seg.end:.2f}s] {seg.text}")
