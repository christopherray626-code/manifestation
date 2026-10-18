import type { Frequency } from '@/lib/types';

/**
 * The frequencies you can layer under a tape, named for what they're for. Six are steady tones (the
 * solfeggio set and 432 Hz) and three are binaural beats, which need headphones; the app doesn't use those
 * terms, just the names. The descriptions are intentions, not claims.
 */
export const FREQUENCY_LIST: { id: Frequency; label: string; about: string; headphones?: boolean }[] = [
  { id: 'hz-528', label: 'Abundance', about: '528 Hz. A warm, bright tone for calling in love and abundance.' },
  { id: 'hz-432', label: 'Harmony', about: '432 Hz. Soft and natural, for feeling at peace with what’s coming.' },
  { id: 'hz-396', label: 'Release', about: '396 Hz. For letting go of fear, doubt and old stories.' },
  { id: 'hz-639', label: 'Connection', about: '639 Hz. For love, closeness and the people meant for you.' },
  { id: 'hz-741', label: 'Clarity', about: '741 Hz. For a clear mind and speaking your truth.' },
  { id: 'hz-963', label: 'Higher self', about: '963 Hz. For intuition and tuning into the version of you who has it all.' },
  { id: 'beat-theta', label: 'Dream state', about: 'A slow pulse that eases you into the dreamy, open state for visualising.', headphones: true },
  { id: 'beat-delta', label: 'Deep rest', about: 'The slowest pulse, for drifting into deep sleep.', headphones: true },
  { id: 'beat-alpha', label: 'Flow', about: 'Calm but awake, for listening through the day.', headphones: true },
];

export const FREQUENCY_LEVELS = [
  { value: 0.07, label: 'Faint' },
  { value: 0.15, label: 'Low' },
  { value: 0.3, label: 'Medium' },
];
