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

function goalPhrase(title: string, category: Category) {
  const t = title.trim().replace(/[.!]+$/, '');
  // "Black Tesla" -> "black Tesla", but leave acronyms like "BMW" alone.
  const soft = /^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
  if (category === 'car' || category === 'home') {
    return /^(my|a|an|the)\s/i.test(soft) ? soft.replace(/^(a|an|the)\s/i, 'my ') : `my ${soft}`;
  }
  return soft;
}

function feelPhrase(feeling: string) {
  const words = feeling
    .split(/,|\band\b/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  if (!words.length) return 'grateful';
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function fill(template: string, it: string, feel: string) {
  const text = template.replaceAll('{It}', it).replaceAll('{it}', it).replaceAll('{feel}', feel);
  return text[0].toUpperCase() + text.slice(1);
}

/** All the affirmations the templates can make for a goal, best first. */
export function allTemplateAffirmations(title: string, category: Category, feeling: string) {
  const it = goalPhrase(title, category);
  const feel = feelPhrase(feeling);
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
