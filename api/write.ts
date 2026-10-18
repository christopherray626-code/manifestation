// The affirmation writer: the app sends a goal, Claude writes affirmations around it. Same Vercel project
// as the web app and the voice server; the Anthropic key lives only here, never in the app.
//
// Vercel environment variables:
//   ANTHROPIC_API_KEY  required (without it the app falls back to its built-in templates)
//   ANTHROPIC_MODEL    optional, defaults to claude-sonnet-5-5
//   APP_TOKEN          optional shared secret the app sends as x-app-token
export const config = { runtime: 'edge' };

const CATEGORIES = ['car', 'money', 'love', 'home', 'health', 'career', 'other'];

function reply(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function POST(request: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return reply(503, 'The writer has no Anthropic key yet.');

  const token = process.env.APP_TOKEN;
  if (token && request.headers.get('x-app-token') !== token) return reply(401, 'Not allowed.');

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return reply(400, 'Send JSON with the goal.');
  }

  const title = clip(body.title, 200);
  if (!title) return reply(400, 'The goal needs a name.');
  const category = CATEGORIES.includes(body.category as string) ? (body.category as string) : 'other';
  const details = clip(body.details, 800);
  const feeling = clip(body.feeling, 200);
  const name = clip(body.name, 60);
  const count = Math.min(15, Math.max(1, Number(body.count) || 12));
  const existing = Array.isArray(body.existing)
    ? body.existing.filter((t): t is string => typeof t === 'string').slice(0, 60).map((t) => t.slice(0, 300))
    : [];

  const goal = [
    `Goal: ${title}`,
    `Category: ${category}`,
    details && `Details: ${details}`,
    feeling && `How it will feel: ${feeling}`,
    name && `Their name: ${name}`,
    existing.length && `They already have these, so don't repeat or closely echo them:\n${existing.map((t) => `- ${t}`).join('\n')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 1500,
      system:
        'You write manifestation affirmations for a personal app. Each one is a short, natural, first-person ' +
        'sentence in the present tense, as if the goal is already real ("I am…", "I have…", "I love…"). Use the ' +
        "person's own details so the lines feel personal, vary how they start, keep each under 20 words, and make " +
        'them sound good read aloud slowly. No quotes, emojis, hashtags or numbering. Never use their name in every ' +
        'line; at most once or twice. Reply with only the affirmations, one per line.',
      messages: [{ role: 'user', content: `${goal}\n\nWrite ${count} affirmations.` }],
    }),
  });

  if (!res.ok) {
    console.error('Anthropic error', res.status, await res.text());
    return reply(502, `Claude couldn't write them (status ${res.status}).`);
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content ?? []).map((c) => (c.type === 'text' ? c.text ?? '' : '')).join('\n');
  const affirmations = text
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/^["“']|["”']$/g, '').trim())
    .filter((l) => l.length > 3 && l.length <= 240)
    .slice(0, count);
  if (!affirmations.length) return reply(502, 'Claude sent back nothing usable.');
  return Response.json({ affirmations });
}

/** Lets us check the setup without spending anything. */
function GET() {
  return Response.json({ ok: true, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export default function handler(request: Request) {
  if (request.method === 'GET') return GET();
  if (request.method === 'POST') return POST(request);
  return reply(405, 'Use GET or POST.');
}
