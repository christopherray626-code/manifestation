import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { useTheme } from '@/components/ui';

const ROW = 72;

/** A scroll wheel of numbers, like a clock's: the middle one is chosen; neighbours fade above and below. */
export function Wheel({ count, value, onChange, label }: { count: number; value: number; onChange: (v: number) => void; label: string }) {
  const t = useTheme();
  const ref = useRef<ScrollView>(null);
  const [at, setAt] = useState(value);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Start on the current value.
    const id = setTimeout(() => ref.current?.scrollTo({ y: value * ROW, animated: false }), 0);
    return () => clearTimeout(id);
    // Only on first show.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.min(count - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ROW)));
    setAt(i);
    // When the scrolling stops, snap exactly onto the nearest number and report it.
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      ref.current?.scrollTo({ y: i * ROW, animated: true });
      onChange(i);
    }, 120);
  }

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Text style={{ color: t.colors.muted, fontFamily: t.fonts.body, fontSize: 14 }}>{label}</Text>
      <View style={{ height: ROW * 3, width: 110 }} accessible accessibilityLabel={`${label}: ${at}`}>
        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ROW}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: ROW }}>
          {Array.from({ length: count }, (_, i) => {
            const d = Math.abs(i - at);
            return (
              <View key={i} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
                <Text
                  style={{
                    fontFamily: t.fonts.display,
                    fontSize: d === 0 ? 54 : 44,
                    color: t.colors.text,
                    opacity: d === 0 ? 1 : d === 1 ? 0.18 : 0.06,
                    fontVariant: ['tabular-nums'],
                  }}>
                  {String(i).padStart(2, '0')}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
