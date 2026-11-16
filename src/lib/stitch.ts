import { AppState } from 'react-native';

import { decode, playable } from '@/lib/audio-io';
import { wav } from '@/lib/wav';

/*
 * Joins a tape's voice clips into one continuous recording, so it plays from a single player (on the web
 * and on phones; audio-io does the decoding and saving for each). Swapping clips on separate players let lines overlap and clicked at each change; one track
 * can't do either. Each clip has its silent ends trimmed and a tiny fade at both edges, then a set gap.
 */

const RATE = 24000; // plenty for a voice, and keeps the track small
const QUIET = 0.008; // below this counts as silence when trimming
const LEAD_SEC = 0.02; // kept before the first sound
const TAIL_SEC = 0.06; // kept after the last, so words don't get clipped
const FADE_IN_SEC = 0.01;
const FADE_OUT_SEC = 0.025;
// Mixing layers: how long one burst of work runs before the app gets a turn, and how many samples are
// done between looks at the clock.
const BURST_MS = 10;
const BURST_SAMPLES = 40000;

const clips = new Map<string, Promise<Float32Array | null>>();

/** One clip, decoded at RATE, trimmed and faded. Kept for the session, so restarting is instant. */
function clip(uri: string) {
  let got = clips.get(uri);
  if (!got) {
    got = (async () => {
      try {
        const audio = await decode(uri, RATE);
        return audio ? shape(mono(audio.channels)) : null;
      } catch {
        return null;
      }
    })();
    clips.set(uri, got);
  }
  return got;
}

function mono(channels: Float32Array[]) {
  if (channels.length === 1) return channels[0];
  const out = new Float32Array(channels[0].length);
  for (const data of channels) {
    for (let i = 0; i < out.length; i++) out[i] += data[i] / channels.length;
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
 * into one loop, each in a slightly different pitch, level and place between the ears: up to 20 for a
 * subliminal, or, with `voiced`, up to 3 clearer voices for a layered spoken tape.
 */
export async function stitch(
  uris: string[],
  from: number,
  gapMs: number,
  layers = 1,
  voiced = false,
  /** Checked as the mixing goes: true gives up (something newer was asked for meanwhile). */
  cancelled?: () => boolean,
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

  if (layers > 1) {
    // Stereo, so the extra voices can sit to the sides.
    const left = new Float32Array(length);
    const right = new Float32Array(length);
    const used = voiced ? VOICINGS.slice(0, layers) : subliminalVoicings(layers);
    const level = voiced
      ? 1 / Math.max(1, used.reduce((n, v) => n + v.gain, 0) * 0.75)
      : // Many overlapping voices add up; scale so 20 layers sit near the loudness 3 do.
        (layers > 3 ? Math.pow(3 / layers, 0.75) : 1) / (used.reduce((n, v) => n + v.gain, 0) / layers);
    // Mixing is millions of sums (every sample of every layer). Done in one go it froze the app for
    // seconds each time a part of a long tape was made, so taps and sliders did nothing meanwhile. It
    // now works in bursts of about a hundredth of a second and lets the app answer in between. Not with
    // the app closed: Android pauses JavaScript timers then, and the next part would never be ready.
    let since = Date.now();
    const breathe = async () => {
      if (Date.now() - since < BURST_MS || AppState.currentState !== 'active') return;
      await new Promise((r) => setTimeout(r, 0));
      since = Date.now();
    };
    for (const [k, v] of used.entries()) {
      const l = v.gain * level * Math.cos(((v.pan + 1) * Math.PI) / 4) * Math.SQRT2;
      const r = v.gain * level * Math.sin(((v.pan + 1) * Math.PI) / 4) * Math.SQRT2;
      const n = Math.floor(length / v.rate);
      const rate = v.rate;
      let o = Math.floor((length * k) / layers) % length;
      for (let from = 0; from < n; from += BURST_SAMPLES) {
        await breathe();
        if (cancelled?.()) return null;
        const to = Math.min(n, from + BURST_SAMPLES);
        if (rate === 1) {
          for (let j = from; j < to; j++) {
            const s = seq[j];
            left[o] += s * l;
            right[o] += s * r;
            if (++o === length) o = 0;
          }
        } else {
          for (let j = from; j < to; j++) {
            // Reading faster raises the pitch, slower lowers it.
            const x = j * rate;
            const i = x | 0;
            const a = seq[i];
            const s = i + 1 < length ? a + (seq[i + 1] - a) * (x - i) : a;
            left[o] += s * l;
            right[o] += s * r;
            if (++o === length) o = 0;
          }
        }
      }
    }
    await breathe();
    const bytes = wav([left, right], RATE);
    await breathe();
    return { uri: await playable(bytes, 'tape'), starts: startSamples.map((s) => s / RATE), order };
  }

  return {
    uri: await playable(wav([seq], RATE), 'tape'),
    starts: startSamples.map((s) => s / RATE),
    order,
  };
}

/**
 * Subliminal layers, each a little different, as r/Subliminal advises: its own slight pitch (up to about
 * 8% up or down), its own level, and its own place between the ears, so a stack sounds like a soft crowd
 * instead of one smeared voice. The first layer stays at normal pitch, full level and centred.
 */
function subliminalVoicings(layers: number) {
  return Array.from({ length: layers }, (_, k) => {
    if (k === 0) return { rate: 1, gain: 1, pan: 0 };
    // Spread evenly but unordered (golden-ratio steps), so neighbouring layers differ.
    const a = (k * 0.618034) % 1;
    const b = (k * 0.754878 + 0.3) % 1;
    const c = (k * 0.569840 + 0.6) % 1;
    return { rate: 1 + (a * 2 - 1) * 0.08, gain: 0.55 + b * 0.45, pan: (c * 2 - 1) * 0.8 };
  });
}
