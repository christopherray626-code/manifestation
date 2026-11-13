import { isClosing, trackAffirmations, trackById, type Track } from '@/lib/tracks';
import type { Affirmation, Goal } from '@/lib/types';

/*
 * A mix: several ready-made tracks and your own manifestations played one after another as one loop.
 * Its id lists the parts in order, e.g. "track:success,track:love,goal:abc123", so it can be remembered
 * as the last thing played like any other track.
 */

export type MixPart = { kind: 'goal' | 'track'; id: string };

export const mixId = (parts: MixPart[]) => parts.map((p) => `${p.kind}:${p.id}`).join(',');

export function parseMix(id: string): MixPart[] {
  return id
    .split(',')
    .map((s) => {
      const at = s.indexOf(':');
      const kind = s.slice(0, at);
      return kind === 'goal' || kind === 'track' ? { kind, id: s.slice(at + 1) } : null;
    })
    .filter((p): p is MixPart => !!p);
}

/** Each part's title, skipping any that no longer exist. */
export function partTitles(parts: MixPart[], goals: Goal[]) {
  return parts
    .map((p) => (p.kind === 'track' ? trackById(p.id)?.title : goals.find((g) => g.id === p.id)?.title))
    .filter((t): t is string => !!t);
}

/**
 * The mix as a track the player can show, plus its affirmations in order. A ready-made track's closing
 * "It's done." stays only when that track comes last, so the loop ends once.
 */
export function buildMix(id: string, goals: Goal[]): { track: Track; affirmations: Affirmation[] } | undefined {
  const parts = parseMix(id);
  const affirmations: Affirmation[] = [];
  parts.forEach((p, n) => {
    const last = n === parts.length - 1;
    if (p.kind === 'track') {
      const track = trackById(p.id);
      if (track) affirmations.push(...trackAffirmations(track).filter((a) => last || !isClosing(a.text)));
    } else {
      const goal = goals.find((g) => g.id === p.id);
      if (goal) affirmations.push(...goal.affirmations);
    }
  });
  const titles = partTitles(parts, goals);
  if (!affirmations.length || !titles.length) return undefined;
  return {
    track: {
      id,
      title: titles.join(' + '),
      about: 'Your mix',
      icon: 'layers-outline',
      lines: affirmations.map((a) => a.text),
      lineIds: affirmations.map((a) => a.id),
    },
    affirmations,
  };
}
