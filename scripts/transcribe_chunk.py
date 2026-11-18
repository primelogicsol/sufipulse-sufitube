import os
from faster_whisper import WhisperModel
import wave

# Cut 100s to 128s from the isolated vocal wav
vocal_wav = r".data\pipeline-drafts\draft_1794752884539_0eb391d5\alignment\vocals\master_rev1_(Vocals)_UVR-MDX-NET-Voc_FT.wav"

with wave.open(vocal_wav, 'rb') as w:
    sr = w.getframerate()
    ch = w.getnchannels()
    sampwidth = w.getsampwidth()
    w.setpos(int(100 * sr))
    frames = w.readframes(int(26 * sr))

chunk_path = r"scripts\chunk_100_126.wav"
with wave.open(chunk_path, 'wb') as out:
    out.setnchannels(ch)
    out.setsampwidth(sampwidth)
    out.setframerate(sr)
    out.writeframes(frames)

print(f"Extracted 26s chunk to {chunk_path}")

# Run faster-whisper on this chunk
model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe(chunk_path, language="hi", beam_size=5)

print(f"Detected language: {info.language}")
print("Segments in 100s-126s:")
for seg in segments:
    print(f"[{100 + seg.start:.2f}s - {100 + seg.end:.2f}s] {seg.text}")
