import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, useTheme } from '@/components/ui';
import { usePhotoUris } from '@/lib/photos';
import { useStore } from '@/lib/store';
import { todaysAffirmation } from '@/lib/today';

const SHOW_MS = 7000;
const FADE_MS = 1200;

/**
 * The vision board as a slideshow: each photo fades in and drifts slowly closer, with its caption or
 * today's affirmation from the manifestation it goes with. Tap the left or right side to go back or on.
 */
export default function Slideshow() {
  const t = useTheme();
  const { board, goals } = useStore();
  const uris = usePhotoUris(board.map((p) => p.file));
  const [at, setAt] = useState(0);
  const [still, setStill] = useState(false);
  const [fade] = useState(() => new Animated.Value(0));
  const [zoom] = useState(() => new Animated.Value(1));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);

  useEffect(() => {
    if (!board.length) return;
    fade.setValue(0);
    zoom.setValue(1);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: FADE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(zoom, { toValue: still ? 1 : 1.08, duration: SHOW_MS, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
    const next = setTimeout(() => setAt((i) => (i + 1) % board.length), SHOW_MS);
    return () => clearTimeout(next);
  }, [at, board.length, still, fade, zoom]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/board'));
  const photo = board[at % Math.max(board.length, 1)];
  if (!photo) return <Redirect href="/board" />;
  const goal = goals.find((g) => g.id === photo.goalId);
  const line = photo.caption || (goal && todaysAffirmation(goal)?.text) || goal?.title || '';
  const go = (by: number) => setAt((i) => (i + by + board.length) % board.length);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, transform: [{ scale: zoom }] }]}>
        {uris[photo.file] && <Image source={{ uri: uris[photo.file] }} style={{ flex: 1 }} contentFit="cover" />}
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.18)' }]} />

      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
        <Pressable style={{ flex: 1 }} onPress={() => go(-1)} accessibilityLabel="Previous photo" />
        <Pressable style={{ flex: 1 }} onPress={() => go(1)} accessibilityLabel="Next photo" />
      </View>

      <SafeAreaView style={{ flex: 1 }} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', gap: 4, padding: 12 }} pointerEvents="none">
          {board.map((p, i) => (
            <View key={p.id} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i === at ? '#fff' : 'rgba(255,255,255,0.35)' }} />
          ))}
        </View>
        <Pressable
          onPress={close}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close slideshow"
          style={{ alignSelf: 'flex-end', marginRight: 16, padding: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <Icon name="close" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }} pointerEvents="none" />
        {!!line && (
          <Animated.View style={{ opacity: fade, padding: 28, paddingBottom: 48 }} pointerEvents="none">
            <Text
              style={{
                color: '#fff',
                fontFamily: t.fonts.display,
                fontSize: 26,
                lineHeight: 34,
                textAlign: 'center',
                textShadowColor: 'rgba(0,0,0,0.6)',
                textShadowRadius: 12,
              }}>
              {line}
            </Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}
