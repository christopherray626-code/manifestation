/*
 * Timers that still fire with the app closed. Android pauses JavaScript's own timers (setTimeout,
 * setInterval) whenever the app isn't on screen, even while its sound keeps playing, so a sleep timer or
 * the pause between two lines would simply never happen. A sound that's playing keeps reporting in from
 * the phone's side though, so each of those reports calls pulse(), which runs anything that's due.
 * On screen, the ordinary timer does it.
 */

import { AppState } from 'react-native';

type Job = { at: number; fn: () => void; timer: ReturnType<typeof setTimeout> };
const jobs = new Map<number, Job>();
let nextId = 1;

function run(id: number) {
  const job = jobs.get(id);
  if (!job) return;
  jobs.delete(id);
  clearTimeout(job.timer);
  job.fn();
}

/** Like setTimeout, but also run by the next pulse() once it's due. */
export function later(ms: number, fn: () => void): number {
  const id = nextId++;
  jobs.set(id, { at: Date.now() + ms, fn, timer: setTimeout(() => run(id), ms) });
  return id;
}

export function cancel(id: number | null | undefined) {
  if (id == null) return;
  const job = jobs.get(id);
  if (!job) return;
  clearTimeout(job.timer);
  jobs.delete(id);
}

/**
 * A pause that only exists to let the screen catch up (`await breathe()` in the middle of heavy work).
 * It ends on the next turn while the app is on screen, and at once when it isn't or stops being: the
 * work must never be left waiting on a timer the phone has paused. That is exactly how a tape went
 * silent: the phone was locked while the next part was being mixed, and the mixing never resumed.
 */
const breathing = new Set<() => void>();
export function breathe(): Promise<void> | void {
  if (AppState.currentState !== 'active') return;
  return new Promise<void>((resolve) => {
    const done = () => {
      if (!breathing.delete(done)) return;
      clearTimeout(timer);
      resolve();
    };
    breathing.add(done);
    const timer = setTimeout(done, 0);
  });
}

// Leaving the screen (or coming back): let everything that was only being polite carry on, and run
// whatever came due.
AppState.addEventListener('change', () => {
  for (const done of [...breathing]) done();
  pulse();
});

/** Runs everything that's due. Called whenever a playing sound reports in. */
export function pulse() {
  // A sound reporting in while the app is off screen also frees anything still "breathing".
  if (breathing.size && AppState.currentState !== 'active') for (const done of [...breathing]) done();
  if (!jobs.size) return;
  const now = Date.now();
  for (const [id, job] of [...jobs]) if (job.at <= now) run(id);
}
