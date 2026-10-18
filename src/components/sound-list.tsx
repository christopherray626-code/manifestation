import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Chip, ChipRow, Icon, Txt, useTheme, type IconName } from '@/components/ui';
import { SOUND_KINDS, SOUND_LIST, type SoundKind } from '@/lib/sounds';
import type { BackgroundSound } from '@/lib/types';

function SoundRow({
  icon,
  label,
  tags,
  selected,
  onPress,
}: {
  icon: IconName;
  label: string;
  tags: string;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6, opacity: pressed ? 0.7 : 1 })}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: t.colors.card,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? t.colors.accent : t.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name={icon} size={22} color={selected ? t.colors.accent : t.colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="medium" style={selected ? { color: t.colors.accent } : undefined}>
          {label}
        </Txt>
        <Txt variant="muted">{tags}</Txt>
      </View>
      {selected && <Icon name="checkmark-circle" size={22} color={t.colors.accent} />}
    </Pressable>
  );
}

/** The background sound: the current one, and a filterable list to change it. */
export function SoundList({
  value,
  onChange,
  allowNone,
}: {
  value: BackgroundSound;
  onChange: (sound: BackgroundSound) => void;
  allowNone: boolean;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<SoundKind | 'all'>('all');
  const current = SOUND_LIST.find((s) => s.id === value);
  const shown = SOUND_LIST.filter((s) => kind === 'all' || s.kind === kind);

  if (!open) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          {current ? (
            <SoundRow icon={current.icon} label={current.label} tags={current.tags} selected onPress={() => setOpen(true)} />
          ) : (
            <SoundRow icon="volume-mute-outline" label="No background" tags="Just the voice" selected onPress={() => setOpen(true)} />
          )}
        </View>
        <Pressable onPress={() => setOpen(true)} hitSlop={10} accessibilityRole="button">
          <Txt variant="muted" style={{ color: t.colors.accent }}>
            Change
          </Txt>
        </Pressable>
      </View>
    );
  }

  const pick = (sound: BackgroundSound) => {
    onChange(sound);
    setOpen(false);
  };
  return (
    <View style={{ gap: 6 }}>
      <ChipRow>
        {SOUND_KINDS.map((k) => (
          <Chip key={k.id} label={k.label} selected={kind === k.id} onPress={() => setKind(k.id)} />
        ))}
      </ChipRow>
      {shown.map((s) => (
        <SoundRow key={s.id} icon={s.icon} label={s.label} tags={s.tags} selected={value === s.id} onPress={() => pick(s.id)} />
      ))}
      {allowNone && kind === 'all' && (
        <SoundRow icon="volume-mute-outline" label="No background" tags="Just the voice" selected={value === 'none'} onPress={() => pick('none')} />
      )}
    </View>
  );
}
