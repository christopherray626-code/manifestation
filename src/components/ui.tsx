import Ionicons from '@expo/vector-icons/Ionicons';
import { Children, useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { select, tap } from '@/lib/haptics';
import { usePress, useRise } from '@/lib/motion';
import { useThemeId } from '@/lib/store';
import { getTheme, type Theme } from '@/themes';

export type IconName = keyof typeof Ionicons.glyphMap;

export function useTheme(): Theme {
  return getTheme(useThemeId());
}

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.colors.text} />;
}

// Fixed star positions (percent of the screen) so they don't jump around between renders.
const STARS = Array.from({ length: 34 }, (_, i) => ({
  left: (i * 37.3) % 100,
  top: (i * 61.7 + (i % 3) * 13) % 100,
  size: i % 5 === 0 ? 3 : 2,
  gold: i % 4 === 0,
}));

const GLOW = require('@/assets/images/launch-glow.png');

/** Stars on dark themes. With `twinkle` (Starlight), a few at a time softly brighten and dim. */
function Stars({ twinkle = false, count = STARS.length }: { twinkle?: boolean; count?: number }) {
  const t = useTheme();
  const [phase] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));
  useEffect(() => {
    if (!twinkle) return;
    let loops: Animated.CompositeAnimation[] = [];
    AccessibilityInfo.isReduceMotionEnabled()
      .then((still) => {
        if (still) return;
        loops = phase.map((v, k) =>
          Animated.loop(
            Animated.sequence([
              Animated.delay(k * 1300),
              Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(v, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.delay(2400 - k * 600),
            ]),
          ),
        );
        loops.forEach((l) => l.start());
      })
      .catch(() => {});
    return () => loops.forEach((l) => l.stop());
  }, [twinkle, phase]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {STARS.slice(0, count).map((s, i) => {
        const base = s.gold ? 0.7 : 0.5;
        // Every third star joins one of three twinkle groups.
        const group = twinkle && i % 3 === 0 ? phase[(i / 3) % 3 | 0] : null;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              borderRadius: s.size,
              backgroundColor: s.gold ? t.colors.accent : '#FFFFFF',
              opacity: group ? group.interpolate({ inputRange: [0, 1], outputRange: [base * 0.35, 1] }) : base,
              transform: group ? [{ scale: group.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }] : [],
            }}
          />
        );
      })}
    </View>
  );
}

/** A soft round glow that fades out like light: a white radial image tinted to the colour, so it has no edges. */
function Glow({ color, size, opacity }: { color: string; size: number; opacity: number }) {
  return (
    <View pointerEvents="none">
      <Image source={GLOW} tintColor={color} style={{ width: size, height: size, opacity: Math.min(1, opacity * 1.6) }} />
    </View>
  );
}

/** The Moon theme's moon: a pale disc with a halo, high in the corner. */
function Moon() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: -40, right: -70, width: 220, height: 220, alignItems: 'center', justifyContent: 'center', opacity: 0.75 }}>
      <Glow color="#E6ECF8" size={220} opacity={0.22} />
      <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: '#C9D2E3', opacity: 0.16 }} />
      <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: '#E6ECF8', opacity: 0.18 }} />
    </View>
  );
}

/**
 * The sky behind every screen, in the theme's own style: two slow glows drifting about, plus stars on
 * dark themes (twinkling on Starlight), a moon on Moon, and three pastel colours drifting and blending
 * on Aura. It's what makes the app feel like its own place rather than a stack of panels. Holds still
 * when Reduce motion is on.
 */
function Ambient() {
  const t = useTheme();
  const [drift] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((still) => {
        if (still) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(drift, { toValue: 1, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(drift, { toValue: 0, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        );
        loop.start();
      })
      .catch(() => {});
    return () => loop?.stop();
  }, [drift]);
  const move = (x: number, y: number) => ({
    transform: [
      { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, x] }) },
      { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) },
    ],
  });

  if (t.decor === 'aura') {
    const [a, b, c] = t.colors.tints;
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <Animated.View style={[{ position: 'absolute', top: -160, left: -180 }, move(80, 60)]}>
          <Glow color={a} size={520} opacity={0.6} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', top: '30%', right: -220 }, move(-70, 50)]}>
          <Glow color={b} size={520} opacity={0.6} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', bottom: -200, left: -120 }, move(60, -70)]}>
          <Glow color={c} size={540} opacity={0.6} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <Animated.View style={[{ position: 'absolute', top: -140, left: -160 }, move(60, 40)]}>
        <Glow color={t.colors.tints[0]} size={460} opacity={t.dark ? 0.35 : 0.25} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', bottom: -180, right: -200 }, move(-50, -60)]}>
        <Glow color={t.colors.accent} size={520} opacity={t.dark ? (t.decor === 'moon' ? 0.12 : 0.28) : 0.2} />
      </Animated.View>
      {t.decor === 'moon' && <Moon />}
      {t.dark && <Stars twinkle={t.decor === 'stars'} count={t.decor === 'moon' ? 14 : STARS.length} />}
    </View>
  );
}

