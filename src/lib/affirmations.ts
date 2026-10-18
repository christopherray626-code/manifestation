import { Platform } from 'react-native';

import { makeAffirmation, type Affirmation, type Category } from '@/lib/types';

/*
 * Template affirmations, used until the AI writer exists (it needs a small server so
 * the API key stays out of the app). {it} is the goal, {feel} is how it will feel.
 */

const byCategory: Record<Category, string[]> = {
  car: [
    'I am the proud owner of {it}.',
    'I love driving {it}.',
    'I feel {feel} every time I sit behind the wheel of {it}.',
    '{It} is fully paid off and parked right where it belongs.',
    'I see {it} in my driveway every morning.',
  ],
  money: [
    'I earn {it} doing work I am proud of.',
    'Money flows to me easily and often.',
    'I am a magnet for money.',
    'My income grows every single month.',
    'I always have more than enough.',
  ],
  love: [
    'I am worthy of deep, real love.',
    'Love comes to me easily.',
    'I attract a love that feels safe, kind and lasting.',
    'I give love freely and it comes back to me.',
    'I am already loved exactly as I am.',
  ],
  home: [
    'I wake up grateful in {it} every morning.',
    '{It} is my sanctuary.',
    'I am at peace in {it}.',
    'I hold the keys to {it}.',
    'My home is full of light, warmth and calm.',
  ],
  health: [
    'My body is strong and healthy.',
    'I feel more energized every day.',
    'I treat my body with love and it thanks me.',
    'Every cell in my body is thriving.',
    'I am becoming the healthiest version of me.',
  ],
  career: [
    'I am recognized and rewarded for my work.',
    'Opportunities find me easily.',
    'I am confident in my skills.',
    'I do work I love and I am paid well for it.',
    'Doors open for me everywhere I go.',
  ],
  other: [
    'I am ready to receive {it}.',
    'The universe is lining everything up for {it}.',
    'I trust that {it} is on its way.',
  ],
};

const general = [
  '{It} is already mine.',
  'I am so grateful that {it} is part of my life.',
  'I feel {feel} knowing {it} is mine.',
  'I deserve {it}, and I receive it with ease.',
  '{It} was always meant for me.',
  'Every day I move closer to {it}.',
  'Everything I need for {it} is coming to me now.',
  'I already live as if {it} is here.',
];

/*
 * Goals written as something to be or do ("to be the most confident person", "run a marathon")
 * don't fit the templates above, which expect a thing ("a beach house"). Those get their own.
 * {state} is who they're becoming, {act} is what they'll do.
 */
const beTemplates = [
  'I am {state}.',
  'I am becoming {state}, more every day.',
  'Being {state} comes naturally to me.',
  'I was always meant to be {state}.',
  'I am so grateful to be {state}.',
  'I feel {feel} being {state}.',
  'I deserve to be {state}, and I accept it with ease.',
  'Every day it gets easier to be {state}.',
  'The universe is helping me be {state}.',
  'Everything I need to be {state} is already inside me.',
];

const doTemplates = [
  'I am ready to {act}.',
  'I was always meant to {act}.',
  'I trust myself to {act}.',
  'I deserve to {act}, and I will.',
  'I feel {feel} knowing I will {act}.',
  'I have everything I need to {act}.',
  'The universe is lining everything up for me to {act}.',
  'Every day I move closer to the day I {act}.',
];

