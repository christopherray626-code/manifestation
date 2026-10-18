import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, View } from 'react-native';

import { Icon, Txt, useTheme } from '@/components/ui';

/**
 * A calm full-screen moment while something is being made (affirmations written, voices recorded):
 * rings that breathe outward, and a line that changes every couple of seconds so it never feels stuck.
 * Still rings for people with Reduce motion on.
 */
export function Creating({
  visible,
  messages,
  detail,
}: {
  visible: boolean;
  messages: string[];
  /** A progress line under the message, e.g. "3 of 12". */
  detail?: string;
}) {
  const t = useTheme();
  const [step, setStep] = useState(0);
  const [still, setStill] = useState(false);
  const [rings] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);

  // Start from the first line each time it opens.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setStep(0);
  }

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => setStep((s) => s + 1), 2400);
    return () => clearInterval(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible || still) return;
    // Three rings, a third of a breath apart, each growing and fading out.
    const loops = rings.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 900),
          Animated.timing(v, { toValue: 1, duration: 2700, easing: Easing.out(Easing.sin), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [visible, still, rings]);

  const message = messages[Math.min(step, messages.length - 1)];
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 40 }}>
        <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
          {rings.map((v, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: 110,
                borderWidth: 2,
                borderColor: t.colors.accent,
                opacity: still ? 0.25 / (i + 1) : v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.6, 0] }),
                transform: [{ scale: still ? 0.5 + i * 0.2 : v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
              }}
            />
          ))}
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              backgroundColor: t.colors.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="sparkles" size={34} color={t.colors.accent} />
          </View>
        </View>
        <View style={{ gap: 8, alignItems: 'center' }}>
          <Txt variant="title" style={{ textAlign: 'center' }}>
            {message}
          </Txt>
          {detail ? <Txt variant="muted">{detail}</Txt> : null}
        </View>
      </View>
    </Modal>
  );
}

export const WRITING_MESSAGES = [
  'Reading what’s already yours…',
  'Writing it in your words…',
  'Weaving in how it feels…',
  'Making every line land…',
  'Almost there…',
];

export const VOICING_MESSAGES = [
  'Bringing your affirmations to life…',
  'Finding the right tone…',
  'Recording each line…',
  'Almost ready to listen…',
];