/** A glowing orb in the theme's own colours; the player's centrepiece. */
export function ThemeOrb({ size = 220 }: { size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute' }}>
        <Glow color={t.colors.accent} size={size} opacity={0.55} />
      </View>
      <View
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size,
          backgroundColor: t.colors.accent,
          opacity: 0.9,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size,
          borderWidth: 1,
          borderColor: t.colors.text,
          opacity: 0.25,
        }}
      />
    </View>
  );
}

/** The aura theme's glowing orb: stacked circles from dark to bright. */
export function Orb({ size = 150 }: { size?: number }) {
  const rings = ['#2E1652', '#4B2385', '#8A4FD8', '#E7B8FF'];
  return (
    <View style={{ height: size, alignItems: 'center', justifyContent: 'center' }}>
      {rings.map((color, i) => {
        const d = size * (1 - i * 0.24);
        return (
          <View
            key={color}
            style={{ position: 'absolute', width: d, height: d, borderRadius: d, backgroundColor: color }}
          />
        );
      })}
    </View>
  );
}

/** One section of a scrolling screen, rising in a beat after the one above it. */
function RiseIn({ index, children }: { index: number; children: ReactNode }) {
  const rise = useRise(0, Math.min(index, 5) * 30);
  return <Animated.View style={rise}>{children}</Animated.View>;
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const t = useTheme();
  // The first time a screen opens, its content rises softly into place. Not on every return to it:
  // replaying it each time you switched tabs or came back made the app feel slow to answer.
  const rise = useRise(0);
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Ambient />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {Children.toArray(children).map((child, i) => (
                <RiseIn key={i} index={i}>
                  {child}
                </RiseIn>
              ))}
            </View>
          </ScrollView>
        ) : (
          <Animated.View style={[styles.content, { flex: 1 }, rise]}>{children}</Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

type TxtVariant = 'display' | 'title' | 'body' | 'medium' | 'muted' | 'label' | 'quote';

export function Txt({
  variant = 'body',
  style,
  children,
  numberOfLines,
}: {
  variant?: TxtVariant;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
}) {
  const t = useTheme();
  const v: Record<TxtVariant, TextStyle> = {
    display: {
      fontFamily: t.fonts.display,
      fontSize: t.displayCaps ? 22 : 27,
      lineHeight: t.displayCaps ? 28 : 33,
      textTransform: t.displayCaps ? 'uppercase' : 'none',
    },
    title: { fontFamily: t.fonts.display, fontSize: 18, lineHeight: 24 },
    body: { fontFamily: t.fonts.body, fontSize: 15, lineHeight: 22 },
    medium: { fontFamily: t.fonts.bodyMedium, fontSize: 15, lineHeight: 21 },
    muted: { fontFamily: t.fonts.body, fontSize: 13, lineHeight: 19, color: t.colors.muted },
    label: {
      fontFamily: t.fonts.label,
      fontSize: 11,
      letterSpacing: t.labelSpacing,
      textTransform: t.labelCaps ? 'uppercase' : 'none',
      color: t.colors.label,
    },
    quote: { fontFamily: t.fonts.quote, fontSize: 18, lineHeight: 26 },
  };
  return (
    <Text numberOfLines={numberOfLines} style={[{ color: t.colors.text }, v[variant], style]}>
      {children}
    </Text>
  );
}

export function cardStyle(t: Theme, highlight = false): ViewStyle {
  const border = highlight ? t.colors.accent : t.colors.border;
  switch (t.card) {
    case 'outline':
      return { borderWidth: 1, borderColor: border, borderRadius: t.radius, padding: 16 };
    case 'filled':
      // See-through so the sky shows behind, with a hairline edge instead of a heavy block.
      return {
        backgroundColor: t.colors.card + 'B3',
        borderRadius: t.radius,
        padding: 16,
        borderWidth: 1,
        borderColor: highlight ? t.colors.accent : t.colors.border + '99',
      };
    case 'white':
      return { backgroundColor: t.colors.card, borderWidth: 1, borderColor: border, borderRadius: t.radius, padding: 16 };
    case 'line':
      return { borderBottomWidth: 1, borderColor: border, paddingVertical: 14, paddingHorizontal: 4 };
  }
}

export function Card({
  children,
  onPress,
  highlight,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  highlight?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const press = usePress(0.98);
  if (!onPress) return <View style={[cardStyle(t, highlight), style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
      <Animated.View style={[cardStyle(t, highlight), style, press.style]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost';
  icon?: IconName;
}) {
  const t = useTheme();
  const primary = kind === 'primary';
  const color = primary ? t.colors.onAccent : t.colors.muted;
  const press = usePress(0.96);
  // A small tap you can feel, so a press registers the instant it lands.
  const pressed = () => {
    tap();
    onPress();
  };
  return (
    <Pressable onPress={pressed} onPressIn={press.onPressIn} onPressOut={press.onPressOut} accessibilityRole="button">
      <Animated.View
        style={[
          styles.button,
          { borderRadius: t.radius },
          primary
            ? { backgroundColor: t.colors.accent }
            : { borderWidth: 1, borderColor: t.colors.border, borderStyle: 'dashed' },
          press.style,
        ]}>
      {icon && <Ionicons name={icon} size={18} color={color} />}
      <Text
        style={{
          color,
          fontFamily: primary ? t.fonts.button : t.fonts.body,
          fontSize: primary && t.buttonCaps ? 13 : 15,
          letterSpacing: primary && t.buttonCaps ? 1.5 : 0,
          textTransform: primary && t.buttonCaps ? 'uppercase' : 'none',
        }}>
        {title}
      </Text>
      </Animated.View>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const t = useTheme();
  const press = usePress(0.93);
  const pressed = () => {
    select();
    onPress();
  };
  return (
    <Pressable
      onPress={pressed}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={2}>
      <Animated.View
        style={[
          styles.chip,
          { borderColor: selected ? t.colors.accent : t.colors.border },
          selected && { backgroundColor: t.colors.accent + '22' },
          press.style,
        ]}>
      <Text
        style={{
          fontFamily: t.fonts.body,
          fontSize: 14,
          color: selected ? (t.dark ? t.colors.accent : t.colors.text) : t.colors.muted,
        }}>
        {label}
      </Text>
      </Animated.View>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function Field(props: TextInputProps & { error?: string }) {
  const t = useTheme();
  const { error, style, ...rest } = props;
  return (
    <View style={{ gap: 4 }}>
      <TextInput
        placeholderTextColor={t.colors.muted}
        style={[
          {
            backgroundColor: t.colors.field,
            borderWidth: 1,
            borderColor: error ? '#E26D5C' : t.colors.border,
            borderRadius: Math.max(t.radius - 2, 4),
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: t.colors.text,
            fontFamily: t.fonts.body,
            fontSize: 15,
            minHeight: props.multiline ? 90 : undefined,
            textAlignVertical: props.multiline ? 'top' : 'center',
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={{ color: '#E26D5C', fontSize: 13, fontFamily: t.fonts.body }}>{error}</Text> : null}
    </View>
  );
}

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Txt variant="label">{label}</Txt>
      {children}
    </View>
  );
}

/** "Today's affirmation" block, drawn in each theme's own way. */
export function QuoteBlock({ label, text, footer }: { label: string; text: string; footer?: ReactNode }) {
  const t = useTheme();
  if (t.quote === 'frame') {
    return (
      <View style={[styles.frameOuter, { borderColor: t.colors.border }]}>
        <View style={[styles.frame, { borderColor: t.colors.frame }]}>
          <Txt variant="label">{label}</Txt>
          <Icon name="sparkles-outline" size={16} color={t.colors.accent} />
          <Txt variant="quote" style={{ textAlign: 'center' }}>
            {text}
          </Txt>
          {footer}
        </View>
      </View>
    );
  }
  if (t.quote === 'card') {
    return (
      <View style={{ backgroundColor: t.dark ? t.colors.card : '#FFFFFF', borderRadius: t.radius, padding: 18, gap: 8, alignItems: 'center' }}>
        <Txt variant="muted">{label}</Txt>
        <Txt variant="quote" style={{ textAlign: 'center' }}>
          {text}
        </Txt>
        {footer}
      </View>
    );
  }
  if (t.quote === 'bar') {
    return (
      <View style={{ borderLeftWidth: 3, borderColor: t.colors.accent, paddingLeft: 14, paddingVertical: 4, gap: 6 }}>
        <Txt variant="muted">{label}</Txt>
        <Txt variant="quote" style={{ fontSize: 18, lineHeight: 25 }}>
          {text}
        </Txt>
        {footer}
      </View>
    );
  }
  const centered = t.labelCaps;
  return (
    <View style={{ borderTopWidth: 1, borderColor: t.colors.border, paddingTop: 16, paddingBottom: 4, gap: 8, alignItems: centered ? 'center' : 'flex-start' }}>
      <Txt variant="label">{label}</Txt>
      <Txt variant="quote" style={{ textAlign: centered ? 'center' : 'left', fontSize: centered ? 21 : 18 }}>
        {text}
      </Txt>
    </View>
  );
}

export function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
        <Icon name="chevron-back" size={24} color={t.colors.muted} />
      </Pressable>
      <Txt variant="title" style={{ flex: 1, fontSize: 22, lineHeight: 28 }} numberOfLines={2}>
        {title}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  // 20pt sides like iOS, 24 between sections, and no wider than a comfortable reading column on big screens.
  content: { padding: 20, paddingBottom: 64, gap: 24, width: '100%', maxWidth: 680, alignSelf: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  // 44 tall, 48 with the hit slop: big enough for a thumb on both platforms.
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frameOuter: { borderWidth: 1, borderRadius: 8, padding: 4 },
  frame: { borderWidth: 1, borderRadius: 6, padding: 16, gap: 8, alignItems: 'center' },
});
