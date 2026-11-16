import { useEffect, useRef, useState } from 'react';
import { Animated, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { useTheme } from '@/components/ui';

const KNOB = 22;
const HEIGHT = 40;

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * A simple drag-or-tap slider from 0 to 1. Changes stream out while dragging so you hear the mix move,
 * and screen readers can step it up and down by 10%. The knob is placed in pixels inside its own
 * 40pt-tall lane, so it never spills onto the label above or past either end.
 *
 * With `onLive`, the level streams to it while dragging (cheap: it should only move the sound), and
 * `onChange` gets the final level once, on release. Without it, `onChange` streams instead.
 *
 * The knob and the filled part are moved directly (an Animated value), not by re-drawing the slider
 * for every movement of your finger, which is what keeps it smooth on a phone.
 */
export function Slider({
  value,
  onChange,
  onLive,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  onLive?: (v: number) => void;
  label: string;
}) {
  const t = useTheme();
  const lane = useRef<View>(null);
  const left = useRef(0);
  const [width, setWidth] = useState(0);
  const dragging = useRef(false);
  const [pos] = useState(() => new Animated.Value(clamp(value)));
  // The centre of the knob travels from half a knob in from the left to half a knob in from the right.
  const travel = Math.max(width - KNOB, 1);

  // Follow the saved level, except while a finger is on it.
  useEffect(() => {
    if (!dragging.current) pos.setValue(clamp(value));
  }, [value, pos]);

  // While dragging, the knob follows your finger every frame, but the new level goes out at most every
  // 40ms to `onLive` (or 80ms to `onChange`, which re-saves settings and is too slow to do per frame),
  // and once more on release.
  const sent = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(value);
  const stream = onLive ?? onChange;
  const send = (v: number, now = false) => {
    latest.current = v;
    if (pending.current) return;
    const wait = now ? 0 : Math.max(0, (onLive ? 40 : 80) - (Date.now() - sent.current));
    pending.current = setTimeout(() => {
      pending.current = null;
      sent.current = Date.now();
      stream(latest.current);
    }, wait);
  };
  const release = () => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = null;
    if (dragging.current) {
      onLive?.(latest.current);
      onChange(latest.current);
    }
    dragging.current = false;
  };

  const valueAt = (pageX: number) => clamp((pageX - left.current - KNOB / 2) / travel);
  const grant = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.pageX;
    dragging.current = true;
    lane.current?.measureInWindow((px) => {
      left.current = px;
      const v = valueAt(x);
      pos.setValue(v);
      send(v, true);
    });
  };
  const move = (e: GestureResponderEvent) => {
    const v = valueAt(e.nativeEvent.pageX);
    pos.setValue(v);
    send(v);
  };

  return (
    <View
      ref={lane}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp(value) * 100) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(clamp(value + (e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1)))}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={grant}
      onResponderMove={move}
      onResponderRelease={release}
      onResponderTerminate={release}
      style={{ height: HEIGHT, justifyContent: 'center' }}>
      {/* Track, inset so its ends line up with the knob's centre at 0 and 100. The filled part is a
          full-length bar slid in from the left, so it can move without being re-laid-out. */}
      <View style={{ marginHorizontal: KNOB / 2, height: 6, borderRadius: 3, backgroundColor: t.colors.border, overflow: 'hidden' }}>
        <Animated.View
          style={{
            width: travel,
            height: 6,
            borderRadius: 3,
            backgroundColor: t.colors.accent,
            transform: [{ translateX: pos.interpolate({ inputRange: [0, 1], outputRange: [-travel, 0] }) }],
          }}
        />
      </View>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: (HEIGHT - KNOB) / 2,
          left: 0,
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          backgroundColor: t.colors.text,
          borderWidth: 3,
          borderColor: t.colors.accent,
          transform: [{ translateX: pos.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) }],
        }}
      />
    </View>
  );
}
