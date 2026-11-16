/*
 * Turning sound files into raw samples and back, so tapes can be joined and loops blended in JavaScript.
 * This is the web version (the browser's own audio engine); audio-io.native.ts does the same on phones.
 */

/** A decoded sound: one Float32Array of samples per channel. */
export type Decoded = { channels: Float32Array[]; sampleRate: number };

/** Decodes a sound file (a URL), resampled to `sampleRate` when given. Null if it can't be read. */
export async function decode(uri: string, sampleRate?: number): Promise<Decoded | null> {
  try {
    const bytes = await (await fetch(uri)).arrayBuffer();
    const ctx = new OfflineAudioContext(1, 1, sampleRate ?? 44100);
    const audio = await ctx.decodeAudioData(bytes);
    return {
      channels: Array.from({ length: audio.numberOfChannels }, (_, c) => audio.getChannelData(c)),
      sampleRate: audio.sampleRate,
    };
  } catch {
    return null;
  }
}

/** Something a player can open, made from WAV bytes. `name` is ignored on the web. */
export async function playable(wav: ArrayBuffer, _name: string): Promise<string> {
  return URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
}

/** Phones keep blended loops between launches (see audio-io.native.ts); the web blends in memory. */
export function keptLoop(_key: string): string | null {
  return null;
}
export async function keepLoop(wav: ArrayBuffer, key: string): Promise<string> {
  return playable(wav, key);
}

/** Frees what `playable` made once nothing plays it any more. */
export function release(uri: string) {
  URL.revokeObjectURL(uri);
}
