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
 * How each extra voice in a layered spoken tape differs from the main one: pitch (as a playback rate),
 * level, and where it sits between the ears (-1 left, 1 right). The main voice stays clear and centred.
 */
const VOICINGS = [
  { rate: 1, gain: 1, pan: 0 },
  { rate: 0.94, gain: 0.5, pan: -0.65 },
  { rate: 1.06, gain: 0.42, pan: 0.65 },
];

/**
 * Builds the track. `uris` are in tape order and play from `from`; the track ends with a gap so it loops
 * cleanly. With `layers` over 1, copies of the sequence overlap, each a fraction of the way through, mixed
 * into one loop: identical copies for subliminals, or, with `voiced`, copies in a slightly different
 * pitch, quieter and to either side, for a layered spoken tape.
 */
export async function stitch(
  uris: string[],
  from: number,
  gapMs: number,
  layers = 1,
  voiced = false,
): Promise<Stitched | null> {
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

  const seq = new Float32Array(length);
  let at = 0;
  for (const data of decoded) {
    if (!data) continue;
    seq.set(data, at);
    at += data.length + gap;
  }

  if (voiced && layers > 1) {
    // Stereo, so the extra voices can sit to the sides.
    const left = new Float32Array(length);
    const right = new Float32Array(length);
    const used = VOICINGS.slice(0, layers);
    const level = 1 / Math.max(1, used.reduce((n, v) => n + v.gain, 0) * 0.75);
    used.forEach((v, k) => {
      const shift = Math.floor((length * k) / layers);
      const l = v.gain * level * Math.cos(((v.pan + 1) * Math.PI) / 4);
      const r = v.gain * level * Math.sin(((v.pan + 1) * Math.PI) / 4);
      const n = Math.floor(length / v.rate);
      for (let j = 0; j < n; j++) {
        // Reading faster raises the pitch, slower lowers it.
        const x = j * v.rate;
        const i = Math.floor(x);
        const s = i + 1 < length ? seq[i] + (seq[i + 1] - seq[i]) * (x - i) : seq[i] ?? 0;
        const o = (j + shift) % length;
        left[o] += s * l * Math.SQRT2;
        right[o] += s * r * Math.SQRT2;
      }
    });
    return { uri: URL.createObjectURL(wav([left, right])), starts: startSamples.map((s) => s / RATE), order };
  }

  const out = new Float32Array(length);
  for (let k = 0; k < layers; k++) {
    const shift = Math.floor((length * k) / layers);
    for (let i = 0; i < length; i++) out[(i + shift) % length] += seq[i];
  }
  return {
    uri: URL.createObjectURL(wav([out])),
    starts: startSamples.map((s) => s / RATE),
    order,
  };
}

/** 16-bit WAV (mono or stereo), which every browser plays and can speed up without changing pitch. */
function wav(channels: Float32Array[]) {
  const n = channels.length;
  const frames = channels[0].length;
  const bytes = frames * n * 2;
  const buf = new ArrayBuffer(44 + bytes);
  const v = new DataView(buf);
  const text = (at: number, s: string) => [...s].forEach((ch, i) => v.setUint8(at + i, ch.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + bytes, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, n, true);
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE * n * 2, true);
  v.setUint16(32, n * 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, bytes, true);
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < n; c++) {
      v.setInt16(44 + (i * n + c) * 2, Math.max(-1, Math.min(1, channels[c][i])) * 0x7fff, true);
    }
  }
  return new Blob([buf], { type: 'audio/wav' });
}
