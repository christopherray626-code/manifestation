import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { hash } from '@/lib/today';
import type { Voice } from '@/lib/types';

/*
 * Natural voices come from our small voice server (server/api/voice.ts), which asks ElevenLabs.
 * Each affirmation is made once per voice and saved on the phone, named after its text, so an
 * edited affirmation gets fresh audio and an unchanged one is never paid for twice.
 */

const isWeb = Platform.OS === 'web';
// The phone app needs the server's address. The web app is served by the same Vercel project as the voice
// server (see vercel.json), so on the web it can just ask its own site.
const SERVER = process.env.EXPO_PUBLIC_VOICE_SERVER?.replace(/\/$/, '') ?? (isWeb ? '' : undefined);

/** Whether natural voices are set up for this build. */
export const naturalVoices = SERVER !== undefined;

// Web has no file system: each clip is kept in the browser's Cache Storage (it survives closing the app, so a
// voice is only ever paid for once per browser), and turned into a playable URL here when it's needed.
const webAudio = new Map<string, string>();
const CACHE = 'manifest-voices-v1';
const cacheKey = (name: string) => `/voices/${name}`;
async function webCache() {
  try {
    return typeof caches !== 'undefined' ? await caches.open(CACHE) : null;
  } catch {
    return null; // private browsing and the like: fall back to this session only
  }
}
/** Loads clips saved on an earlier visit, so they count as made. */
async function loadSaved(texts: string[], voice: Voice) {
  const cache = await webCache();
  if (!cache) return;
  await Promise.all(
    texts.map(async (t) => {
      const name = fileName(t, voice);
      if (webAudio.has(name)) return;
      const hit = await cache.match(cacheKey(name));
      if (hit) webAudio.set(name, URL.createObjectURL(await hit.blob()));
    }),
  );
}

function folder() {
  const dir = new Directory(Paths.document, 'voices');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

function fileName(text: string, voice: Voice) {
  const t = text.trim();
  return `${voice}-${hash(t).toString(36)}-${t.length}.mp3`;
}

/** The saved natural-voice audio for this text, if it's been made already. */
export function voiceAudioUri(text: string, voice: Voice): string | undefined {
  if (voice === 'my-voice' || !naturalVoices) return undefined;
  const name = fileName(text, voice);
  if (isWeb) return webAudio.get(name);
  const file = new File(folder(), name);
  return file.exists ? file.uri : undefined;
}

async function makeOne(text: string, voice: Voice) {
  const res = await fetch(`${SERVER}/api/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.trim(), voice }),
  });
  if (!res.ok) {
    let message = `The voice server answered ${res.status}.`;
    try {
      message = ((await res.json()) as { error?: string }).error ?? message;
    } catch {
      // Not JSON; keep the status message.
    }
    throw new Error(message);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const name = fileName(text, voice);
  if (isWeb) {
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    webAudio.set(name, URL.createObjectURL(blob));
    try {
      await (await webCache())?.put(cacheKey(name), new Response(blob, { headers: { 'Content-Type': 'audio/mpeg' } }));
    } catch {
      // Storage full or blocked: it still plays this session.
    }
    return;
  }
  const file = new File(folder(), name);
  file.create({ overwrite: true });
  file.write(bytes);
}

/** Makes any missing audio, a few at a time, reporting how many are done. */
export async function prepareVoice(texts: string[], voice: Voice, onProgress: (done: number, total: number) => void) {
  if (isWeb && voice !== 'my-voice' && naturalVoices) await loadSaved(texts, voice);
  const missing = texts.filter((t) => !voiceAudioUri(t, voice));
  let done = 0;
  onProgress(0, missing.length);
  for (let i = 0; i < missing.length; i += 3) {
    await Promise.all(
      missing.slice(i, i + 3).map(async (t) => {
        await makeOne(t, voice);
        done++;
        onProgress(done, missing.length);
      }),
    );
  }
}
