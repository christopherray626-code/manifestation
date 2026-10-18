import { router } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Art } from '@/components/art';
import { categoryIcon } from '@/components/goal-bits';
import { Icon, Txt, useTheme } from '@/components/ui';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';
import { TRACKS } from '@/lib/tracks';

/** The slim bar above the tabs while something is loaded: tap to open the player, or play/pause here. */
export function MiniPlayer() {
  const t = useTheme();
  const { goals, settings } = useStore();
  const { goal, track, tape, prep, toggle } = usePlayer();
  // Only once you've played something, so a new user isn't shown a player they never started.
  if (!settings.lastPlayed || (!goal && !track)) return null;
  const title = track?.title ?? goal!.title;
  const index = track ? TRACKS.indexOf(track) : goals.findIndex((g) => g.id === goal!.id);
  const current = tape.playing && tape.mode === 'spoken' ? undefined : track ? 'Ready-made track' : 'Your goal';

  return (
    <Pressable
      onPress={() => router.push('/player')}
      accessibilityRole="button"
      accessibilityLabel={`Now playing: ${title}. Open player`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 64,
        paddingHorizontal: 12,
        marginHorizontal: 8,
        marginBottom: 6,
        borderRadius: 16,
        backgroundColor: t.colors.card,
        borderWidth: 1,
        borderColor: t.colors.border,
      }}>
      <Art icon={track ? track.icon : categoryIcon(goal!.category)} index={Math.max(index, 0)} size={44} />
      <View style={{ flex: 1 }}>
        <Txt variant="medium" numberOfLines={1}>
          {title}
        </Txt>
        <Txt variant="muted" numberOfLines={1}>
          {prep ? `Getting the voice ready… ${prep.done} of ${prep.total}` : (current ?? 'Playing')}
        </Txt>
      </View>
      <Pressable
        onPress={toggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={tape.playing ? 'Pause' : 'Play'}
        style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
        {prep ? (
          <ActivityIndicator color={t.colors.accent} />
        ) : (
          <Icon name={tape.playing ? 'pause' : 'play'} size={26} color={t.colors.text} />
        )}
      </Pressable>
    </Pressable>
  );
}