/** Whether a goal names a thing, a way to be, or something to do, with the wording to slot in. */
function goalKind(title: string): { kind: 'thing' | 'be' | 'do'; phrase: string } {
  let t = title.trim().replace(/[.!]+$/, '');
  const wish = /^(i\s+(really\s+)?(want|would like|wanna|hope|am going|'m going|plan)\s+(to\s+)?|i\s+will\s+|i'll\s+)/i;
  const hadTo = wish.test(t) || /^to\s/i.test(t);
  t = t.replace(wish, '');
  t = t.replace(/^to\s+/i, '');
  const be = t.match(/^(be|become|being|becoming)\s+(.+)$/i);
  if (be) return { kind: 'be', phrase: be[2] };
  // "have / own / get / buy a house" is still a thing.
  const have = t.match(/^(have|own|get|buy|drive|live in)\s+(.+)$/i);
  if (have) return { kind: 'thing', phrase: have[2] };
  if (hadTo) return { kind: 'do', phrase: t[0].toLowerCase() + t.slice(1) };
  return { kind: 'thing', phrase: t };
}

function goalPhrase(title: string, category: Category) {
  const t = title.trim().replace(/[.!]+$/, '');
  // "Beach house" -> "beach house", but leave acronyms like "BMW" alone.
  const soft = /^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
  if (category === 'car' || category === 'home') {
    return /^(my|a|an|the)\s/i.test(soft) ? soft.replace(/^(a|an|the)\s/i, 'my ') : `my ${soft}`;
  }
  return soft;
}

// Words that describe the situation rather than the person: "I feel exciting" -> "I feel excited".
const asFeeling: Record<string, string> = {
  liberating: 'liberated',
  exciting: 'excited',
  relaxing: 'relaxed',
  inspiring: 'inspired',
  satisfying: 'satisfied',
  fulfilling: 'fulfilled',
  energizing: 'energized',
  empowering: 'empowered',
  freeing: 'free',
  calming: 'calm',
  thrilling: 'thrilled',
  rewarding: 'proud',
  comforting: 'comforted',
  uplifting: 'uplifted',
  reassuring: 'reassured',
  refreshing: 'refreshed',
  peaceful: 'at peace',
};

function feelPhrase(feeling: string) {
  const words = feeling
    .split(/,|\band\b/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
    .map((w) => asFeeling[w] ?? w);
  if (!words.length) return 'grateful';
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function fill(template: string, it: string, feel: string) {
  const text = template
    .replaceAll('{It}', it)
    .replaceAll('{it}', it)
    .replaceAll('{state}', it)
    .replaceAll('{act}', it)
    .replaceAll('{feel}', feel);
  return text[0].toUpperCase() + text.slice(1);
}

/** All the affirmations the templates can make for a goal, best first. */
export function allTemplateAffirmations(title: string, category: Category, feeling: string) {
  const feel = feelPhrase(feeling);
  const { kind, phrase } = goalKind(title);
  if (kind !== 'thing') {
    // Keep the category lines that don't name the goal ("Love comes to me easily").
    const own = byCategory[category].filter((t) => !/\{it\}/i.test(t));
    return [...(kind === 'be' ? beTemplates : doTemplates), ...own].map((t) => fill(t, phrase, feel));
  }
  const it = goalPhrase(phrase, category);
  return [...byCategory[category], ...general].map((t) => fill(t, it, feel));
}

/** Up to `count` new affirmations that aren't already in `existing`. */
export function writeAffirmations(
  goal: { title: string; category: Category; feeling: string },
  existing: string[] = [],
  count = 8,
): Affirmation[] {
  const taken = new Set(existing.map((t) => t.toLowerCase()));
  return allTemplateAffirmations(goal.title, goal.category, goal.feeling)
    .filter((t) => !taken.has(t.toLowerCase()))
    .slice(0, count)
    .map((text) => makeAffirmation(text, false));
}

// The Claude writer lives on the same server as the voices (api/write.ts). On the web that's the app's own
// site; the phone app needs its address.
const SERVER =
  process.env.EXPO_PUBLIC_VOICE_SERVER?.replace(/\/$/, '') ?? (Platform.OS === 'web' ? '' : undefined);

/**
 * Affirmations written by Claude around the goal, falling back to the templates above if the writer isn't
 * set up, is down, or takes too long. Never fails.
 */
export async function writeAffirmationsSmart(
  goal: { title: string; category: Category; feeling: string; details?: string; name?: string },
  existing: string[] = [],
  count = 8,
): Promise<Affirmation[]> {
  if (SERVER !== undefined) {
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), 20000);
    try {
      const res = await fetch(`${SERVER}/api/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goal, existing, count }),
        signal: stop.signal,
      });
      if (res.ok) {
        const { affirmations } = (await res.json()) as { affirmations?: string[] };
        const taken = new Set(existing.map((t) => t.toLowerCase()));
        const fresh = (affirmations ?? []).filter((t) => !taken.has(t.toLowerCase()));
        if (fresh.length) return fresh.slice(0, count).map((text) => makeAffirmation(text, false));
      }
    } catch {
      // Offline, timed out, or no writer: the templates below still give them something.
    } finally {
      clearTimeout(timer);
    }
  }
  return writeAffirmations(goal, existing, count);
}
