import argparse, hashlib, json, math, re, sys, unicodedata, wave
from difflib import SequenceMatcher
from pathlib import Path
from faster_whisper import WhisperModel

def norm(s):
    s = unicodedata.normalize("NFKD", s or "").lower()
    # Speech recognition commonly drops Devanagari nukta while preserving the same Urdu sound.
    # Remove only nukta, not vowel matras, so lexical shape remains useful for matching.
    s = s.replace("\u093c", "")
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"[\[\]{}()<>*_#~|:;,.!?ØŸØŒâ€¦â€œâ€\"'â€˜â€™\-â€“â€”/\\]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def tokenize(s):
    return [x for x in norm(s).split(" ") if x]

def is_direction(line):
    t=(line or "").strip()
    if not t: return True
    if t.startswith("#"): return True
    if re.match(r"^\*\*\[.*\]\*\*$", t): return True
    if re.match(r"^\*\*.*:\*\*$", t): return True
    if re.match(r"^\[.*\]$", t): return True
    return False

def canonical_lines(text):
    out=[]
    for raw in text.splitlines():
        t=raw.strip()
        if is_direction(t): continue
        t=re.sub(r"^\*\*|\*\*$","",t).strip()
        if not t: continue
        toks=tokenize(t)
        if toks: out.append({"text":t,"tokens":toks})
    return out

def token_similarity(a, b):
    if a == b:
        return 1.0
    if not a or not b:
        return 0.0
    ratio = SequenceMatcher(None, a, b).ratio()
    if min(len(a), len(b)) >= 3 and (a in b or b in a):
        ratio = max(ratio, min(len(a), len(b)) / max(len(a), len(b)))
    return ratio

def global_token_alignment(canonical_tokens, asr_words):
    """Needleman-Wunsch alignment using fuzzy token similarity."""
    n, m = len(canonical_tokens), len(asr_words)
    gap = -0.32
    prev = [j * gap for j in range(m + 1)]
    trace = [bytearray(m + 1) for _ in range(n + 1)]
    for j in range(1, m + 1):
        trace[0][j] = 2
    for i in range(1, n + 1):
        curr = [i * gap] + [0.0] * m
        trace[i][0] = 1
        a = canonical_tokens[i - 1]
        for j in range(1, m + 1):
            sim = token_similarity(a, asr_words[j - 1]["norm"])
            diag = prev[j - 1] + (2.0 * sim - 1.0)
            up = prev[j] + gap
            left = curr[j - 1] + gap
            if diag >= up and diag >= left:
                curr[j] = diag
                trace[i][j] = 0
            elif up >= left:
                curr[j] = up
                trace[i][j] = 1
            else:
                curr[j] = left
                trace[i][j] = 2
        prev = curr

    mapping = {}
    similarities = {}
    i, j = n, m
    while i > 0 or j > 0:
        direction = trace[i][j] if i >= 0 and j >= 0 else 0
        if i > 0 and j > 0 and direction == 0:
            sim = token_similarity(canonical_tokens[i - 1], asr_words[j - 1]["norm"])
            if sim >= 0.28:
                mapping[i - 1] = j - 1
                similarities[i - 1] = sim
            i -= 1
            j -= 1
        elif i > 0 and (j == 0 or direction == 1):
            i -= 1
        elif j > 0:
            j -= 1
        else:
            break
    return mapping, similarities

def interpolate_word_timings(tokens, flat_indexes, mapping, asr_words, line_start, line_end):
    n = len(tokens)
    if n == 0:
        return []
    direct = {}
    for local_i, flat_i in enumerate(flat_indexes):
        if flat_i in mapping:
            w = asr_words[mapping[flat_i]]
            direct[local_i] = (float(w["start"]), float(w["end"]))

    out = []
    for i, tok in enumerate(tokens):
        if i in direct:
            st, en = direct[i]
        else:
            prev_i = max((k for k in direct if k < i), default=None)
            next_i = min((k for k in direct if k > i), default=None)
            left_t = direct[prev_i][1] if prev_i is not None else line_start
            right_t = direct[next_i][0] if next_i is not None else line_end
            left_pos = prev_i if prev_i is not None else -1
            right_pos = next_i if next_i is not None else n
            slots = max(1, right_pos - left_pos - 1)
            slot = i - left_pos - 1
            span = max(0.08 * slots, right_t - left_t)
            step = span / slots
            st = left_t + slot * step
            en = min(right_t, st + step)
        st = max(line_start, min(st, line_end - 0.02))
        en = max(st + 0.02, min(en, line_end))
        out.append({"text": tok, "startSeconds": round(st, 3), "endSeconds": round(en, 3)})
    if out:
        out[0]["startSeconds"] = round(line_start, 3)
        out[-1]["endSeconds"] = round(line_end, 3)
    return out

