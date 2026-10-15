import { RotationPicker } from '@/components/goal-bits';
import { ReminderList } from '@/components/reminder-list';
import { ThemePicker } from '@/components/theme-picker';
import { Card, Field, Screen, Section, Txt } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function YouScreen() {
  const { settings, updateSettings } = useStore();

  return (
    <Screen>
      <Txt variant="display">You</Txt>

      <Section label="Your name">
        <Field
          value={settings.name}
          onChangeText={(name) => updateSettings({ name })}
          placeholder="What should we call you?"
          autoCapitalize="words"
        />
      </Section>

      <Section label="Reminders">
        <ReminderList />
      </Section>

      <Section label="Theme">
        <ThemePicker />
      </Section>

      <Section label="For new goals">
        <Card>
          <RotationPicker
            value={settings.defaultRotation}
            onChange={(patch) => updateSettings({ defaultRotation: { ...settings.defaultRotation, ...patch } })}
          />
        </Card>
      </Section>

      <Txt variant="muted" style={{ textAlign: 'center', marginTop: 8 }}>
        Everything you write stays on this phone.
      </Txt>
    </Screen>
  );
}
