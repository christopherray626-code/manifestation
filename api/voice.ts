// The voice server, served from the same Vercel project as the web app. Self-contained on purpose:
// pulling code in from server/ (a separate module setup) crashed the function on Vercel.
// Runs on Vercel's edge runtime, which speaks plain Request/Response.
export const config = { runtime: 'edge' };

// Vercel environment variables:
//   ELEVENLABS_API_KEY  required
//   APP_TOKEN           optional shared secret the app sends as x-app-token
//   VOICE_ID_CALM / VOICE_ID_DEEP  optional, swap in any voice from your ElevenLabs library
//   ELEVENLABS_MODEL    optional, defaults to eleven_multilingual_v2
//   BLOB_READ_WRITE_TOKEN  added by Vercel when a Blob store is connected. With it, every clip is
//                       saved once and shared: the same line in the same voice is never paid for twice,
//                       for anyone. Without it, each clip is made fresh every time it's asked for.

const VOICES: Record<string, string> = {
  'calm-female': process.env.VOICE_ID_CALM || '21m00Tcm4TlvDq8ikWAM',
  'deep-male': process.env.VOICE_ID_DEEP || 'pNInz6obpgDQGcFmaJgB',
  // Chris's picks from the ElevenLabs Voice Library (IDs from json2video's ElevenLabs list).
  'serene-female': 'pjcYQlDFKMbcOUp6F5GD', // Brittney - meditation voice, soothing, calm and relaxing
  'silk-female': 'LEnmbrrxYsUYS7vsRRwD', // Jessica - intimate and sensual
  // ElevenLabs' own premade voices, so they work on any plan.
  'soft-female': 'EXAVITQu4vr4xnSDxMaL', // Sarah
  'warm-female': 'XrExE9yKIg1WjnnlVkGX', // Matilda
  'velvet-female': 'pFZP5JICA0tqhD9ehrhH', // Lily, British
  'narrator-male': 'nPczCjzI2devNBz1zQrb', // Brian
  'gentle-male': 'JBFqnCBsd6RMkjVDRZzb', // George, British
  'steady-male': 'onwK4e9ZLuTAKqWW03F9', // Daniel, British
};

const MAX_CHARS = 300;

// Same naming as the app's own saved clips (src/lib/voices.ts): voice, then a hash and length of the text.
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
const clipPath = (text: string, voice: string) => `voices/${voice}-${hash(text).toString(36)}-${text.length}.mp3`;
const AUDIO_HEADERS = { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable' };

// Shared storage is a public Vercel Blob store, used through its plain web API (the SDK needs Node, and
// this runs on the edge). The store's id is part of its token: vercel_blob_rw_<storeId>_<secret>.
const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN;
const blobUrl = (token: string, path: string) => `https://${token.split('_')[3]}.public.blob.vercel-storage.com/${path}`;

/** The shared copy of a clip, if one was saved before. */
async function saved(path: string) {
  const token = blobToken();
  if (!token) return null;
  try {
    const res = await fetch(blobUrl(token, path));
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

async function save(path: string, audio: ArrayBuffer) {
  const token = blobToken();
  if (!token) return;
  const res = await fetch(`https://vercel.com/api/blob/?${new URLSearchParams({ pathname: path })}`, {
    method: 'PUT',
    body: audio,
    headers: {
      authorization: `Bearer ${token}`,
      'x-api-version': '13',
      'x-vercel-blob-access': 'public',
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '1',
      'x-content-type': 'audio/mpeg',
    },
  });
  if (!res.ok) console.error('Could not save the clip to Blob', res.status, await res.text());
}

function reply(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

/** Lets us check the setup without spending any credits. */
function GET() {
  const token = blobToken();
  return Response.json({
    ok: true,
    hasKey: Boolean(process.env.ELEVENLABS_API_KEY),
    sharedStorage: Boolean(token),
    // Where shared clips can be downloaded straight from (public anyway), so the app can skip this
    // function, and the firewall in front of it, for lines that were made before.
    shared: token ? blobUrl(token, 'voices/') : null,
  });
}

type Clip = { audio: ArrayBuffer; cached: boolean } | { error: string; status: number };

// The lines around one, so it's read as part of a flowing script rather than on its own.
const around = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, MAX_CHARS) : undefined);

/** One line in one voice: the shared copy if it was made before, else a fresh one from ElevenLabs (then saved). */
async function makeClip(key: string, text: string, voice: string, previous?: unknown, next?: unknown): Promise<Clip> {
  if (!text || text.length > MAX_CHARS) return { error: `Text must be 1 to ${MAX_CHARS} characters.`, status: 400 };
  if (!VOICES[voice]) return { error: 'Unknown voice.', status: 400 };

  const path = clipPath(text, voice);
  const hit = await saved(path);
  if (hit) return { audio: await hit.arrayBuffer(), cached: true };

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[voice]}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
      // Steady and warm, a touch slower than normal speech.
      voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0, speed: 0.92, use_speaker_boost: true },
      previous_text: around(previous),
      next_text: around(next),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('ElevenLabs error', res.status, detail);
    // ElevenLabs says why in detail.status; turn the common ones into plain words.
    let why = '';
    try {
      why = (JSON.parse(detail) as { detail?: { status?: string } }).detail?.status ?? '';
    } catch {
      // Not JSON.
    }
    const plain: Record<string, string> = {
      quota_exceeded: 'The ElevenLabs account is out of credits for this month.',
      invalid_api_key: 'The ElevenLabs key saved in Vercel is wrong or was deleted.',
      missing_permissions: 'The ElevenLabs key isn’t allowed to make speech. Turn on Text to Speech for the key.',
      detected_unusual_activity: 'ElevenLabs paused free use on this account. A paid plan fixes it.',
      voice_not_found: 'That voice isn’t available on this ElevenLabs account.',
    };
    return { error: plain[why] ?? `ElevenLabs couldn't make the audio (status ${res.status}${why ? `, ${why}` : ''}).`, status: 502 };
  }
  const audio = await res.arrayBuffer();
  try {
    await save(path, audio);
  } catch (e) {
    console.error('Could not save the clip to Blob', e); // still hand it back
  }
  return { audio, cached: false };
}

