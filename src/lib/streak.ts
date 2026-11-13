import { localDay } from '@/lib/today';

/*
 * The streak, Duolingo-style: a day counts once you've listened for the daily goal (3 minutes unless
 * changed) or written in the journal. It forgives one missed day a week (a built-in rest day), so a
 * single busy day never wipes out the habit. Celebrated at each milestone.
 */

export const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];
export const DEFAULT_GOAL_MIN = 3;
export const GOAL_CHOICES = [1, 3, 5, 10, 15];

/** Adds today to the days practised (kept to the last 400). */
export function withToday(days: number[] = [], now = Date.now()) {
  const today = localDay(now);
  return days.includes(today) ? days : [...days, today].slice(-400);
}

/** Days in a row up to now, with one free missed day per week. Today not done yet doesn't break it. */
export function streakOf(days: number[] = [], now = Date.now()) {
  return walk(new Set(days), localDay(now)).count;
}

/** Counts back from today; returns the length and which missed days were forgiven as rest days. */
function walk(done: Set<number>, today: number) {
  let d = done.has(today) ? today : today - 1;
  let count = 0;
  let lastMiss = Infinity;
  const rests: number[] = [];
  for (; ; d--) {
    if (done.has(d)) {
      count++;
      continue;
    }
    // One free miss per 7 days, and only between days that count.
    if (count > 0 && lastMiss - d >= 7 && done.has(d - 1)) {
      lastMiss = d;
      rests.push(d);
      continue;
    }
    break;
  }
  return { count, rests };
}

const runEndingAt = (done: Set<number>, day: number) => walk(done, day).count;

/** The longest streak ever. */
export function bestStreak(days: number[] = []) {
  const done = new Set(days);
  return days.reduce((best, d) => Math.max(best, runEndingAt(done, d)), 0);
}

export type DayMark = 'done' | 'rest' | 'missed' | 'today' | 'future';

/** Monday to Sunday of this week: done, forgiven as a rest day, missed, or still to come. */
export function thisWeek(days: number[] = [], now = Date.now()): { label: string; mark: DayMark }[] {
  const done = new Set(days);
  const today = localDay(now);
  const weekday = (new Date(now).getDay() + 6) % 7; // Monday = 0
  const rests = new Set(walk(done, today).rests);
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
    const d = today - weekday + i;
    const mark: DayMark = done.has(d) ? 'done' : d === today ? 'today' : d > today ? 'future' : rests.has(d) ? 'rest' : 'missed';
    return { label, mark };
  });
}

/** The next milestone to reach. */
export function nextMilestone(streak: number) {
  return MILESTONES.find((m) => m > streak);
}
