import { router } from 'expo-router';
import { View } from 'react-native';

import { RotationPicker } from '@/components/goal-bits';
import { ReminderList } from '@/components/reminder-list';
import { ThemePicker } from '@/components/theme-picker';
import { Card, Chip, ChipRow, Field, Icon, Screen, Section, Txt, useTheme } from '@/components/ui';
import { BILLING_LIVE } from '@/lib/premium';
import { useStore } from '@/lib/store';

export default function YouScreen() {
  const t = useTheme();
  const { settings, updateSettings } = useStore();

  return (
    <Screen>
      <Txt variant="display">Me</Txt>

      <Section label="Your name">
        <Field
          value={settings.name}
          onChangeText={(name) => updateSettings({ name })}
          placeholder="What should we call you?"
          autoCapitalize="words"
          // Keeps Chrome from popping its name/email autofill bar over the tabs.
          autoComplete="off"
          importantForAutofill="no"
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

      <Section label="Feel">
        <ChipRow>
          <Chip label="Vibrations on" selected={settings.haptics !== false} onPress={() => updateSettings({ haptics: true })} />
          <Chip label="Off" selected={settings.haptics === false} onPress={() => updateSettings({ haptics: false })} />
        </ChipRow>
      </Section>

      <Card onPress={() => router.push('/paywall')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Icon name="star-outline" size={22} color={t.colors.accent} />
          <View style={{ flex: 1 }}>
            <Txt variant="medium">Premium</Txt>
            <Txt variant="muted">{BILLING_LIVE ? 'Every voice, your own voice, unlimited goals' : 'Everything is free for now'}</Txt>
          </View>
          <Icon name="chevron-forward" size={18} color={t.colors.muted} />
        </View>
      </Card>

      <Card onPress={() => router.push('/board')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Icon name="images-outline" size={22} color={t.colors.accent} />
          <View style={{ flex: 1 }}>
            <Txt variant="medium">Vision board</Txt>
            <Txt variant="muted">Coming soon</Txt>
          </View>
          <Icon name="chevron-forward" size={18} color={t.colors.muted} />
        </View>
      </Card>

      <Txt variant="muted" style={{ textAlign: 'center', marginTop: 8 }}>
        Everything you write stays on this phone.
      </Txt>
    </Screen>
  );
}
