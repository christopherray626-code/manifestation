import { Directory, File, Paths } from 'expo-file-system';
import { decodeAudioData } from 'react-native-audio-api';

import type { Decoded } from '@/lib/audio-io';

/*
 * The phone version of audio-io.ts: react-native-audio-api decodes (MP3, WAV and more) into samples, and
 * joined tapes and blended loops are written to the cache folder as WAV files for the player to open.
 */

export type { Decoded };

export async function decode(uri: string, sampleRate?: number): Promise<Decoded | null> {
  try {
    const audio = await decodeAudioData(uri, sampleRate);
    return {
      channels: Array.from({ length: audio.numberOfChannels }, (_, c) => audio.getChannelData(c)),
      sampleRate: audio.sampleRate,
    };
  } catch {
    return null;
  }
}

function folder() {
  const dir = new Directory(Paths.cache, 'mixed');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

let count = 0;

/** Writes the WAV to the cache folder and returns its file address. */
export async function playable(wav: ArrayBuffer, name: string): Promise<string> {
  // A fresh name each time, so a player never reopens an older file of the same name from its cache.
  const file = new File(folder(), `${name}-${Date.now().toString(36)}-${count++}.wav`);
  file.create({ overwrite: true });
  file.write(new Uint8Array(wav));
  return file.uri;
}

export function release(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Already gone.
  }
}
