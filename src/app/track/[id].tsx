import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Art } from '@/components/art';
import { BackHeader, Button, Card, Screen, Txt, useTheme } from '@/components/ui';
import { Why } from '@/components/why';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';
import { WHY } from '@/lib/tips';
import { trackById, TRACKS, type Track } from '@/lib/tracks';
import { makeAffirmation, newId, type Category, type Goal, type Settings } from '@/lib/types';

// Which goal category a track's copy lands in when you make it your own.
const CATEGORY_OF: Record<string, Category> = {
  'money-magnet': 'money',
  wealth: 'money',
  love: 'love',
  'self-love': 'love',
  health: 'health',
  career: 'career',
};

/** Copies a track into a goal of your own, where you can edit, remove and add affirmations. */
function goalFromTrack(track: Track, rotation: Settings['defaultRotation']): Goal {
  const now = Date.now();
  return {
    id: newId(),
    title: track.title,
    category: CATEGORY_OF[track.id] ?? 'other',
    details: '',
    feeling: '',
    voice: 'calm-female',
    createdAt: now,
    affirmations: track.lines.map((text) => makeAffirmation(text, false)),
    rotation: { ...rotation, anchor: now },
  };
}

/** A ready-made track before you play it: every affirmation in it, and a way to make it your own. */
export default function TrackScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addGoal, settings } = useStore();
  const { open } = usePlayer();
  const track = trackById(id);

  if (!track) {
    return (
      <Screen>
        <BackHeader title="" onBack={() => router.back()} />
        <Txt variant="muted">{"That track isn't here any more."}</Txt>
      </Screen>
    );
  }

  function makeItMine() {
    const goal = goalFromTrack(track!, settings.defaultRotation);
    addGoal(goal);
    router.replace({ pathname: '/goal/[id]', params: { id: goal.id } });
  }

  return (
    <Screen>
      <BackHeader title="" onBack={() => router.back()} />
      <View style={{ alignItems: 'center', gap: 14 }}>
        <Art icon={track.icon} index={TRACKS.indexOf(track)} size={180} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Txt variant="display" style={{ textAlign: 'center' }}>
            {track.title}
          </Txt>
          <Txt variant="muted">{`${track.about} · ${track.lines.length} affirmations`}</Txt>
        </View>
      </View>

      <Button title="Play" icon="play" onPress={() => open({ kind: 'track', id: track.id })} />

      <Card>
        <View style={{ gap: 12 }}>
          {track.lines.map((line, i) => (
            <View key={line} style={{ flexDirection: 'row', gap: 12 }}>
              <Txt variant="muted" style={{ width: 20, textAlign: 'right' }}>
                {i + 1}
              </Txt>
              <Txt variant="body" style={{ flex: 1 }}>
                {line}
              </Txt>
            </View>
          ))}
        </View>
      </Card>

      <Why text={WHY.youAndWhy} label="Why it’s written this way" />

      <View style={{ gap: 8 }}>
        <Button title="Make it mine" icon="add" kind="ghost" onPress={makeItMine} />
        <Txt variant="muted" style={{ textAlign: 'center', color: t.colors.muted }}>
          Copies this track into your manifestations, so you can add your own affirmations, edit or remove any, and record them in
          your voice.
        </Txt>
      </View>
    </Screen>
  );
}
