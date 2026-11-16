import type { Theme } from '@/themes';

/*
 * Card colours: a bright gradient per topic, so a shelf reads like a row of album covers rather than
 * one dark tile after another. Tracks and categories pick their own; anything else goes by position.
 */
const PALETTES = {
  gold: ['#FFD36E', '#F2994A', '#9C2C77'],
  money: ['#C6F7A6', '#2FB67C', '#0E4A3A'],
  sunset: ['#FF9A62', '#FF4D8D', '#7B2FF7'],
  rose: ['#FFB8D9', '#F15BB5', '#5B2A86'],
  ocean: ['#5EF0D0', '#2B8CFF', '#2A1B6E'],
  violet: ['#C9B0FF', '#7C4DFF', '#1E1A5A'],
  emerald: ['#A6F7A9', '#2EC4B6', '#134E6F'],
  peach: ['#FFE2B8', '#FF8F8F', '#8E3B76'],
  sky: ['#A8EBFF', '#5B8DEF', '#2E2A73'],
  lilac: ['#F6CCFF', '#C77DFF', '#3C1E70'],
} as const;
type Palette = keyof typeof PALETTES;
const ORDER: Palette[] = ['sunset', 'ocean', 'gold', 'rose', 'violet', 'emerald', 'peach', 'sky', 'lilac'];
const TONE_OF: Record<string, Palette> = {
  // Ready-made tracks
  'money-magnet': 'money',
  success: 'sunset',
  career: 'sky',
  luck: 'gold',
  confidence: 'violet',
  'self-love': 'rose',
  love: 'peach',
  'glow-up': 'sunset',
  calm: 'ocean',
  sleep: 'violet',
  gratitude: 'lilac',
  health: 'emerald',
  focus: 'sky',
  // Manifestation categories
  money: 'money',
  car: 'sunset',
  home: 'ocean',
  other: 'violet',
};

/*
 * How far each theme pulls card colours toward its own: `accent` blends in the theme's accent, `bg`
 * sinks the dark end into the background, `soft` washes toward white (pastel on light themes) and
 * `mute` takes saturation out (vintage on Old money and Tarot). Hustle stays loud.
 */
const MOODS: Record<string, { accent: number; bg: number; soft: number; mute: number }> = {
  celestial: { accent: 0.18, bg: 0.35, soft: 0, mute: 0.2 },
  aura: { accent: 0.22, bg: 0.3, soft: 0, mute: 0.1 },
  tarot: { accent: 0.15, bg: 0.45, soft: 0, mute: 0.55 },
  dream: { accent: 0.15, bg: 0, soft: 0.45, mute: 0.05 },
  clean: { accent: 0.05, bg: 0, soft: 0.35, mute: 0.3 },
  soft: { accent: 0.25, bg: 0, soft: 0.3, mute: 0.25 },
  oldmoney: { accent: 0.25, bg: 0.4, soft: 0, mute: 0.5 },
  hustle: { accent: 0.1, bg: 0.2, soft: 0, mute: 0 },
};

const toRgb = (hex: string) => {
  const h = hex.replace('#', '').slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const grey = (c: number[], t: number) => {
  const l = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
  return mix(c, [l, l, l], t);
};

/** The three gradient colours for a track id or category (else by position), shaded for the theme. */
export function paletteFor(tone: string | undefined, index: number, theme?: Theme) {
  const base = PALETTES[(tone && TONE_OF[tone]) || ORDER[Math.abs(index) % ORDER.length]];
  if (!theme) return base;
  const mood = MOODS[theme.id] ?? MOODS.celestial;
  const accent = toRgb(theme.colors.accent);
  const bg = toRgb(theme.colors.bg);
  return base.map((hex, i) => {
    let c = grey(toRgb(hex), mood.mute);
    c = mix(c, accent, mood.accent * (i === 2 ? 0.5 : 1));
    if (mood.soft) c = mix(c, [255, 255, 255], mood.soft * (i === 2 ? 0.6 : 1));
    if (mood.bg) c = mix(c, bg, mood.bg * [0, 0.4, 1][i]);
    return toHex(c);
  }) as unknown as readonly [string, string, string];
}
