// Small voice server (Vercel function). The app sends one affirmation; this asks ElevenLabs
// to speak it and returns the MP3. The ElevenLabs key lives only here, never in the app.
//
// Vercel environment variables:
//   ELEVENLABS_API_KEY  required
//   APP_TOKEN           optional shared secret the app sends as x-app-token
//   VOICE_ID_CALM / VOICE_ID_DEEP  optional, swap in any voice from your ElevenLabs library
//   ELEVENLABS_MODEL    optional, defaults to eleven_multilingual_v2

const VOICES: Record<string, string> = {
  'calm-female': process.env.VOICE_ID_CALM || '21m00Tcm4TlvDq8ikWAM',
  'deep-male': process.env.VOICE_ID_DEEP || 'pNInz6obpgDQGcFmaJgB',
};

const MAX_CHARS = 300;

function reply(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

/** Lets us check the setup without spending any credits. */
export function GET() {
  return Response.json({ ok: true, hasKey: Boolean(process.env.ELEVENLABS_API_KEY) });
}

export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return reply(500, 'The voice server has no ElevenLabs key yet.');

  const token = process.env.APP_TOKEN;
  if (token && request.headers.get('x-app-token') !== token) return reply(401, 'Not allowed.');

  let body: { text?: unknown; voice?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply(400, 'Send JSON with text and voice.');
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const voice = typeof body.voice === 'string' ? body.voice : '';
  if (!text || text.length > MAX_CHARS) return reply(400, `Text must be 1 to ${MAX_CHARS} characters.`);
  if (!VOICES[voice]) return reply(400, 'Unknown voice.');

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICES[voice]}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
        // Steady and warm, a touch slower than normal speech.
        voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0, speed: 0.92, use_speaker_boost: true },
      }),
    },
  );

  if (!res.ok) {
    console.error('ElevenLabs error', res.status, await res.text());
    return reply(502, `ElevenLabs couldn't make the audio (status ${res.status}).`);
  }
  return new Response(res.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
}
