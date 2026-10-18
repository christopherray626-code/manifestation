#!/usr/bin/env python3
"""Turns a downloaded recording (Pixabay etc.) into a seamless one-minute loop for the app.

    python3 scripts/import-sound.py <input file> <name> [start seconds]

Writes assets/sounds/<name>.mp3: 60 seconds from <start> (default 5, past any fade-in), where the last
3 seconds are blended into the first 3 (equal-power), so it loops with no seam or click. Levelled to a
consistent loudness, 128 kbps stereo, about 1 MB. Needs ffmpeg and numpy.
"""
import os, subprocess, sys, tempfile, wave
import numpy as np

RATE, LOOP, FADE = 44100, 60, 3
src, name = sys.argv[1], sys.argv[2]
start = float(sys.argv[3]) if len(sys.argv) > 3 else 5
out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds', f'{name}.mp3')

with tempfile.TemporaryDirectory() as tmp:
    raw, looped = os.path.join(tmp, 'raw.wav'), os.path.join(tmp, 'loop.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-t', str(LOOP + FADE), '-i', src,
                    '-af', 'loudnorm=I=-20:TP=-2:LRA=11', '-ar', str(RATE), '-ac', '2', '-c:a', 'pcm_s16le', raw],
                   check=True)
    with wave.open(raw) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2).astype(np.float32)
    n, f = LOOP * RATE, FADE * RATE
    if len(a) < n + f:
        sys.exit(f'{src} is too short: needs {LOOP + FADE}s from {start}s')
    body, tail = a[:n].copy(), a[n:n + f]
    k = np.linspace(0, 1, f)[:, None]
    body[:f] = body[:f] * np.sqrt(k) + tail * np.sqrt(1 - k)
    with wave.open(looped, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(np.clip(body, -32768, 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', looped, '-b:a', '128k', out], check=True)
print(os.path.normpath(out))
