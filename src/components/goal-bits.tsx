import { View } from 'react-native';

import { Card, Chip, ChipRow, Icon, Section, Txt, useTheme, type IconName } from '@/components/ui';
import { dayOfGoal } from '@/lib/today';
import type { Category, Goal, Rotation } from '@/lib/types';

export const CATEGORIES: { id: Category; label: string; icon: IconName }[] = [
  { id: 'car', label: 'Car', icon: 'car-sport-outline' },
  { id: 'money', label: 'Money', icon: 'cash-outline' },
  { id: 'love', label: 'Love', icon: 'heart-outline' },
  { id: 'home', label: 'Home', icon: 'home-outline' },
  { id: 'health', label: 'Health', icon: 'fitness-outline' },
  { id: 'career', label: 'Career', icon: 'briefcase-outline' },
  { id: 'other', label: 'Something else', icon: 'sparkles-outline' },
];

export function categoryIcon(category: Category): IconName {
  return CATEGORIES.find((c) => c.id === category)?.icon ?? 'sparkles-outline';
}

function toRoman(n: number) {
  const parts: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  for (const [value, letters] of parts) {
    while (n >= value) {
      out += letters;
      n -= value;
    }
  }
  return out;
}

export function dayLabel(goal: Goal, roman: boolean) {
  const day = dayOfGoal(goal);
  return roman ? `Day ${toRoman(day)}` : `Day ${day}`;
}

export function GoalIcon({ goal, index }: { goal: Goal; index: number }) {
  const t = useTheme();
  if (t.goalIcon === 'none') return null;
  const ring = t.goalIcon === 'ring';
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: ring ? 20 : 12,
        borderWidth: ring ? 1 : 0,
        borderColor: t.colors.accent,
        backgroundColor: ring ? 'transparent' : t.colors.tints[index % t.colors.tints.length],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={categoryIcon(goal.category)} size={19} color={ring ? t.colors.accent : t.dark ? t.colors.bg : t.colors.accent} />
    </View>
  );
}

export function GoalRow({ goal, index, onPress }: { goal: Goal; index: number; onPress: () => void }) {
  const t = useTheme();
  const count = goal.affirmations.length;
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <GoalIcon goal={goal} index={index} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant={t.goalIcon === 'none' && t.card !== 'line' ? 'medium' : 'title'} numberOfLines={1}>
            {goal.title}
          </Txt>
          <Txt variant="muted">
            {count} affirmation{count === 1 ? '' : 's'} · {dayLabel(goal, t.romanDays).toLowerCase()}
          </Txt>
        </View>
        <Icon name="chevron-forward" size={18} color={t.colors.accent} />
      </View>
    </Card>
  );
}

const EVERY: { value: number; label: string }[] = [
  { value: -1, label: 'Each time I open the app' },
  { value: 1, label: 'Every day' },
  { value: 3, label: 'Every 3 days' },
  { value: 7, label: 'Every week' },
  { value: 30, label: 'Every month' },
  { value: 0, label: 'Never, keep one' },
];

type RotationChoice = Pick<Rotation, 'every' | 'order' | 'favoritesOnly'>;

/** Lets people choose how often today's affirmation changes, down to never. */
export function RotationPicker({
  value,
  onChange,
}: {
  value: RotationChoice;
  onChange: (patch: Partial<RotationChoice>) => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <Section label="Change today's affirmation">
        <ChipRow>
          {EVERY.map((e) => (
            <Chip key={e.value} label={e.label} selected={value.every === e.value} onPress={() => onChange({ every: e.value })} />
          ))}
        </ChipRow>
      </Section>
      {value.every !== 0 && (
        <Section label="Order">
          <ChipRow>
            <Chip label="In order" selected={value.order === 'inOrder'} onPress={() => onChange({ order: 'inOrder' })} />
            <Chip label="Shuffle" selected={value.order === 'shuffle'} onPress={() => onChange({ order: 'shuffle' })} />
          </ChipRow>
        </Section>
      )}
      <Section label="Pick from">
        <ChipRow>
          <Chip label="All of them" selected={!value.favoritesOnly} onPress={() => onChange({ favoritesOnly: false })} />
          <Chip label="Only favorites" selected={value.favoritesOnly} onPress={() => onChange({ favoritesOnly: true })} />
        </ChipRow>
      </Section>
    </View>
  );
}