def build_aligned_lines(can, asr_words, duration):
    flat_tokens = []
    flat_meta = []
    for li, line in enumerate(can):
        for wi, tok in enumerate(line["tokens"]):
            flat_tokens.append(tok)
            flat_meta.append((li, wi))

    mapping, similarities = global_token_alignment(flat_tokens, asr_words)
    by_line = [[] for _ in can]
    flat_by_line = [[] for _ in can]
    for fi, (li, wi) in enumerate(flat_meta):
        flat_by_line[li].append(fi)
        if fi in mapping:
            by_line[li].append((wi, fi, mapping[fi], similarities[fi]))

    raw_times = [None] * len(can)
    anchor_scores = []
    anchor_count = 0
    for li, matches in enumerate(by_line):
        if not matches:
            continue
        anchors = [asr_words[aidx] for _, _, aidx, _ in matches]
        st = max(0.0, min(w["start"] for w in anchors) - 0.08)
        en = min(duration, max(w["end"] for w in anchors) + 0.08)
        if en <= st:
            en = min(duration, st + 0.15)
        score = sum(x[3] for x in matches) / len(matches)
        raw_times[li] = [st, en, score, True]
        anchor_scores.extend(x[3] for x in matches)
        anchor_count += 1

    # Fill runs of unanchored lines between real audio anchors.
    i = 0
    while i < len(can):
        if raw_times[i] is not None:
            i += 1
            continue
        run_start = i
        while i < len(can) and raw_times[i] is None:
            i += 1
        run_end = i - 1
        prev_idx = run_start - 1 if run_start > 0 else None
        next_idx = i if i < len(can) else None
        left = raw_times[prev_idx][1] if prev_idx is not None and raw_times[prev_idx] else 0.0
        # Never invent trailing lyric timing after the final recognized vocal anchor.
        # Those canonical lines were not performed in this recording and must remain unsung.
        if next_idx is None:
            continue
        right = raw_times[next_idx][0]
        if right <= left:
            right = min(duration, left + max(0.2, 0.25 * (run_end - run_start + 1)))
        weights = [max(1, len(can[k]["tokens"])) for k in range(run_start, run_end + 1)]
        total = sum(weights)
        cursor = left
        for k, weight in zip(range(run_start, run_end + 1), weights):
            frac = weight / total
            en = right if k == run_end else cursor + (right - left) * frac
            raw_times[k] = [cursor, max(cursor + 0.08, en), 0.0, False]
            cursor = raw_times[k][1]

    # Enforce monotonic non-overlapping line boundaries only for performed lines.
    previous_valid_idx = None
    for li in range(len(raw_times)):
        if raw_times[li] is None:
            continue
        st, en, score, anchored = raw_times[li]
        if previous_valid_idx is not None:
            prev_end = raw_times[previous_valid_idx][1]
            if st < prev_end:
                boundary = (st + prev_end) / 2.0
                raw_times[previous_valid_idx][1] = max(raw_times[previous_valid_idx][0] + 0.05, boundary)
                st = max(boundary, raw_times[previous_valid_idx][1])
        if en <= st:
            en = min(duration, st + 0.08)
        raw_times[li][0] = max(0.0, st)
        raw_times[li][1] = min(duration, en)
        previous_valid_idx = li

    lines = []
    performed_token_count = 0
    for li, line in enumerate(can):
        if raw_times[li] is None:
            continue
        st, en, score, anchored = raw_times[li]
        if en <= st:
            continue
        performed_token_count += len(line["tokens"])
        words = interpolate_word_timings(
            line["tokens"], flat_by_line[li], mapping, asr_words, st, en
        )
        lines.append({
            "lineIndex": li,
            "sourceLineIndex": li,
            "startSeconds": round(st, 3),
            "endSeconds": round(en, 3),
            "text": line["text"],
            "confidence": round(score, 4),
            "alignmentMode": "asr_anchor" if anchored else "interpolated_between_anchors",
            "words": words,
        })

    avg = sum(anchor_scores) / len(anchor_scores) if anchor_scores else 0.0
    performed_line_count = len(lines)
    performed_source_indexes = {line["sourceLineIndex"] for line in lines}
    performed_anchor_count = sum(1 for li in performed_source_indexes if by_line[li])
    performed_anchor_tokens = sum(
        len(by_line[li]) for li in performed_source_indexes
    )
    return lines, {
        "anchorLineCount": performed_anchor_count,
        "interpolatedLineCount": max(0, performed_line_count - performed_anchor_count),
        "unsungTrailingLineCount": max(0, len(can) - performed_line_count),
        "performedLineCount": performed_line_count,
        "anchorTokenCount": performed_anchor_tokens,
        "canonicalTokenCount": performed_token_count,
        "fullCanonicalLineCount": len(can),
        "fullCanonicalTokenCount": len(flat_tokens),
        "averageTokenMatchConfidence": avg,
    }

