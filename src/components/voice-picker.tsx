import { View } from 'react-native';

import { Chip, ChipRow, Txt } from '@/components/ui';
import type { Voice } from '@/lib/types';

// Chris's favourites first: Brittney (Serene), Jessica (Silk), Matilda (Warm), George (Gentle).
export const VOICE_LIST: { id: Voice; label: string; who: 'her' | 'him' | 'you' }[] = [
  { id: 'serene-female', label: 'Serene', who: 'her' },
  { id: 'silk-female', label: 'Silk', who: 'her' },
  { id: 'warm-female', label: 'Warm', who: 'her' },
  { id: 'calm-female', label: 'Calm', who: 'her' },
  { id: 'soft-female', label: 'Soft', who: 'her' },
  { id: 'velvet-female', label: 'Velvet', who: 'her' },
  { id: 'gentle-male', label: 'Gentle', who: 'him' },
  { id: 'deep-male', label: 'Deep', who: 'him' },
  { id: 'narrator-male', label: 'Narrator', who: 'him' },
  { id: 'steady-male', label: 'Steady', who: 'him' },
  { id: 'my-voice', label: 'My voice', who: 'you' },
];

/** The voices, in a row each for women's and men's, plus your own recordings where allowed. */
export function VoicePicker({ value, onChange, allowMine = true }: { value: Voice; onChange: (v: Voice) => void; allowMine?: boolean }) {
  const row = (who: 'her' | 'him', label: string) => (
    <View style={{ gap: 6 }}>
      <Txt variant="muted" style={{ fontSize: 12 }}>
        {label}
      </Txt>
      <ChipRow>
        {VOICE_LIST.filter((v) => v.who === who).map((v) => (
          <Chip key={v.id} label={v.label} selected={value === v.id} onPress={() => onChange(v.id)} />
        ))}
      </ChipRow>
    </View>
  );
  return (
    <View style={{ gap: 10 }}>
      {row('her', 'Women')}
      {row('him', 'Men')}
      {allowMine && (
        <ChipRow>
          <Chip label="My voice" selected={value === 'my-voice'} onPress={() => onChange('my-voice')} />
        </ChipRow>
      )}
    </View>
  );
}
