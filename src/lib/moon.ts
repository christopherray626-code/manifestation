const SYNODIC_MONTH = 29.530588853;
// A known new moon: 6 January 2000, 18:14 UTC.
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 86400000;

const PHASES = [
  { name: 'New moon', hint: 'Set new intentions' },
  { name: 'Waxing crescent', hint: 'Good for new intentions' },
  { name: 'First quarter', hint: 'Take a step toward your goal' },
  { name: 'Waxing gibbous', hint: 'Keep going, it is building' },
  { name: 'Full moon', hint: 'Celebrate and give thanks' },
  { name: 'Waning gibbous', hint: 'Practice gratitude' },
  { name: 'Last quarter', hint: "Release what you don't need" },
  { name: 'Waning crescent', hint: 'Rest and reflect' },
];

export function moonPhase(date = new Date()) {
  const days = date.getTime() / 86400000 - REFERENCE_NEW_MOON;
  const age = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  return PHASES[Math.round((age / SYNODIC_MONTH) * 8) % 8];
}
