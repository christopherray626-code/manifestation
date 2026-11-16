import { useRef, useState } from 'react';
import { View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { useTheme } from '@/components/ui';

const KNOB = 22;
const HEIGHT = 40;

/**
 * A simple drag-or-tap slider from 0 to 1. Changes stream out while dragging so you hear the mix move,
 * and screen readers can step it up and down by 10%. The knob is placed in pixels inside its own
 * 40pt-tall lane, so it never spills onto the label above or past either end.
 *
 * With `onLive`, the level streams to it while dragging (cheap: it should only move the sound), and
 * `onChange` gets the final level once, on release. Without it, `onChange` streams instead.
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
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = Math.min(1, Math.max(0, dragging ?? value));
  // The knob's centre travels from half a knob in from the left to half a knob in from the right.
  const travel = Math.max(width - KNOB, 1);

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
    if (dragging !== null) {
      onLive?.(latest.current);
      onChange(latest.current);
    }
    setDragging(null);
  };

  const valueAt = (pageX: number) => Math.min(1, Math.max(0, (pageX - left.current - KNOB / 2) / travel));
  const grant = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.pageX;
    lane.current?.measureInWindow((px) => {
      left.current = px;
      const v = valueAt(x);
      setDragging(v);
      send(v, true);
    });
  };
  const move = (e: GestureResponderEvent) => {
    const v = valueAt(e.nativeEvent.pageX);
    setDragging(v);
    send(v);
  };

  return (
    <View
      ref={lane}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.min(1, Math.max(0, value + (e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1))))}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={grant}
      onResponderMove={move}
      onResponderRelease={release}
      onResponderTerminate={release}
      style={{ height: HEIGHT, justifyContent: 'center' }}>
      {/* Track, inset so its ends line up with the knob's centre at 0 and 100. */}
      <View style={{ marginHorizontal: KNOB / 2, height: 6, borderRadius: 3, backgroundColor: t.colors.border }}>
        <View style={{ width: shown * travel, height: 6, borderRadius: 3, backgroundColor: t.colors.accent }} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: (HEIGHT - KNOB) / 2,
          left: shown * travel,
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          backgroundColor: t.colors.text,
          borderWidth: 3,
          borderColor: t.colors.accent,
        }}
      />
    </View>
  );
}
