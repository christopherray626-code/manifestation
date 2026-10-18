import type { Frequency } from '@/lib/types';

/**
 * The frequencies you can layer under a tape, named for what they're for. Six are steady tones (the
 * solfeggio set and 432 Hz) and three are binaural beats, which need headphones; the app doesn't use those
 * terms, just plain names. The descriptions say how each sounds, not what it does.
 */
export const FREQUENCY_LIST: { id: Frequency; label: string; about: string; headphones?: boolean }[] = [
  { id: 'hz-528', label: 'Warm', about: '528 Hz. A warm, bright tone.' },
  { id: 'hz-432', label: 'Calm', about: '432 Hz. Soft and settling.' },
  { id: 'hz-396', label: 'Low', about: '396 Hz. A low, grounding hum.' },
  { id: 'hz-639', label: 'Mellow', about: '639 Hz. Mellow and even.' },
  { id: 'hz-741', label: 'Clear', about: '741 Hz. Clear and bright, good for focus.' },
  { id: 'hz-963', label: 'High', about: '963 Hz. A high, light tone.' },
  { id: 'beat-theta', label: 'Dream state', about: 'A slow pulse that helps you drift into a dreamy, relaxed state.', headphones: true },
  { id: 'beat-delta', label: 'Deep rest', about: 'The slowest pulse, for drifting into deep sleep.', headphones: true },
  { id: 'beat-alpha', label: 'Flow', about: 'Calm but awake, for listening through the day.', headphones: true },
];

export const FREQUENCY_LEVELS = [
  { value: 0.07, label: 'Faint' },
  { value: 0.15, label: 'Low' },
  { value: 0.3, label: 'Medium' },
];