def ensure_ffmpeg_on_path():
    """audio-separator shells out to ffmpeg; a Node-launched Python may not have it on PATH."""
    import os, shutil
    if shutil.which("ffmpeg"):
        return
    candidates = []
    if os.environ.get("FFMPEG_BIN"):
        candidates.append(os.environ["FFMPEG_BIN"])
    local = os.environ.get("LOCALAPPDATA", "")
    if local:
        candidates.append(os.path.join(local, "Microsoft", "WinGet", "Links", "ffmpeg.exe"))
    for c in candidates:
        if c and os.path.exists(c):
            os.environ["PATH"] = os.path.dirname(c) + os.pathsep + os.environ.get("PATH", "")
            return

def isolate_vocals(audio_path, work_dir):
    """Strip the instruments so the speech model only hears the singing voice.
    Uses an ONNX MDX-Net vocal model via audio-separator. Returns the vocals WAV path,
    or None when the package/model is unavailable (caller falls back to the full mix)."""
    ensure_ffmpeg_on_path()
    try:
        from audio_separator.separator import Separator
    except Exception as e:
        print(f"[auto_align] vocal isolation unavailable: {e}", file=sys.stderr)
        return None
    work = Path(work_dir); work.mkdir(parents=True, exist_ok=True)
    existing = sorted(work.glob("*(Vocals)*.wav"))
    src = Path(audio_path)
    existing = [p for p in existing if p.stat().st_mtime >= src.stat().st_mtime]
    if existing:
        return str(existing[-1])
    try:
        sep = Separator(output_dir=str(work), output_single_stem="Vocals", log_level=30)
        sep.load_model("UVR-MDX-NET-Voc_FT.onnx")
        out = sep.separate(str(src))
        for name in out:
            p = Path(name) if Path(name).is_absolute() else work / name
            if p.exists():
                return str(p)
    except Exception as e:
        print(f"[auto_align] vocal isolation failed, using full mix: {e}", file=sys.stderr)
    return None

def pcm_audio_fingerprint(audio_path):
    """Hash decoded PCM frames for WAV masters so metadata/header-only revisions reuse ASR safely."""
    try:
        h = hashlib.sha256()
        with wave.open(str(audio_path), "rb") as wf:
            params = f"{wf.getnchannels()}|{wf.getsampwidth()}|{wf.getframerate()}|{wf.getnframes()}".encode("ascii")
            h.update(params)
            while True:
                chunk = wf.readframes(65536)
                if not chunk:
                    break
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        p = Path(audio_path)
        h = hashlib.sha256()
        with p.open("rb") as fh:
            for chunk in iter(lambda: fh.read(1024 * 1024), b""):
                h.update(chunk)
        return h.hexdigest()

def _pid_alive(pid):
    """True if a process with this pid exists (Windows-safe: never sends a signal)."""
    import os
    if pid <= 0:
        return False
    if os.name == "nt":
        import ctypes
        PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
        STILL_ACTIVE = 259
        h = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
        if not h:
            return False
        try:
            code = ctypes.c_ulong()
            ok = ctypes.windll.kernel32.GetExitCodeProcess(h, ctypes.byref(code))
            return bool(ok) and code.value == STILL_ACTIVE
        finally:
            ctypes.windll.kernel32.CloseHandle(h)
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False

