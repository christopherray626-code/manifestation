import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon, Txt, useTheme, type IconName } from '@/components/ui';

/**
 * The picture on a goal or track card: a soft gradient in one of the theme's tints, a glow, and the
 * icon in the middle. `index` picks the tint, so cards next to each other differ.
 */
export function Art({ icon, index, size, selected }: { icon: IconName; index: number; size: number; selected?: boolean }) {
  const t = useTheme();
  const tint = t.colors.tints[index % t.colors.tints.length];
  const angle = index % 2 ? { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } : { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } };
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(t.radius, 14),
        overflow: 'hidden',
        borderWidth: selected ? 2 : 0,
        borderColor: t.colors.accent,
      }}>
      <LinearGradient colors={[tint, t.colors.card]} {...angle} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* A soft glow behind the icon, and a ring out past it. */}
        <View
          style={{
            position: 'absolute',
            width: size * 1.1,
            height: size * 1.1,
            borderRadius: size,
            borderWidth: 1,
            borderColor: t.colors.accent,
            opacity: 0.12,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: size * 0.62,
            height: size * 0.62,
            borderRadius: size,
            backgroundColor: t.colors.accent,
            opacity: 0.14,
          }}
        />
        <Icon name={icon} size={size * 0.27} color={t.colors.accent} />
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
 * A card on a shelf: a tall poster. The theme's colour falls from the top into the dark, a soft glow
 * sits behind the icon, and the title is written on the card itself, with a small line under it.
 */
export function ShelfCard({
  icon,
  index,
  title,
  subtitle,
  onPress,
  selected,
  size = 128,
}: {
  icon: IconName;
  index: number;
  title: string;
  subtitle: string;
  onPress: () => void;
  selected?: boolean;
  /** The card's width; it's a third taller than it is wide. */
  size?: number;
}) {
  const t = useTheme();
  const tint = t.colors.tints[index % t.colors.tints.length];
  const height = Math.round(size * 1.35);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => ({ width: size, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <View
        style={{
          width: size,
          height,
          borderRadius: Math.max(t.radius, 16),
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: selected ? t.colors.accent : t.colors.border,
        }}>
        <LinearGradient colors={[tint + 'CC', t.colors.card, t.colors.bg]} locations={[0, 0.55, 1]} style={{ flex: 1, padding: 12 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: size * 0.7, height: size * 0.7, borderRadius: size, backgroundColor: tint, opacity: 0.18 }} />
            <View style={{ position: 'absolute', width: size * 0.45, height: size * 0.45, borderRadius: size, backgroundColor: tint, opacity: 0.18 }} />
            <Icon name={icon} size={size * 0.24} color={t.colors.text} />
          </View>
          <Txt variant="medium" numberOfLines={2} style={{ fontSize: 14, lineHeight: 18 }}>
            {title}
          </Txt>
          <Txt variant="muted" numberOfLines={1} style={{ fontSize: 12, lineHeight: 16, marginTop: 2 }}>
            {subtitle}
          </Txt>
        </LinearGradient>
      </View>
    </Pressable>
  );
}
