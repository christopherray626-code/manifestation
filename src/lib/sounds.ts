import type { IconName } from '@/components/ui';
import type { BackgroundSound } from '@/lib/types';

export type SoundKind = 'tones' | 'nature' | 'noise';

/** The background sounds as the Listen tab lists them. The audio is in use-tape.ts (SOUNDS). */
export const SOUND_LIST: { id: Exclude<BackgroundSound, 'none'>; label: string; tags: string; icon: IconName; kind: SoundKind }[] = [
  { id: 'pad', label: 'Soft pad', tags: 'Warm · Dreamy', icon: 'cloud-outline', kind: 'tones' },
  { id: 'bowls', label: 'Singing bowls', tags: 'Meditation · Bells', icon: 'notifications-outline', kind: 'tones' },
  { id: 'hum', label: 'Soft hum', tags: 'Steady · Grounding', icon: 'pulse-outline', kind: 'tones' },
  { id: 'space', label: 'Deep space', tags: 'Atmospheric · Deep', icon: 'planet-outline', kind: 'tones' },
  { id: 'chimes', label: 'Wind chimes', tags: 'Bright · Peaceful', icon: 'musical-notes-outline', kind: 'tones' },
  { id: 'ocean', label: 'Ocean waves', tags: 'Water · Waves', icon: 'water-outline', kind: 'nature' },
  { id: 'rain', label: 'Soft rain', tags: 'Water · Calm', icon: 'rainy-outline', kind: 'nature' },
  { id: 'birds', label: 'Morning birds', tags: 'Nature · Birdsong', icon: 'leaf-outline', kind: 'nature' },
  { id: 'brown', label: 'Brown noise', tags: 'Deep static · Focus', icon: 'radio-outline', kind: 'noise' },
];

export const SOUND_KINDS: { id: SoundKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tones', label: 'Tones' },
  { id: 'nature', label: 'Nature' },
  { id: 'noise', label: 'Noise' },
];
