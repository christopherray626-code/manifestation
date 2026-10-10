// Generates the looping background sounds in assets/sounds so we own them outright.
// Only smooth tones: generated noise (rain, ocean) sounds like static, so those need real recordings.
// Every frequency completes whole cycles in the loop, so the loops join without a click.
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
};

const dir = new URL('../assets/sounds/', import.meta.url);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
for (const [name, make] of Object.entries(sounds)) {
  writeFileSync(new URL(`${name}.wav`, dir), wav(normalize(make())));
  console.log(`assets/sounds/${name}.wav`);
}
