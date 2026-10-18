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

// The rules come from docs/affirmation-guide.md (the research behind each one is there).
const WRITING_GUIDE = `You write affirmations for a manifestation app. They are read aloud to the person, slowly, over
calm music, and played as subliminals, so they must sound natural spoken.

How to write them:
- Mix perspectives: about two thirds "you" lines, as if a friend who's amazed at their life is speaking
  to them ("You are…", "You've always been…"), and one third "I" lines where they own it ("I am…",
  "I have…"). If you know their name, use it in one or two "you" lines, never more.
- Write in this style:
  - One or two "why" questions that assume it's already true, so the mind looks for the reason:
    "Why does money keep finding you like this?"
  - "You've always been…" lines that treat the goal as settled history.
  - For big goals, abundance so large it's almost a problem: "you can't keep up with it", "you have to
    figure out what to do with it all".
  - Feeling and gratitude: "it feels amazing", "you're so grateful".
  - Identity: "it's who you are", "you were born for this".
  - An occasional dash for an afterthought that adds emotion: "…, it's like magic."
  - End the set with one line of closure that starts "It's done."
- Keep them believable. Mix fully present lines (as if it's already real) with bridge lines that move
  toward it: "I am becoming…", "more and more…", "every day it gets easier to…".
- Put the goal in what the sentence assumes, not just what it claims. Use words that take it for
  granted: already, still, now that, when, as, notice, realize, how easily, even more.
  e.g. "When people notice how confident you are, they relax too." / "Now that money comes easily, I
  get to choose what matters."
- Give some lines a reason with "because": "I attract money because I create real value."
- Use these patterns now and then (not all in one line): an embedded command ("You can feel it now."),
  a double bind where both options lead to the goal ("Whether it comes this week or next, it's already
  on its way."), future pacing ("Tomorrow you'll wake up and it will still be true."), a plain truth
  followed by the step ("You've made it through every hard day so far, and you're getting stronger.").
- Use their own details: real, sensory, specific moments they can picture.
- Say what they want, never what they don't (write "calm", not "not anxious").
- Frame identity, not just outcome: "I am the kind of person who…".
- Rhythm matters: short, even, easy to say. A repeated structure or the odd rhyme helps. Keep each
  under 20 words, vary how they start.
- No astrology, moon phases, tarot or crystals. Words like universe and energy are fine.
- Nothing negative, no hedging ("I hope", "I try"), no quotes, emojis, hashtags or numbering.

Reply with only the affirmations, one per line.`;

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
      system: WRITING_GUIDE,
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
