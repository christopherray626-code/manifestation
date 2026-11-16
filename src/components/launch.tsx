import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/components/ui';

/*
 * The launch animation in the phone app, matching the one the web page draws (public/index.html):
 * a glow swells, a star turns in, three sparks pop, then it all lifts away. It sits over the app as it
 * first appears, in the saved theme's colours, and goes quiet for people who turn on Reduce motion.
 */

const OVERSHOOT = Easing.bezier(0.34, 1.56, 0.64, 1);
const SIZE = 96;
// Where the three sparks sit on the 96pt star, from the web version's drawing (centre and size).
const SPARKS = [
  { x: 0.86, y: 0.2, size: 20, delay: 550 },
  { x: 0.14, y: 0.79, size: 14, delay: 700 },
  { x: 0.84, y: 0.82, size: 9, delay: 850 },
];

export function Launch() {
  const t = useTheme();
  const [done, setDone] = useState(Platform.OS === 'web'); // the web page draws its own
  const [v] = useState(() => ({
    glow: new Animated.Value(0),
    star: new Animated.Value(0),
    sparks: SPARKS.map(() => new Animated.Value(0)),
    out: new Animated.Value(0),
  }));

  useEffect(() => {
    if (done) return;
    let stopped = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((still) => {
        if (stopped) return;
        const lift = Animated.timing(v.out, {
          toValue: 1,
          duration: still ? 300 : 500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        });
        if (still) {
          [v.glow, v.star, ...v.sparks].forEach((a) => a.setValue(1));
          Animated.sequence([Animated.delay(600), lift]).start(() => setDone(true));
          return;
        }
        Animated.parallel([
          Animated.timing(v.glow, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(150),
            Animated.timing(v.star, { toValue: 1, duration: 900, easing: OVERSHOOT, useNativeDriver: true }),
          ]),
          ...v.sparks.map((s, i) =>
            Animated.sequence([
              Animated.delay(SPARKS[i].delay),
              Animated.timing(s, { toValue: 1, duration: 500, easing: OVERSHOOT, useNativeDriver: true }),
            ]),
          ),
          Animated.sequence([Animated.delay(1350), lift]),
        ]).start(() => setDone(true));
      });
    return () => {
      stopped = true;
    };
  }, [done, v]);

  if (done) return null;
  const ink = t.colors.accent;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.bg,
          opacity: v.out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ scale: v.out.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
        },
      ]}>
      {/* The glow: soft rings fading outwards, standing in for the web's radial gradient. */}
      <Animated.View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: v.glow.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.45, 0.3] }),
          transform: [{ scale: v.glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.15] }) }],
        }}>
        {[220, 170, 120, 80].map((d, i) => (
          <View key={d} style={{ position: 'absolute', width: d, height: d, borderRadius: d / 2, backgroundColor: ink, opacity: 0.12 + i * 0.08 }} />
        ))}
      </Animated.View>
      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            transform: [
              { scale: v.star },
              { rotate: v.star.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) },
            ],
          }}>
          <Star size={SIZE * 0.92} color={ink} />
        </Animated.View>
        {SPARKS.map((s, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: s.x * SIZE - s.size / 2,
              top: s.y * SIZE - s.size / 2,
              transform: [{ scale: v.sparks[i] }],
            }}>
            <Star size={s.size} color={ink} />
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

/** A four-pointed star, drawn with the ✦ character so it needs nothing extra installed. */
function Star({ size, color }: { size: number; color: string }) {
  return (
    <Text
      allowFontScaling={false}
      style={{ fontSize: size * 1.25, lineHeight: size * 1.3, height: size * 1.3, color, textAlign: 'center', includeFontPadding: false }}>
      ✦
    </Text>
  );
}
