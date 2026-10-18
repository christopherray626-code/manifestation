// Generates the looping background sounds in assets/sounds so we own them outright.
// Tones complete whole cycles in the loop, so they join without a click. Noise-based sounds (brown noise,
// ocean, rain) are made a little long and crossfaded end-into-start, so they loop seamlessly too.
// Run with: node scripts/make-sounds.mjs
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const RATE = 22050;
const SECONDS = 20;
const N = RATE * SECONDS;
const TAU = 2 * Math.PI;

function normalize(samples, peak = 0.5) {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  return samples.map((s) => (s / max) * peak);
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** Slow swell between `low` and 1 that repeats `times` per loop. */
function breathe(i, times, low, phase = 0) {
  return low + (1 - low) * (0.5 - 0.5 * Math.cos((TAU * times * i) / N + phase));
}

// Seeded, so running the script again makes the same files.
let seed = 7;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

const FADE = RATE * 2;

/** Makes N + FADE samples with `make`, then folds the extra tail over the start so the loop is seamless. */
function seamless(make) {
  const long = make(N + FADE);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) out[i] = long[i];
  for (let i = 0; i < FADE; i++) {
    const k = i / FADE;
    out[i] = long[i] * Math.sqrt(k) + long[N + i] * Math.sqrt(1 - k);
  }
  return out;
}

/** Deep, soft noise (like a distant waterfall). Leaky-integrated white noise. */
function brownNoise(len) {
  const out = new Float32Array(len);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (random() * 2 - 1)) / 1.02;
    out[i] = last;
  }
  return out;
}

/** One-pole low-pass, to soften noise. */
function lowPass(samples, cutoff) {
  const a = Math.exp((-TAU * cutoff) / RATE);
  let y = 0;
  return samples.map((x) => (y = (1 - a) * x + a * y));
}

const sounds = {
  // A warm, slowly shifting chord. Each note is two slightly detuned voices for a soft shimmer.
  pad: () => {
    const notes = [110, 164.8, 220, 261.6, 329.6];
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / RATE;
      let s = 0;
      notes.forEach((f, k) => {
        const tone = Math.sin(TAU * (f - 0.1) * t) + Math.sin(TAU * (f + 0.1) * t);
        s += (tone / (k + 2)) * breathe(i, 2, 0.4, k * 1.3);
      });
      out[i] = s;
    }
    return out;
  },
  // Singing bowls struck every few seconds, ringing out slowly.
  bowls: () => {
    const out = new Float32Array(N);
    const strikes = [
      { at: 0, f: 220 },
      { at: N / 3, f: 293.4 },
      { at: (2 * N) / 3, f: 246.95 },
    ];
    const partials = [
      { mult: 1, gain: 1, decay: 4 },
      { mult: 2.76, gain: 0.35, decay: 2.2 },
      { mult: 5.4, gain: 0.12, decay: 1.2 },
    ];
    for (let i = 0; i < N; i++) {
      let s = 0;
      for (const strike of strikes) {
        // Include the previous loop's strike so its ring carries across the loop point.
        for (const offset of [0, N]) {
          const since = (i + offset - strike.at) / RATE;
          if (since < 0 || since > SECONDS) continue;
          const attack = Math.min(1, since / 0.02);
          for (const p of partials) {
            s += attack * p.gain * Math.exp(-since / p.decay) * Math.sin(TAU * strike.f * p.mult * since);
          }
        }
      }
      out[i] = s;
    }
    return out;
  },
  // A low, steady hum that breathes slowly.
  hum: () => {
    const notes = [110, 165, 220];
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / RATE;
      let s = 0;
      for (const f of notes) s += Math.sin(TAU * f * t) / notes.length;
      out[i] = s * breathe(i, 4, 0.6);
    }
    return out;
  },
  // Steady brown noise: a deep, even rush that covers other sounds.
  brown: () => seamless((len) => lowPass(brownNoise(len), 500)),
  // Waves rolling in and out: brown noise that swells and falls about every 7 seconds.
  ocean: () =>
    seamless((len) => {
      const noise = lowPass(brownNoise(len), 700);
      const hiss = lowPass(Float32Array.from({ length: len }, () => random() * 2 - 1), 900);
      const out = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const t = i / RATE;
        // An uneven swell, so it doesn't sound like a machine: quick rise, long pull back.
        const phase = (t / 6.7) % 1;
        const swell = phase < 0.35 ? Math.sin((phase / 0.35) * (Math.PI / 2)) : Math.cos(((phase - 0.35) / 0.65) * (Math.PI / 2));
        out[i] = noise[i] * (0.35 + 0.65 * swell) + hiss[i] * 0.25 * swell * swell;
      }
      return out;
    }),
  // Soft steady rain: filtered noise with the odd nearby drop.
  rain: () =>
    seamless((len) => {
      const white = Float32Array.from({ length: len }, () => random() * 2 - 1);
      // Band-pass: keep the hiss of rain, drop the rumble and the harsh top.
      const low = lowPass(white, 300);
      const body = lowPass(white, 3200).map((x, i) => x - low[i]);
      const out = new Float32Array(len);
      for (let i = 0; i < len; i++) out[i] = body[i] * 0.6;
      // Drops: tiny, fast-fading ticks at random spots.
      for (let d = 0; d < 260; d++) {
        const at = Math.floor(random() * (len - 2000));
        const f = 1200 + random() * 1800;
        const gain = 0.08 + random() * 0.2;
        for (let k = 0; k < 1500; k++) out[at + k] += gain * Math.min(1, k / 30) * Math.exp(-k / 180) * Math.sin((TAU * f * k) / RATE);
      }
      return out;
    }),
  // A deep, slow drone, like floating in space.
  space: () => {
    const notes = [55, 82.5, 110, 165];
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / RATE;
      let s = 0;
      notes.forEach((f, k) => {
        s += (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * (f * 2 + 0.05) * t)) * breathe(i, 1, 0.3, k * 1.7) / (k + 1);
      });
      out[i] = s;
    }
    return out;
  },
  // Wind chimes: high, bright notes from a pentatonic scale, struck now and then.
  chimes: () => {
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const out = new Float32Array(N);
    const strikes = Array.from({ length: 18 }, () => ({ at: Math.floor(random() * N), f: scale[Math.floor(random() * scale.length)], gain: 0.4 + random() * 0.6 }));
    for (const strike of strikes) {
      for (let k = 0; k < RATE * 6; k++) {
        const i = (strike.at + k) % N; // wrap the ring past the loop point
        const since = k / RATE;
        const env = Math.min(1, since / 0.005) * Math.exp(-since / 1.6);
        out[i] += strike.gain * env * (Math.sin(TAU * strike.f * since) + 0.3 * Math.sin(TAU * strike.f * 2.76 * since) * Math.exp(-since));
      }
    }
    return out;
  },
};

