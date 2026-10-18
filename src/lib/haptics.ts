import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/*
 * Small taps that mean something: light on play/pause and toggles, success on a saved affirmation or a
 * streak milestone. Turned off in Me > Haptics; phones only (the web has none).
 */
let enabled = true;
export function setHapticsEnabled(on: boolean) {
  enabled = on;
}

const ok = () => enabled && Platform.OS !== 'web';

export const tap = () => {
  if (ok()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const success = () => {
  if (ok()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};
