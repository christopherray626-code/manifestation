import { useRef, useState } from "react";
import { View, type GestureResponderEvent } from "react-native";

import { useTheme } from "@/components/ui";

/**
 * A simple drag-or-tap slider from 0 to 1. Changes stream out while dragging so you hear the mix move,
 * and screen readers can step it up and down by 10%.
 */
export function Slider({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const t = useTheme();
  const track = useRef<View>(null);
  const left = useRef(0);
  const width = useRef(1);
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = dragging ?? value;

  const at = (e: GestureResponderEvent) =>
    Math.min(
      1,
      Math.max(0, (e.nativeEvent.pageX - left.current) / width.current),
    );
  const grant = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.pageX;
    track.current?.measureInWindow((px, _py, w) => {
      left.current = px;
      width.current = Math.max(w, 1);
      const v = Math.min(1, Math.max(0, (x - px) / width.current));
      setDragging(v);
      onChange(v);
    });
  };
  const move = (e: GestureResponderEvent) => {
    const v = at(e);
    setDragging(v);
    onChange(v);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) =>
        onChange(
          Math.min(
            1,
            Math.max(
              0,
              value + (e.nativeEvent.actionName === "increment" ? 0.1 : -0.1),
            ),
          ),
        )
      }
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={grant}
      onResponderMove={move}
      onResponderRelease={() => setDragging(null)}
      onResponderTerminate={() => setDragging(null)}
      // Inset by half the knob, so the knob stays inside at 0 and 100.
      style={{
        height: 44,
        justifyContent: "center",
        flex: 1,
        paddingHorizontal: 12,
      }}
    >
      <View
        ref={track}
        style={{ height: 6, borderRadius: 3, backgroundColor: t.colors.border }}
      >
        <View
          style={{
            width: `${shown * 100}%`,
            height: 6,
            borderRadius: 3,
            backgroundColor: t.colors.accent,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: `${shown * 100}%`,
            marginLeft: -12,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: t.colors.text,
            borderWidth: 3,
            borderColor: t.colors.accent,
            top: -9,
          }}
        />
      </View>
    </View>
  );
}
