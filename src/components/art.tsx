import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';

import { Icon, useTheme, type IconName } from '@/components/ui';
import { usePress } from '@/lib/motion';

import { paletteFor } from '@/lib/palette';

export { paletteFor };

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
  const press = usePress(0.94);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={{ width: size }}>
      <Animated.View
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
      </Animated.View>
    </Pressable>
  );
}
