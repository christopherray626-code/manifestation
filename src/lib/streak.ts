import { localDay } from '@/lib/today';

/*
 * The streak: one listen counts as a day. It forgives one missed day a week (a built-in streak freeze),
 * so a single busy day never wipes out the habit. Celebrated at 3, 7, 30 and 100 days.
 */

export const MILESTONES = [3, 7, 30, 100];

/** Adds today to the days listened (kept to the last 400). */
export function withToday(days: number[] = [], now = Date.now()) {
  const today = localDay(now);
  return days.includes(today) ? days : [...days, today].slice(-400);
}

export function streakOf(days: number[] = [], now = Date.now()) {
  const listened = new Set(days);
  const today = localDay(now);
  // Not having listened yet today doesn't break it; count from yesterday.
  let d = listened.has(today) ? today : today - 1;
  let count = 0;
  let lastMiss = Infinity;
  for (; ; d--) {
    if (listened.has(d)) {
      count++;
      continue;
    }
    // One free miss per 7 days.
    if (count > 0 && lastMiss - d >= 7) {
      lastMiss = d;
      continue;
    }
    break;
  }
  return count;
}
