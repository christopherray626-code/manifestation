import type { Affirmation, Goal } from '@/lib/types';

/** Whole days since 1970 in the phone's own time zone, so days flip at local midnight. */
export function localDay(ts: number) {
  const d = new Date(ts);
  return Math.floor((ts - d.getTimezoneOffset() * 60000) / 86400000);
}

export function dayOfGoal(goal: Goal, now = Date.now()) {
  return localDay(now) - localDay(goal.createdAt) + 1;
}

export function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function shuffledIndex(goalId: string, step: number, size: number) {
  return hash(`${goalId}:${step}`) % size;
}

/** Rotation `every` value meaning "a new one each time the app opens". */
export const EACH_OPEN = -1;

// Which time the app has been opened, counted in the store and set once at launch (see _layout).
let appOpens = 0;
export function setAppOpens(n: number) {
  appOpens = n;
}

/** Picks today's affirmation for a goal according to the goal's rotation settings. */
export function todaysAffirmation(goal: Goal, now = Date.now()): Affirmation | undefined {
  const { rotation } = goal;
  const favorites = goal.affirmations.filter((a) => a.favorite);
  const pool = rotation.favoritesOnly && favorites.length ? favorites : goal.affirmations;
  if (!pool.length) return undefined;

  const pinned = pool.findIndex((a) => a.id === rotation.pinnedId);
  const start = Math.max(pinned, 0);
  if (rotation.every === 0 || pool.length === 1) return pool[start];

  const step =
    rotation.every === EACH_OPEN ? appOpens : Math.floor((localDay(now) - localDay(rotation.anchor)) / rotation.every);
  if (step <= 0) return pool[start];

  if (rotation.order === 'shuffle') {
    let index = shuffledIndex(goal.id, step, pool.length);
    // Never land on the same one two periods running when shuffling.
    if (index === shuffledIndex(goal.id, step - 1, pool.length)) index = (index + 1) % pool.length;
    return pool[index];
  }
  return pool[(start + step) % pool.length];
}
