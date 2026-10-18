import { useRef, useState } from 'react';
import { View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { useTheme } from '@/components/ui';

const KNOB = 22;
const HEIGHT = 40;

/**
 * A simple drag-or-tap slider from 0 to 1. Changes stream out while dragging so you hear the mix move,
 * and screen readers can step it up and down by 10%. The knob is placed in pixels inside its own
 * 40pt-tall lane, so it never spills onto the label above or past either end.
 */
export function Slider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const t = useTheme();
  const lane = useRef<View>(null);
  const left = useRef(0);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = Math.min(1, Math.max(0, dragging ?? value));
  // The knob's centre travels from half a knob in from the left to half a knob in from the right.
  const travel = Math.max(width - KNOB, 1);

  const valueAt = (pageX: number) => Math.min(1, Math.max(0, (pageX - left.current - KNOB / 2) / travel));
  const grant = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.pageX;
    lane.current?.measureInWindow((px) => {
      left.current = px;
      const v = valueAt(x);
      setDragging(v);
      onChange(v);
    });
  };
  const move = (e: GestureResponderEvent) => {
    const v = valueAt(e.nativeEvent.pageX);
    setDragging(v);
    onChange(v);
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
      onResponderRelease={() => setDragging(null)}
      onResponderTerminate={() => setDragging(null)}
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
