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

// Joined tapes and blended loops are big WAV files (several MB each) that are only good for the
// session that made them. Clear out the last session's once, the first time the folder is used, or
// they pile up by the hundreds of megabytes.
let mixed: Directory | undefined;
function folder() {
  if (mixed) return mixed;
  const dir = new Directory(Paths.cache, 'mixed');
  try {
    if (dir.exists) dir.delete();
  } catch {
    // Something's still open; it goes next time.
  }
  dir.create({ idempotent: true, intermediates: true });
  mixed = dir;
  return dir;
}

/*
 * Blended background loops are the exception: the same sound always blends to the same file, and making
 * one is a second or two of heavy work on a ten-megabyte file. They're kept in their own folder between
 * launches, so that work happens once per sound instead of every time the app opens.
 */
let loops: Directory | undefined;
function loopFolder() {
  if (!loops) {
    loops = new Directory(Paths.cache, 'loops');
    loops.create({ idempotent: true, intermediates: true });
  }
  return loops;
}

/** A loop kept from an earlier launch, if there is one. */
export function keptLoop(key: string): string | null {
  try {
    const file = new File(loopFolder(), `${key}.wav`);
    return file.exists && (file.size ?? 0) > 44 ? file.uri : null;
  } catch {
    return null;
  }
}

/** Saves a loop to keep. Written under another name first, so a half-written file is never kept. */
export async function keepLoop(wav: ArrayBuffer, key: string): Promise<string> {
  const part = new File(loopFolder(), `${key}.part`);
  part.create({ overwrite: true });
  part.write(new Uint8Array(wav));
  const file = new File(loopFolder(), `${key}.wav`);
  if (file.exists) file.delete();
  part.move(file);
  return file.uri;
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
