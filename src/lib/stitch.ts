/*
 * Web only: joins a tape's voice clips into one continuous recording, so it plays from a single audio
 * element. Swapping clips on separate players let lines overlap and clicked at each change; one track
 * can't do either. Each clip has its silent ends trimmed and a tiny fade at both edges, then a set gap.
 */

const RATE = 24000; // plenty for a voice, and keeps the track small
const QUIET = 0.008; // below this counts as silence when trimming
const LEAD_SEC = 0.02; // kept before the first sound
const TAIL_SEC = 0.06; // kept after the last, so words don't get clipped
const FADE_IN_SEC = 0.01;
const FADE_OUT_SEC = 0.025;

const clips = new Map<string, Promise<Float32Array | null>>();

/** One clip, decoded at RATE, trimmed and faded. Kept for the session, so restarting is instant. */
function clip(uri: string) {
  let got = clips.get(uri);
  if (!got) {
    got = (async () => {
      try {
        const bytes = await (await fetch(uri)).arrayBuffer();
        const audio = await new OfflineAudioContext(1, 1, RATE).decodeAudioData(bytes);
        return shape(mono(audio));
      } catch {
        return null;
      }
    })();
    clips.set(uri, got);
  }
  return got;
}

function mono(audio: AudioBuffer) {
  if (audio.numberOfChannels === 1) return audio.getChannelData(0);
  const out = new Float32Array(audio.length);
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const data = audio.getChannelData(c);
    for (let i = 0; i < out.length; i++) out[i] += data[i] / audio.numberOfChannels;
  }
  return out;
}

function shape(data: Float32Array) {
  let first = 0;
  while (first < data.length && Math.abs(data[first]) < QUIET) first++;
  let last = data.length - 1;
  while (last > first && Math.abs(data[last]) < QUIET) last--;
  if (first >= last) return null;
  const out = data.slice(Math.max(first - LEAD_SEC * RATE, 0), Math.min(last + TAIL_SEC * RATE, data.length));
  const fadeIn = Math.min(FADE_IN_SEC * RATE, out.length / 2);
  const fadeOut = Math.min(FADE_OUT_SEC * RATE, out.length / 2);
  for (let i = 0; i < fadeIn; i++) out[i] *= i / fadeIn;
  for (let i = 0; i < fadeOut; i++) out[out.length - 1 - i] *= i / fadeOut;
  return out;
}

export type Stitched = {
  uri: string;
  /** Where each line starts, in seconds at normal speed, in playing order. */
  starts: number[];
  /** Which input each line came from, in playing order. */
  order: number[];
};

/**
 * Builds the track. `uris` are in tape order and play from `from`; the track ends with a gap so it loops
 * cleanly. With `layers` over 1 (subliminals), copies of the sequence overlap, each a fraction of the way
 * through, mixed into one loop.
 */
export async function stitch(uris: string[], from: number, gapMs: number, layers = 1): Promise<Stitched | null> {
  const rotated = uris.map((_, i) => (i + from) % uris.length);
  const decoded = await Promise.all(rotated.map((i) => clip(uris[i])));
  const gap = Math.round((gapMs / 1000) * RATE);
  const order: number[] = [];
  const startSamples: number[] = [];
  let length = 0;
  decoded.forEach((data, p) => {
    if (!data) return;
    order.push(rotated[p]);
    startSamples.push(length);
    length += data.length + gap;
  });
  if (!length) return null;

  const out = new Float32Array(length);
  for (let k = 0; k < layers; k++) {
    const shift = Math.floor((length * k) / layers);
    let at = 0;
    for (const data of decoded) {
      if (!data) continue;
      for (let i = 0; i < data.length; i++) out[(at + i + shift) % length] += data[i];
      at += data.length + gap;
    }
  }
  return {
    uri: URL.createObjectURL(wav(out)),
    starts: startSamples.map((s) => s / RATE),
    order,
  };
}

/** 16-bit mono WAV, which every browser plays and can slow down or speed up without changing pitch. */
function wav(data: Float32Array) {
  const buf = new ArrayBuffer(44 + data.length * 2);
  const v = new DataView(buf);
  const text = (at: number, s: string) => [...s].forEach((ch, i) => v.setUint8(at + i, ch.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + data.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, data.length * 2, true);
  for (let i = 0; i < data.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 0x7fff, true);
  return new Blob([buf], { type: 'audio/wav' });
}
