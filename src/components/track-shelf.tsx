import { Pressable, ScrollView, View } from 'react-native';

import { Icon, Txt, useTheme } from '@/components/ui';
import { TRACKS, type Track } from '@/lib/tracks';

/** A sideways row of the ready-made tracks. */
export function TrackShelf({ selectedId, onPick }: { selectedId?: string; onPick: (track: Track) => void }) {
  const t = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Run edge to edge past the screen padding, so the row clearly scrolls.
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
      {TRACKS.map((track, i) => {
        const on = track.id === selectedId;
        const tint = t.colors.tints[i % t.colors.tints.length];
        return (
          <Pressable
            key={track.id}
            onPress={() => onPick(track)}
            accessibilityRole="button"
            accessibilityLabel={`${track.title} track`}
            style={({ pressed }) => ({ width: 128, gap: 8, opacity: pressed ? 0.75 : 1 })}>
            <View
              style={{
                width: 128,
                height: 128,
                borderRadius: t.radius,
                backgroundColor: t.colors.card,
                borderWidth: on ? 2 : 1,
                borderColor: on ? t.colors.accent : t.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: tint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name={track.icon} size={30} color={t.colors.accent} />
              </View>
            </View>
            <View>
              <Txt variant="medium" numberOfLines={1}>
                {track.title}
              </Txt>
              <Txt variant="muted" style={{ fontSize: 12.5 }} numberOfLines={1}>
                {track.about}
              </Txt>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
