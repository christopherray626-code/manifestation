import { Pressable, Text, View } from 'react-native';

import { Icon, Txt, useTheme } from '@/components/ui';
import { useStore } from '@/lib/store';
import { themes, type Theme } from '@/themes';

function ThemeCard({ theme, selected, onPress }: { theme: Theme; selected: boolean; onPress: () => void }) {
  const current = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${theme.name} theme`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 10,
        borderRadius: current.radius,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? current.colors.accent : current.colors.border,
        opacity: pressed ? 0.8 : 1,
      })}>
      {/* A tiny preview drawn in the theme's own colors and fonts. */}
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: Math.min(theme.radius, 12),
          backgroundColor: c.bg,
          borderWidth: 1,
          borderColor: c.border,
          padding: 8,
          justifyContent: 'space-between',
        }}>
        <Text style={{ fontFamily: theme.fonts.display, fontSize: 20, color: c.text, textTransform: theme.displayCaps ? 'uppercase' : 'none' }}>
          Aa
        </Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.muted }} />
        </View>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="medium">{theme.name}</Txt>
        <Txt variant="muted">{theme.blurb}</Txt>
      </View>
      {selected && <Icon name="checkmark-circle" size={22} color={current.colors.accent} />}
    </Pressable>
  );
}

/** Theme list in two groups; picking one applies it right away. */
export function ThemePicker() {
  const { settings, updateSettings } = useStore();
  const groups: { id: Theme['group']; label: string }[] = [
    { id: 'mystical', label: 'Mystical' },
    { id: 'everyday', label: 'Everyday' },
  ];
  return (
    <View style={{ gap: 18 }}>
      {groups.map((g) => (
        <View key={g.id} style={{ gap: 8 }}>
          <Txt variant="label">{g.label}</Txt>
          {themes
            .filter((t) => t.group === g.id)
            .map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                selected={settings.themeId === t.id}
                onPress={() => updateSettings({ themeId: t.id })}
              />
            ))}
        </View>
      ))}
    </View>
  );
}
