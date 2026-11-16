import { Directory, File, Paths } from 'expo-file-system';
import { AppState, Platform } from 'react-native';

import { later } from '@/lib/clock';
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

/**
 * Waits `ms`. With the app closed on a phone, Android pauses JavaScript timers, so a plain timeout would
 * stop voice-making until the app is opened again. There, a short pacing pause is skipped, and a longer
 * one also ends when the app comes back.
 */
function wait(ms: number, skipWhenClosed = false) {
  if (skipWhenClosed && !isWeb && AppState.currentState !== 'active') return Promise.resolve();
  // later() is also run by the playing tape's own clock (see clock.ts), and when the app comes back.
  return new Promise<void>((r) => later(ms, r));
}
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

/** Why a request to the voice server failed, in words. */
async function failure(res: Response) {
  let message = `The voice server answered ${res.status}.`;
  const body = await res.text().catch(() => '');
  try {
    message = (JSON.parse(body) as { error?: string }).error ?? message;
  } catch {
    // Not from our voice server: Vercel stopped the request before it got there.
    if (res.status === 403 || res.status === 429)
      message = `Vercel blocked the voice request (${res.status}). Its firewall or bot protection may be on, or too many lines were asked for at once. Try again in a minute.`;
  }
  return new Error(message);
}

/** Asks the voice server, waiting and trying again while Vercel turns requests away. Null if they moved on. */
async function ask(body: object, onWait?: (seconds: number) => void, stopped?: () => boolean): Promise<Response | null> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${SERVER}/api/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status !== 403 && res.status !== 429) return res;
    const pause = BACKOFF_MS[attempt] ?? PATIENT_MS;
    onWait?.(pause / 1000);
    await wait(pause);
    if (stopped?.()) return null;
  }
}

type Line = { text: string; previous?: string; next?: string };

/** Makes several lines with one request and saves each. Returns how many were saved, and why any weren't. */
async function makeBatch(lines: Line[], voice: Voice, onWait?: (seconds: number) => void, stopped?: () => boolean) {
  // The lines either side help the voice read each one as part of one flowing script.
  const res = await ask({ voice, lines: lines.map((l) => ({ ...l, text: l.text.trim() })) }, onWait, stopped);
  if (!res) return { saved: 0, problem: '' };
  if (!res.ok) throw await failure(res);
  const { clips } = (await res.json()) as { clips?: ({ audio: string } | { error: string })[] };
  let saved = 0;
  let problem = '';
  for (let i = 0; i < lines.length; i++) {
    const clip = clips?.[i];
    if (clip && 'audio' in clip) {
      await keep(Uint8Array.from(atob(clip.audio), (c) => c.charCodeAt(0)), lines[i].text, voice);
      saved++;
    } else problem ||= clip?.error ?? 'The voice server skipped a line.';
  }
  // Keep what worked; say why the rest didn't.
  return { saved, problem };
}

/** Saves a line's audio on this device (the browser's cache on the web). */
async function keep(bytes: Uint8Array<ArrayBuffer>, text: string, voice: Voice) {
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

// Lines asked for in one request, and the pause between requests, so a long tape is a few gentle
// requests rather than a flood of them (which Vercel's own protection slows down).
const BATCH = 5;
const REQUEST_GAP_MS = 1200;
// Shared copies are downloaded this many at a time (plain files, no firewall in front of them).
const SHARED_AT_ONCE = 4;

/**
 * Makes any missing audio, reporting how many lines are done. Lines made before (on any device) come
 * straight from shared storage first; the rest are made in order, a few per request, gently.
 */
export async function prepareVoice(
  texts: string[],
  voice: Voice,
  onProgress: (done: number, total: number) => void,
  onWait?: (seconds: number) => void,
  /** Checked between steps: true stops making the rest (they switched track or voice). */
  stopped?: () => boolean,
) {
  if (isWeb && voice !== 'my-voice' && naturalVoices) await loadSaved(texts, voice);
  const missing = texts.filter((t) => !voiceAudioUri(t, voice));
  const total = missing.length;
  let done = 0;
  onProgress(0, total);

  const left = new Set<string>();
  for (let i = 0; i < missing.length; i += SHARED_AT_ONCE) {
    if (stopped?.()) return;
    await Promise.all(
      missing.slice(i, i + SHARED_AT_ONCE).map(async (t) => {
        const res = await fromShared(t, voice);
        if (!res) return void left.add(t);
        await keep(new Uint8Array(await res.arrayBuffer()), t, voice);
        onProgress(++done, total);
      }),
    );
  }

  const toMake = missing.filter((t) => left.has(t));
  let problem = '';
  for (let i = 0; i < toMake.length; i += BATCH) {
    if (stopped?.()) return;
    const batch = toMake.slice(i, i + BATCH).map((t) => {
      const at = texts.indexOf(t);
      return { text: t, previous: texts[at - 1], next: texts[at + 1] };
    });
    const made = await makeBatch(batch, voice, onWait, stopped);
    if (stopped?.()) return;
    done += made.saved;
    onProgress(done, total);
    // One line that can't be made (too long, say) used to stop every line after it, for good. Carry on
    // while the others are working; stop only when nothing in a request could be made (no credits,
    // server trouble), and say why at the end either way.
    problem ||= made.problem;
    if (made.problem && !made.saved) break;
    if (i + BATCH < toMake.length) await wait(REQUEST_GAP_MS, true);
  }
  if (problem) throw new Error(problem);
}