/** Base64 without Node's Buffer (this runs on the edge), in slices so long clips don't overflow the stack. */
function base64(audio: ArrayBuffer) {
  const bytes = new Uint8Array(audio);
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
}

// A batch: up to this many lines in one request, so a long tape needs far fewer requests (Vercel's own
// protection slows down floods of them). Made two at a time to stay inside ElevenLabs' concurrency limit.
const MAX_BATCH = 6;
const AT_ONCE = 2;

async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return reply(500, 'The voice server has no ElevenLabs key yet.');

  const token = process.env.APP_TOKEN;
  if (token && request.headers.get('x-app-token') !== token) return reply(401, 'Not allowed.');

  let body: { text?: unknown; voice?: unknown; previous?: unknown; next?: unknown; lines?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply(400, 'Send JSON with text and voice.');
  }
  const voice = typeof body.voice === 'string' ? body.voice : '';

  // Several lines: { voice, lines: [{ text, previous, next }] } -> { clips: [{ audio (base64) } | { error }] }.
  if (Array.isArray(body.lines)) {
    const lines = (body.lines as { text?: unknown; previous?: unknown; next?: unknown }[]).slice(0, MAX_BATCH);
    const clips: ({ audio: string } | { error: string })[] = new Array(lines.length);
    let next = 0;
    const worker = async () => {
      while (next < lines.length) {
        const i = next++;
        const line = lines[i] ?? {};
        const text = typeof line.text === 'string' ? line.text.trim() : '';
        const clip = await makeClip(key, text, voice, line.previous, line.next);
        clips[i] = 'audio' in clip ? { audio: base64(clip.audio) } : { error: clip.error };
      }
    };
    await Promise.all(Array.from({ length: Math.min(AT_ONCE, lines.length) }, worker));
    return Response.json({ clips }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // One line: the MP3 itself (what older versions of the app ask for).
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const clip = await makeClip(key, text, voice, body.previous, body.next);
  if ('error' in clip) return reply(clip.status, clip.error);
  return new Response(clip.audio, { headers: { ...AUDIO_HEADERS, 'x-voice-cache': clip.cached ? 'hit' : 'miss' } });
}

export default function handler(request: Request) {
  if (request.method === 'GET') return GET();
  if (request.method === 'POST') return POST(request);
  return reply(405, 'Use GET or POST.');
}
