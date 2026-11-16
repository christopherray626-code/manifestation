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

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Vercel's firewall starts turning requests away when many arrive in a row. Back off and try again
// rather than failing the whole tape: 3, 8, 15 and 30 seconds.
const BACKOFF_MS = [3000, 8000, 15000, 30000];
// After those, keep trying every minute rather than giving up: the firewall lets requests through again
// once it calms down, and a tape that's already playing can wait for its remaining lines.
const PATIENT_MS = 60000;

// Where lines made before (by anyone, on any device) can be downloaded straight from shared storage,
// skipping the voice server and the firewall in front of it. Asked once; null when it isn't set up.
let sharedBase: Promise<string | null> | null = null;
function shared() {
  sharedBase ??= fetch(`${SERVER}/api/voice`)
    .then((r) => (r.ok ? (r.json() as Promise<{ shared?: string | null }>) : null))
    .then((info) => info?.shared ?? null)
    .catch(() => null)
    .then((base) => {
      // Ask again next time if it couldn't be reached, rather than giving up for the whole session.
      if (!base) setTimeout(() => (sharedBase = null), 60000);
      return base;
    });
  return sharedBase;
}

/** The line's shared copy, if it was made before. */
async function fromShared(text: string, voice: Voice) {
  const base = await shared();
  if (!base) return null;
  try {
    const res = await fetch(base + fileName(text, voice));
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

async function makeOne(
  text: string,
  voice: Voice,
  previous?: string,
  next?: string,
  onWait?: (seconds: number) => void,
  stopped?: () => boolean,
) {
  const res = (await fromShared(text, voice)) ?? (await askServer(text, voice, previous, next, onWait, stopped));
  if (!res) return;
  if (!res.ok) {
    let message = `The voice server answered ${res.status}.`;
    const body = await res.text().catch(() => '');
    try {
      message = (JSON.parse(body) as { error?: string }).error ?? message;
    } catch {
      // Not from our voice server: Vercel stopped the request before it got there.
      if (res.status === 403 || res.status === 429)
        message = `Vercel blocked the voice request (${res.status}). Its firewall or bot protection may be on, or too many lines were asked for at once. Try again in a minute.`;
    }
    throw new Error(message);
  }
  await keep(res, text, voice);
}

async function askServer(
  text: string,
  voice: Voice,
  previous?: string,
  next?: string,
  onWait?: (seconds: number) => void,
  stopped?: () => boolean,
): Promise<Response | null> {
  let res: Response;
  for (let attempt = 0; ; attempt++) {
    res = await fetch(`${SERVER}/api/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The lines either side help the voice read it as part of one flowing script.
      body: JSON.stringify({ text: text.trim(), voice, previous, next }),
    });
    const blocked = res.status === 403 || res.status === 429;
    if (!blocked) break;
    const pause = BACKOFF_MS[attempt] ?? PATIENT_MS;
    onWait?.(pause / 1000);
    await wait(pause);
    if (stopped?.()) return null;
  }
  return res;
}

/** Saves a line's audio on this device (the browser's cache on the web). */
async function keep(res: Response, text: string, voice: Voice) {
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

// Between lines, so a long tape doesn't look like a flood of requests to the firewall.
const LINE_GAP_MS = 900;

/** Makes any missing audio one line at a time, gently, reporting how many are done. */
export async function prepareVoice(
  texts: string[],
  voice: Voice,
  onProgress: (done: number, total: number) => void,
  onWait?: (seconds: number) => void,
  /** Checked before each line: true stops making the rest (they switched track or voice). */
  stopped?: () => boolean,
) {
  if (isWeb && voice !== 'my-voice' && naturalVoices) await loadSaved(texts, voice);
  const missing = texts.filter((t) => !voiceAudioUri(t, voice));
  let done = 0;
  onProgress(0, missing.length);
  for (const t of missing) {
    if (stopped?.()) return;
    const at = texts.indexOf(t);
    await makeOne(t, voice, texts[at - 1], texts[at + 1], onWait, stopped);
    if (stopped?.()) return;
    done++;
    onProgress(done, missing.length);
    // A short pause between lines, so a long mix doesn't look like a flood of requests.
    if (done < missing.length) await wait(LINE_GAP_MS);
  }
}
