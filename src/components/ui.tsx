import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import {
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

import { useStore } from '@/lib/store';
import { getTheme, type Theme } from '@/themes';

export type IconName = keyof typeof Ionicons.glyphMap;

export function useTheme(): Theme {
  return getTheme(useStore().settings.themeId);
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

function Stars() {
  const t = useTheme();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {STARS.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            borderRadius: s.size,
            backgroundColor: s.gold ? t.colors.accent : '#FFFFFF',
            opacity: s.gold ? 0.7 : 0.5,
          }}
        />
      ))}
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

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {t.decor === 'stars' && <Stars />}
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, { flex: 1 }]}>{children}</View>
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
      return {
        backgroundColor: t.colors.card,
        borderRadius: t.radius,
        padding: 16,
        borderWidth: highlight ? 1 : 0,
        borderColor: border,
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
  if (!onPress) return <View style={[cardStyle(t, highlight), style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [cardStyle(t, highlight), style, pressed && { opacity: 0.75 }]}>
      {children}
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { borderRadius: t.radius },
        primary
          ? { backgroundColor: t.colors.accent }
          : { borderWidth: 1, borderColor: t.colors.border, borderStyle: 'dashed' },
        pressed && { opacity: 0.75 },
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
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={2}
      style={[
        styles.chip,
        { borderColor: selected ? t.colors.accent : t.colors.border },
        selected && { backgroundColor: t.colors.accent + '22' },
      ]}>
      <Text
        style={{
          fontFamily: t.fonts.body,
          fontSize: 14,
          color: selected ? (t.dark ? t.colors.accent : t.colors.text) : t.colors.muted,
        }}>
        {label}
      </Text>
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
