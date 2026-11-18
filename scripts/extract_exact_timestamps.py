from faster_whisper import WhisperModel
import json

model = WhisperModel("base", device="cpu", compute_type="int8")

print("--- Transcribing chunk_100_126.wav ---")
segments_1, _ = model.transcribe(r"scripts\chunk_100_126.wav", word_timestamps=True, beam_size=5)
words_1 = []
for seg in segments_1:
    print(f"[{100 + seg.start:.2f}s - {100 + seg.end:.2f}s] {seg.text}")
    for w in seg.words:
        words_1.append({"word": w.word, "start": round(100 + w.start, 2), "end": round(100 + w.end, 2), "prob": round(w.probability, 2)})

with open(r"scripts\words_24_31.json", "w", encoding="utf-8") as f:
    json.dump(words_1, f, indent=2, ensure_ascii=False)

print("\n--- Transcribing chunk_185_205.wav ---")
segments_2, _ = model.transcribe(r"scripts\chunk_185_205.wav", word_timestamps=True, beam_size=5)
words_2 = []
for seg in segments_2:
    print(f"[{185 + seg.start:.2f}s - {185 + seg.end:.2f}s] {seg.text}")
    for w in seg.words:
        words_2.append({"word": w.word, "start": round(185 + w.start, 2), "end": round(185 + w.end, 2), "prob": round(w.probability, 2)})

with open(r"scripts\words_52_54.json", "w", encoding="utf-8") as f:
    json.dump(words_2, f, indent=2, ensure_ascii=False)

print("Done extracting exact word timestamps!")
