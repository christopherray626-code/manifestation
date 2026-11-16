import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/ui';

/*
 * The launch animation in the phone app: a glow swells, the star spins in with a bounce and a shine,
 * a ring ripples out, a burst of tiny sparkles flies outwards, three sparks pop, then it all lifts away.
 * It sits over the app as it first appears, in the saved theme's colours, and is a short still version
 * for people who turn on Reduce motion. The star and glow are white images tinted to the theme
 * (assets/images/launch-*.png), the same shapes as the web page's launch (public/index.html).
 * Skip (or a tap anywhere) cuts it short.
 */

const STAR = require('@/assets/images/launch-star.png');
const GLOW = require('@/assets/images/launch-glow.png');

const OVERSHOOT = Easing.bezier(0.34, 1.56, 0.64, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const SIZE = 110;
// Where the three sparks sit around the star (fractions of SIZE), their size and when they pop.
const SPARKS = [
  { x: 0.86, y: 0.2, size: 22, delay: 650 },
  { x: 0.14, y: 0.79, size: 15, delay: 780 },
  { x: 0.84, y: 0.82, size: 10, delay: 900 },
];
// The burst: tiny sparkles flying out in a ring, each at its own angle, distance and size.
const BURST = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * Math.PI * 2 + (i % 2 ? 0.18 : 0),
  distance: 120 + (i % 3) * 34,
  size: i % 3 === 0 ? 9 : 6,
}));

export function Launch() {
  const t = useTheme();
  const [done, setDone] = useState(Platform.OS === 'web'); // the web page draws its own
  const [v] = useState(() => ({
    glow: new Animated.Value(0),
    star: new Animated.Value(0),
    shine: new Animated.Value(0),
    ring: new Animated.Value(0),
    burst: new Animated.Value(0),
    sparks: SPARKS.map(() => new Animated.Value(0)),
    out: new Animated.Value(0),
  }));
  const insets = useSafeAreaInsets();
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const skipped = useRef(false);

  /** Straight to the app: stop the show and fade away quickly. */
  function skip() {
    if (skipped.current) return;
    skipped.current = true;
    running.current?.stop();
    Animated.timing(v.out, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => setDone(true));
  }

  useEffect(() => {
    if (done) return;
    let stopped = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((still) => {
        if (stopped || skipped.current) return;
        const timing = (value: Animated.Value, duration: number, easing = EASE_OUT, delay = 0) =>
          Animated.sequence([Animated.delay(delay), Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: true })]);
        if (still) {
          [v.glow, v.star, ...v.sparks].forEach((a) => a.setValue(1));
          running.current = Animated.sequence([Animated.delay(600), timing(v.out, 300)]);
          running.current.start(({ finished }) => finished && setDone(true));
          return;
        }
        running.current = Animated.parallel([
          timing(v.glow, 1100),
          timing(v.star, 850, OVERSHOOT, 120),
          timing(v.ring, 900, EASE_OUT, 480),
          timing(v.burst, 950, EASE_OUT, 480),
          timing(v.shine, 700, Easing.inOut(Easing.quad), 900),
          ...v.sparks.map((s, i) => timing(s, 450, OVERSHOOT, SPARKS[i].delay)),
          timing(v.out, 550, Easing.bezier(0.4, 0, 0.2, 1), 1600),
        ]);
        running.current.start(({ finished }) => finished && setDone(true));
      });
    return () => {
      stopped = true;
    };
  }, [done, v]);

  if (done) return null;
  const ink = t.colors.accent;
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.bg,
          opacity: v.out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ scale: v.out.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
        },
      ]}>
      {/* The glow swells, then settles a little. */}
      <Animated.Image
        source={GLOW}
        tintColor={ink}
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          opacity: v.glow.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.6, 0.42] }),
          transform: [{ scale: v.glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.15] }) }],
        }}
      />

      {/* A ring ripples out as the star lands. */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 1.5,
          borderColor: ink,
          opacity: v.ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.6, 0] }),
          transform: [{ scale: v.ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.6] }) }],
        }}
      />

      {/* Tiny sparkles burst outwards and fade. */}
      {BURST.map((b, i) => {
        const travel = v.burst.interpolate({ inputRange: [0, 1], outputRange: [0, b.distance] });
        return (
          <Animated.Image
            key={i}
            source={STAR}
            tintColor={ink}
            style={{
              position: 'absolute',
              width: b.size,
              height: b.size,
              opacity: v.burst.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 0.6, 0] }),
              transform: [
                { translateX: Animated.multiply(travel, Math.cos(b.angle)) },
                { translateY: Animated.multiply(travel, Math.sin(b.angle)) },
                { scale: v.burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 1.2, 0.5] }) },
              ],
            }}
          />
        );
      })}

      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        {/* The star spins in with a bounce, pulses once with a shine, and swells a touch as it all lifts. */}
        <Animated.View
          style={{
            transform: [
              { scale: v.star },
              { scale: v.shine.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] }) },
              { scale: v.out.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) },
              { rotate: v.star.interpolate({ inputRange: [0, 1], outputRange: ['-135deg', '0deg'] }) },
            ],
          }}>
          <Image source={STAR} tintColor={ink} style={{ width: SIZE * 0.92, height: SIZE * 0.92 }} />
          {/* The shine: a white copy of the star that flashes over it. */}
          <Animated.Image
            source={STAR}
            tintColor="#FFFFFF"
            style={{
              position: 'absolute',
              width: SIZE * 0.92,
              height: SIZE * 0.92,
              opacity: v.shine.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.55, 0] }),
            }}
          />
        </Animated.View>
        {SPARKS.map((s, i) => (
          <Animated.Image
            key={i}
            source={STAR}
            tintColor={ink}
            style={{
              position: 'absolute',
              left: s.x * SIZE - s.size / 2,
              top: s.y * SIZE - s.size / 2,
              width: s.size,
              height: s.size,
              transform: [
                { scale: v.sparks[i] },
                { rotate: v.sparks[i].interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) },
              ],
            }}
          />
        ))}
      </View>

      {/* A tap anywhere skips, as does the Skip in the corner. */}
      <Pressable onPress={skip} style={StyleSheet.absoluteFill} accessible={false} />
      <Pressable
        onPress={skip}
        hitSlop={16}
        accessibilityRole="button"
        accessibilityLabel="Skip"
        style={{ position: 'absolute', top: insets.top + 14, right: 20, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: t.colors.border }}>
        <Text style={{ color: t.colors.muted, fontFamily: t.fonts.body, fontSize: 14 }}>Skip</Text>
      </Pressable>
    </Animated.View>
  );
}
