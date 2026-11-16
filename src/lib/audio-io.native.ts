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

// Joined tapes are big WAV files (several MB each) that are only good for the session that made them.
// Each session writes into its own fresh folder, and whatever earlier sessions left behind is cleared
// away a file at a time, a few seconds in. (Deleting it all in one go could hold the whole app up for
// many seconds when a lot had piled up: a slow start, or a blank screen.)
let mixed: Directory | undefined;
function folder() {
  if (mixed) return mixed;
  const root = new Directory(Paths.cache, 'mixed');
  root.create({ idempotent: true, intermediates: true });
  const dir = new Directory(root, `s${Date.now().toString(36)}`);
  dir.create({ idempotent: true, intermediates: true });
  mixed = dir;
  sweep(root, dir.name);
  return dir;
}

function sweep(root: Directory, keep: string) {
  let old: (Directory | File)[];
  try {
    old = root.list().filter((item) => item.name !== keep);
  } catch {
    return;
  }
  const next = () => {
    const item = old.pop();
    if (!item) return;
    try {
      item.delete();
    } catch {
      // Still open somewhere; it goes next time.
    }
    setTimeout(next, 40);
  };
  setTimeout(next, 4000);
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
