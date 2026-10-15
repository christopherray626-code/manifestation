import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, Chip, ChipRow, Icon, Txt, useTheme, type IconName } from '@/components/ui';
import { askPermission, formatTime, MAX_REMINDERS, supported } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { newId, type Reminder } from '@/lib/types';

const STEP = 15;

function RoundButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: t.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}>
      <Icon name={icon} size={16} color={t.colors.muted} />
    </Pressable>
  );
}

function ReminderCard({
  reminder,
  onChange,
  onRemove,
}: {
  reminder: Reminder;
  onChange: (patch: Partial<Reminder>) => void;
  onRemove: () => void;
}) {
  const t = useTheme();
  const shift = (minutes: number) => {
    const total = (reminder.hour * 60 + reminder.minute + minutes + 1440) % 1440;
    onChange({ hour: Math.floor(total / 60), minute: total % 60 });
  };

  return (
    <Card highlight={reminder.enabled}>
      <View style={{ gap: 12, opacity: reminder.enabled ? 1 : 0.55 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <RoundButton icon="remove" label="Earlier" onPress={() => shift(-STEP)} />
          <Txt variant="title" style={{ minWidth: 92, textAlign: 'center' }}>
            {formatTime(reminder.hour, reminder.minute)}
          </Txt>
          <RoundButton icon="add" label="Later" onPress={() => shift(STEP)} />
          <View style={{ flex: 1 }} />
          <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel="Remove reminder" hitSlop={8}>
            <Icon name="trash-outline" size={18} color={t.colors.muted} />
          </Pressable>
        </View>
        <ChipRow>
          <Chip
            label="Today's affirmation"
            selected={reminder.opens === 'affirmation'}
            onPress={() => onChange({ opens: 'affirmation' })}
          />
          <Chip label="My tape" selected={reminder.opens === 'tape'} onPress={() => onChange({ opens: 'tape' })} />
          <Chip
            label={reminder.enabled ? 'On' : 'Off'}
            selected={reminder.enabled}
            onPress={() => onChange({ enabled: !reminder.enabled })}
          />
        </ChipRow>
      </View>
    </Card>
  );
}

/** Daily reminders that open today's affirmation or the tape. */
export function ReminderList() {
  const { settings, updateSettings } = useStore();
  const [blocked, setBlocked] = useState(false);
  const reminders = settings.reminders;

  if (!supported) {
    return <Txt variant="muted">Reminders work in the phone app.</Txt>;
  }

  const save = (next: Reminder[]) => updateSettings({ reminders: next });

  const turnOn = async () => {
    const ok = await askPermission();
    setBlocked(!ok);
    return ok;
  };

  const add = async () => {
    const ok = await turnOn();
    // A first reminder in the morning, a second at night for the tape.
    const evening = reminders.length > 0;
    save([
      ...reminders,
      {
        id: newId(),
        hour: evening ? 21 : 8,
        minute: evening ? 30 : 0,
        opens: evening ? 'tape' : 'affirmation',
        enabled: ok,
      },
    ]);
  };

  const change = async (id: string, patch: Partial<Reminder>) => {
    if (patch.enabled && !(await turnOn())) return;
    save(settings.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <View style={{ gap: 10 }}>
      {reminders.map((r) => (
        <ReminderCard
          key={r.id}
          reminder={r}
          onChange={(patch) => change(r.id, patch)}
          onRemove={() => save(reminders.filter((x) => x.id !== r.id))}
        />
      ))}
      {blocked && (
        <Txt variant="muted">
          Notifications are turned off for this app. Turn them on in your phone&apos;s Settings, then try again.
        </Txt>
      )}
      {reminders.length < MAX_REMINDERS && (
        <Button title={reminders.length ? 'Add another reminder' : 'Add a reminder'} icon="notifications-outline" kind="ghost" onPress={add} />
      )}
    </View>
  );
}
