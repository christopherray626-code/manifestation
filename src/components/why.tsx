import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, Txt, useTheme } from '@/components/ui';

/** A small "Why it works" link that opens a few lines of explanation in place. */
export function Why({ text, label = 'Why it works' }: { text: string; label?: string }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        hitSlop={8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 }}>
        <Icon name="information-circle-outline" size={16} color={t.colors.accent} />
        <Txt variant="muted" style={{ color: t.colors.accent }}>
          {label}
        </Txt>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} color={t.colors.accent} />
      </Pressable>
      {open && <Txt variant="muted">{text}</Txt>}
    </View>
  );
}
