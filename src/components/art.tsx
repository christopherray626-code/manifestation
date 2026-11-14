import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Icon, useTheme, type IconName } from '@/components/ui';
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
  tarot: { accent: 0.25, bg: 0.4, soft: 0, mute: 0.45 },
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

/** Soft light shapes and a few sparkles laid over a card's gradient. */
function Glints({ size, seed }: { size: number; seed: number }) {
  const dots = [
    [0.18, 0.16, 0.035],
    [0.8, 0.22, 0.05],
    [0.72, 0.62, 0.03],
    [0.12, 0.58, 0.025],
  ];
  return (
    <>
      <View style={{ position: 'absolute', width: size * 1.1, height: size * 1.1, borderRadius: size, backgroundColor: '#fff', opacity: 0.12, top: -size * 0.55, right: -size * 0.45 }} />
      <View style={{ position: 'absolute', width: size * 0.9, height: size * 0.9, borderRadius: size, backgroundColor: '#fff', opacity: 0.08, bottom: -size * 0.25, left: -size * 0.5 }} />
      {dots.map(([x, y, r], i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: ((x + seed * 0.07 * (i % 2 ? 1 : -1) + 1) % 1) * size,
            top: y * size,
            width: size * r,
            height: size * r,
            borderRadius: size,
            backgroundColor: '#fff',
            opacity: 0.7,
          }}
        />
      ))}
    </>
  );
}

/** The picture for a goal or track: its bright gradient, soft light, and a white icon in a glow. */
export function Art({ icon, index, size, selected, tone }: { icon: IconName; index: number; size: number; selected?: boolean; tone?: string }) {
  const t = useTheme();
  const colors = paletteFor(tone, index, t);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(t.radius, size > 80 ? 24 : 12),
        overflow: 'hidden',
        borderWidth: selected ? 2 : 0,
        borderColor: t.colors.accent,
      }}>
      <LinearGradient colors={[...colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {size > 60 && <Glints size={size} seed={index} />}
        <View style={{ position: 'absolute', width: size * 0.56, height: size * 0.56, borderRadius: size, backgroundColor: '#fff', opacity: 0.18 }} />
        <Icon name={icon} size={size * 0.3} color="#fff" />
      </LinearGradient>
    </View>
  );
}

/** A sideways-scrolling row that runs past the screen's side padding, so it clearly scrolls. */
export function Shelf({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
      {children}
    </ScrollView>
  );
}

/**
 * A card on a shelf: a tall, colourful poster. A bright gradient for its topic, soft light and sparkles,
 * a white icon in a glow, and the title in white over a dark fade at the bottom.
 */
export function ShelfCard({
  icon,
  index,
  title,
  subtitle,
  onPress,
  selected,
  size = 108,
  tone,
}: {
  icon: IconName;
  index: number;
  title: string;
  subtitle: string;
  onPress: () => void;
  selected?: boolean;
  /** The card's width; it's a fifth taller than it is wide. */
  size?: number;
  /** A track id or category, to pick the card's colours. */
  tone?: string;
}) {
  const t = useTheme();
  const colors = paletteFor(tone, index, t);
  const height = Math.round(size * 1.2);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => ({ width: size, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <View
        style={{
          width: size,
          height,
          borderRadius: Math.max(t.radius, 20),
          overflow: 'hidden',
          borderWidth: selected ? 2 : 0,
          borderColor: t.colors.accent,
          shadowColor: colors[1],
          shadowOpacity: 0.35,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
        }}>
        <LinearGradient colors={[...colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
          <Glints size={size} seed={index} />
          {/* The icon sits at the same height on every card, however many lines the title takes. */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.6, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: size * 0.62, height: size * 0.62, borderRadius: size, backgroundColor: '#fff', opacity: 0.16 }} />
            <View style={{ position: 'absolute', width: size * 0.42, height: size * 0.42, borderRadius: size, backgroundColor: '#fff', opacity: 0.18 }} />
            <Icon name={icon} size={size * 0.26} color="#fff" />
          </View>
          <View style={{ flex: 1 }} />
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']} style={{ paddingHorizontal: 10, paddingTop: 14, paddingBottom: 10 }}>
            <Text numberOfLines={2} style={{ color: '#fff', fontFamily: t.fonts.bodyMedium, fontSize: size < 120 ? 13 : 15, lineHeight: size < 120 ? 17 : 19 }}>
              {title}
            </Text>
            <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.8)', fontFamily: t.fonts.body, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
              {subtitle}
            </Text>
          </LinearGradient>
        </LinearGradient>
      </View>
    </Pressable>
  );
}