def acquire_alignment_lock(output_path):
    """One alignment per draft at a time, across ALL callers (server, scripts, other sessions).
    Heavy duplicate runs starve each other for CPU and overwrite the same files."""
    import os, json, atexit, time
    lock = Path(output_path).parent / ".align.lock"
    if lock.exists():
        try:
            info = json.loads(lock.read_text(encoding="utf-8"))
        except Exception:
            info = {}
        other = int(info.get("pid", 0) or 0)
        if other and other != os.getpid() and _pid_alive(other):
            raise RuntimeError(
                f"Another alignment is already running for this draft (pid {other}, started {info.get('startedAt')}). "
                "Wait for it to finish instead of starting a duplicate."
            )
    lock.write_text(json.dumps({"pid": os.getpid(), "startedAt": time.strftime("%Y-%m-%dT%H:%M:%S")}), encoding="utf-8")
    def _release():
        try:
            if lock.exists() and json.loads(lock.read_text(encoding="utf-8")).get("pid") == os.getpid():
                lock.unlink()
        except Exception:
            pass
    atexit.register(_release)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--audio",required=True)
    ap.add_argument("--lyrics",required=True)
    ap.add_argument("--output",required=True)
    ap.add_argument("--model",default="large-v3")
    ap.add_argument("--language",default=None)
    ap.add_argument("--force-transcribe", action="store_true")
    ap.add_argument("--no-isolate", action="store_true", help="Skip vocal isolation (use the full mix)")
    ap.add_argument("--use-prompt", action="store_true", help="Feed the lyrics to Whisper as a prompt (can make it skip or hallucinate soft lines)")
    args=ap.parse_args()
    acquire_alignment_lock(args.output)

    lyrics=Path(args.lyrics).read_text(encoding="utf-8-sig")
    can=canonical_lines(lyrics)
    if not can:
        raise RuntimeError("No canonical lyric lines found.")

    cache_path = Path(args.output).with_suffix(".asr.json")
    audio_stat = Path(args.audio).stat()
    # Cache is valid for the same recognition model + language + decoded PCM content.
    # Header/metadata-only WAV revisions do not force expensive retranscription.
    pcm_sha = pcm_audio_fingerprint(args.audio)
    fingerprint = f"{args.model}|{args.language or ''}|pcm={pcm_sha}|iso={not args.no_isolate}|prompt={args.use_prompt}"
    asr_words=[]
    transcript=[]
    detected_language=args.language
    language_probability=1.0 if args.language else 0.0
    duration=0.0

    cached=None
    if cache_path.exists() and not args.force_transcribe:
        try:
            cached=json.loads(cache_path.read_text(encoding="utf-8"))
        except Exception:
            cached=None
        if cached and cached.get("fingerprint") != fingerprint:
            cached=None  # stale: different model or re-rendered master audio

    if cached:
        asr_words=cached.get("asrWords",[])
        transcript=[cached.get("transcript","")]
        detected_language=cached.get("detectedLanguage",detected_language)
        language_probability=float(cached.get("languageProbability",language_probability) or 0)
        duration=float(cached.get("durationSeconds",0) or 0)
    else:
        asr_audio = args.audio
        if not args.no_isolate:
            vocals = isolate_vocals(args.audio, Path(args.output).parent / "vocals")
            if vocals:
                asr_audio = vocals
                print(f"[auto_align] transcribing isolated vocals: {vocals}", file=sys.stderr)
        model=WhisperModel(args.model, device="cpu", compute_type="int8")
        segments, info=model.transcribe(
            asr_audio,
            language=args.language,
            beam_size=5,
            vad_filter=False,
            word_timestamps=True,
            condition_on_previous_text=True,
            initial_prompt=(lyrics[:4000] if args.use_prompt else None)
        )
        for seg in segments:
            transcript.append(seg.text.strip())
            for w in (seg.words or []):
                n=norm(w.word)
                if not n: continue
                asr_words.append({"text":w.word.strip(),"norm":n,"start":float(w.start),"end":float(w.end),"probability":float(getattr(w,"probability",0) or 0)})
        detected_language=getattr(info,"language",args.language)
        language_probability=float(getattr(info,"language_probability",0) or 0)
        duration=float(getattr(info,"duration",0) or 0)
        cache_path.write_text(json.dumps({
            "fingerprint":fingerprint,
            "model":args.model,
            "detectedLanguage":detected_language,
            "languageProbability":language_probability,
            "durationSeconds":duration,
            "transcript":" ".join(transcript).strip(),
            "asrWords":asr_words,
        },ensure_ascii=False),encoding="utf-8")

    if not asr_words:
        raise RuntimeError("Speech engine returned no timestamped words.")
    if duration <= 0:
        duration=max(w["end"] for w in asr_words)

    lines, metrics = build_aligned_lines(can, asr_words, duration)
    if not lines:
        raise RuntimeError("Could not align canonical lyrics to recognized vocals.")

    payload={
        "engine":"faster-whisper",
        "model":args.model,
        "detectedLanguage":detected_language,
        "languageProbability":language_probability,
        "durationSeconds":duration,
        "transcript":" ".join(transcript).strip(),
        "asrWordCount":len(asr_words),
        "canonicalLineCount":len(can),
        "performedLineCount":metrics["performedLineCount"],
        "unsungTrailingLineCount":metrics["unsungTrailingLineCount"],
        "alignedLineCount":len(lines),
        "anchorLineCount":metrics["anchorLineCount"],
        "interpolatedLineCount":metrics["interpolatedLineCount"],
        "anchorTokenCount":metrics["anchorTokenCount"],
        "canonicalTokenCount":metrics["canonicalTokenCount"],
        "fullCanonicalTokenCount":metrics["fullCanonicalTokenCount"],
        "anchorCoverage":round(metrics["anchorLineCount"]/max(1,metrics["performedLineCount"]),4),
        "tokenCoverage":round(metrics["anchorTokenCount"]/max(1,metrics["canonicalTokenCount"]),4),
        "averageMatchConfidence":round(metrics["averageTokenMatchConfidence"],4),
        "lines":lines
    }
    Path(args.output).write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")

if __name__=="__main__":
    try:
        main()
    except Exception as e:
        print(str(e),file=sys.stderr)
        sys.exit(1)
