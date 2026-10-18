import type { Frequency } from '@/lib/types';

/**
 * The frequencies you can layer under a tape. The meanings are what each one is traditionally linked
 * with in sound healing, not proven effects, so the wording says "linked with", not "does".
 */
export const FREQUENCY_LIST: { id: Frequency; label: string; tag: string; about: string; kind: 'solfeggio' | 'binaural' }[] = [
  { id: 'hz-396', label: '396 Hz', tag: 'Letting go', about: 'Linked with releasing fear and guilt.', kind: 'solfeggio' },
  { id: 'hz-432', label: '432 Hz', tag: 'Calm', about: 'A softer tuning many find calming and natural.', kind: 'solfeggio' },
  { id: 'hz-528', label: '528 Hz', tag: 'Love', about: 'The "love frequency", linked with transformation.', kind: 'solfeggio' },
  { id: 'hz-639', label: '639 Hz', tag: 'Connection', about: 'Linked with harmony in relationships.', kind: 'solfeggio' },
  { id: 'hz-741', label: '741 Hz', tag: 'Clarity', about: 'Linked with clearing the mind and self-expression.', kind: 'solfeggio' },
  { id: 'hz-963', label: '963 Hz', tag: 'Higher self', about: 'Linked with intuition and the higher self.', kind: 'solfeggio' },
  { id: 'beat-delta', label: 'Delta 3 Hz', tag: 'Deep sleep', about: 'A slow binaural beat for deep sleep. Use headphones.', kind: 'binaural' },
  { id: 'beat-theta', label: 'Theta 6 Hz', tag: 'Visualising', about: 'The dreamy state for visualising and manifesting. Use headphones.', kind: 'binaural' },
  { id: 'beat-alpha', label: 'Alpha 10 Hz', tag: 'Relaxed focus', about: 'Calm and alert, good for daytime listening. Use headphones.', kind: 'binaural' },
];

export const FREQUENCY_LEVELS = [
  { value: 0.07, label: 'Faint' },
  { value: 0.15, label: 'Low' },
  { value: 0.3, label: 'Medium' },
];
