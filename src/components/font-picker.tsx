import { getTheme } from '@/themes';

import { Chip, ChipRow, QUOTE_FONTS } from '@/components/ui';
import { useStore } from '@/lib/store';

/** Which font affirmations are shown in, each choice written in its own font. */
export function FontPicker() {
  const { settings, updateSettings } = useStore();
  const themeFont = getTheme(settings.themeId).fonts.quote;
  return (
    <ChipRow>
      {QUOTE_FONTS.map((f) => (
        <Chip
          key={f.label}
          label={f.label}
          font={f.font ?? themeFont}
          selected={(settings.quoteFont ?? undefined) === f.font}
          onPress={() => updateSettings({ quoteFont: f.font })}
        />
      ))}
    </ChipRow>
  );
}
