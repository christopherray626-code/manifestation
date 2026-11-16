/*
 * Timers that still fire with the app closed. Android pauses JavaScript's own timers (setTimeout,
 * setInterval) whenever the app isn't on screen, even while its sound keeps playing, so a sleep timer or
 * the pause between two lines would simply never happen. A sound that's playing keeps reporting in from
 * the phone's side though, so each of those reports calls pulse(), which runs anything that's due.
 * On screen, the ordinary timer does it.
 */

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

/** Runs everything that's due. Called whenever a playing sound reports in. */
export function pulse() {
  if (!jobs.size) return;
  const now = Date.now();
  for (const [id, job] of [...jobs]) if (job.at <= now) run(id);
}
