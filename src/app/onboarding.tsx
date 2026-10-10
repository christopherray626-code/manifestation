import { router } from 'expo-router';
import { View } from 'react-native';

import { ThemePicker } from '@/components/theme-picker';
import { Button, Screen, Txt } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function Onboarding() {
  const { updateSettings } = useStore();
  return (
    <Screen>
      <View style={{ gap: 6, marginTop: 12 }}>
        <Txt variant="display">Pick your vibe</Txt>
        <Txt variant="muted">You can change it anytime in You.</Txt>
      </View>
      <ThemePicker />
      <Button
        title="Continue"
        onPress={() => {
          updateSettings({ onboarded: true });
          router.replace('/');
        }}
      />
    </Screen>
  );
}