/** 16-bit WAV from one channel, or two (left, right) for binaural beats. */
function wavChannels(channels) {
  const n = channels[0].length;
  const data = Buffer.alloc(n * 2 * channels.length);
  for (let i = 0; i < n; i++) {
    channels.forEach((ch, c) => {
      data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, ch[i])) * 32767), (i * channels.length + c) * 2);
    });
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels.length, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2 * channels.length, 28);
  header.writeUInt16LE(2 * channels.length, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// Frequencies: pure, steady tones to layer under a tape. Five-second loops are enough for a steady tone,
// and every frequency is a whole number of hertz, so each loop ends exactly where it began.
const FREQ_SECONDS = 5;
const FN = RATE * FREQ_SECONDS;
const tone = (hz, gain = 0.5) => Float32Array.from({ length: FN }, (_, i) => gain * Math.sin((TAU * hz * i) / RATE));
const frequencies = {
  'hz-396': () => [tone(396)],
  'hz-432': () => [tone(432)],
  'hz-528': () => [tone(528)],
  'hz-639': () => [tone(639)],
  'hz-741': () => [tone(741)],
  'hz-963': () => [tone(963)],
  // Binaural beats: a slightly different tone in each ear; the brain hears the difference as a slow pulse.
  // Only works on headphones.
  'beat-delta': () => [tone(200), tone(203)],
  'beat-theta': () => [tone(200), tone(206)],
  'beat-alpha': () => [tone(200), tone(210)],
};

const dir = new URL('../assets/sounds/', import.meta.url);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
for (const [name, make] of Object.entries(sounds)) {
  writeFileSync(new URL(`${name}.wav`, dir), wav(normalize(make())));
  console.log(`assets/sounds/${name}.wav`);
}
for (const [name, make] of Object.entries(frequencies)) {
  writeFileSync(new URL(`${name}.wav`, dir), wavChannels(make()));
  console.log(`assets/sounds/${name}.wav`);
}
