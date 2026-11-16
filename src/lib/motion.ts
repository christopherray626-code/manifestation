import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';

/*
 * The app's motion, in one place: a springy press for anything tappable, and a soft rise for screens
 * as they come into view. Nothing to set up and no settings; it all goes still for people who turn on
 * Reduce motion.
 */

// The web has no native animation driver; asking for one there only prints a warning.
export const NATIVE = Platform.OS !== 'web';

let reduced = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((on) => (reduced = on))
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (on) => (reduced = on));

/** Whether the person asked their phone for less motion. */
export function useReducedMotion() {
  const [on, setOn] = useState(reduced);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setOn).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn);
    return () => sub.remove();
  }, []);
  return on;
}

/** A press that sinks a little and springs back. Spread the handlers on a Pressable, the style on what moves. */
export function usePress(depth = 0.96) {
  const [scale] = useState(() => new Animated.Value(1));
  const to = (value: number) => {
    if (reduced) return;
    Animated.spring(scale, { toValue: value, useNativeDriver: NATIVE, speed: 40, bounciness: value === 1 ? 8 : 0 }).start();
  };
  return {
    onPressIn: () => to(depth),
    onPressOut: () => to(1),
    style: { transform: [{ scale }] },
  };
}

/**
 * A soft fade-and-rise, replayed whenever `key` changes (a screen coming into focus, say). `delay` lets a
 * screen's sections follow one another in a cascade.
 */
export function useRise(key: unknown, delay = 0) {
  const [v] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduced) return;
    v.setValue(0);
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
    ]);
    // Always land on fully shown, even if the animation is interrupted.
    anim.start(() => v.setValue(1));
    return () => {
      anim.stop();
      v.setValue(1);
    };
  }, [key, v, delay]);
  return {
    opacity: v,
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  };
}
