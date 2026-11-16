import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Art } from '@/components/art';
import { useEnhance } from '@/components/enhance';
import { BackHeader, Button, Card, Chip, ChipRow, Icon, Screen, Txt, useTheme, WithInfo } from '@/components/ui';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';
import { WHY } from '@/lib/tips';
import { comboId, isClosing, originalTrack, trackById, TRACKS, type Track } from '@/lib/tracks';
import { DEFAULT_VOICE, makeAffirmation, newId, type Category, type Goal, type Settings } from '@/lib/types';

// Which goal category a track's copy lands in when you make it your own.
const CATEGORY_OF: Record<string, Category> = {
  'money-magnet': 'money',
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
    category: CATEGORY_OF[(track.parts?.[0] ?? track).id] ?? 'other',
    details: '',
    feeling: '',
    voice: DEFAULT_VOICE,
    createdAt: now,
    affirmations: track.lines.map((text) => makeAffirmation(text, false)),
    rotation: { ...rotation, anchor: now },
  };
}

/** A ready-made track before you play it: every affirmation in it, and a way to make it your own. */
export default function TrackScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addGoal, settings, updateSettings } = useStore();
  const { open } = usePlayer();
  const base = trackById(id);
  // Other tracks to play along with this one, back to back.
  const [added, setAdded] = useState<string[]>([]);
  const baseIds = base?.parts?.map((p) => p.id) ?? (base ? [base.id] : []);
  const track = trackById(comboId([...baseIds, ...added]));
  // Developer mode, single tracks only: enhance the whole track or one line, then pick what to keep.
  const dev = !!settings.devMode && !!base && !base.parts;
  const [enhancing, setEnhancing] = useState<number[]>([]);
  const [devNote, setDevNote] = useState('');
  const enhance = useEnhance({ title: base ? base.title : '' }, (next) => {
    if (!base) return;
    const lines = [...base.lines];
    enhancing.forEach((at, i) => (lines[at] = next[i]));
    updateSettings({ trackEdits: { ...settings.trackEdits, [base.id]: { title: base.title, lines } } });
    setDevNote('Saved on this phone. Copy your rewrites from Settings when you’re happy.');
  });
  function enhanceLines(at: number[]) {
    if (!base) return;
    const keep = at.filter((i) => !isClosing(base.lines[i]));
    setEnhancing(keep);
    setDevNote('');
    enhance.start(keep.map((i) => base.lines[i]));
  }
  function backToOriginal() {
    if (!base) return;
    const edits = { ...settings.trackEdits };
    delete edits[base.id];
    updateSettings({ trackEdits: edits });
    setDevNote('Back to the original wording.');
  }
  const toggle = (other: string) => setAdded((now) => (now.includes(other) ? now.filter((x) => x !== other) : [...now, other]));

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
        <Art icon={track.icon} index={TRACKS.indexOf(track.parts?.[0] ?? track)} tone={(track.parts?.[0] ?? track).id} size={180} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Txt variant="display" style={{ textAlign: 'center' }}>
            {track.title}
          </Txt>
          <Txt variant="muted">{`${track.about} · ${track.lines.length} affirmations`}</Txt>
        </View>
      </View>

      <Button title="Play" icon="play" onPress={() => open({ kind: 'track', id: track.id })} />

      <View style={{ gap: 8 }}>
        <Txt variant="title">Combine with</Txt>
        <ChipRow>
          {TRACKS.filter((other) => !baseIds.includes(other.id)).map((other) => (
            <Chip key={other.id} label={other.title} selected={added.includes(other.id)} onPress={() => toggle(other.id)} />
          ))}
        </ChipRow>
      </View>

      {dev && (
        <Card>
          <View style={{ gap: 10 }}>
            <Txt variant="label">Developer</Txt>
            <Button
              title={enhance.busy && enhancing.length > 1 ? 'Enhancing…' : 'Enhance this track'}
              icon="sparkles-outline"
              onPress={() => enhanceLines(track.lines.map((_, i) => i))}
            />
            <Txt variant="muted">Or tap the sparkle on one line. You see before and after, and keep only what you like.</Txt>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button title="Edit by hand" icon="create-outline" kind="ghost" onPress={() => router.push(`/dev/${track.id}`)} />
              </View>
              {!!settings.trackEdits?.[track.id] && (
                <View style={{ flex: 1 }}>
                  <Button title="Original" icon="refresh" kind="ghost" onPress={backToOriginal} />
                </View>
              )}
            </View>
            {!!enhance.error && <Txt variant="muted">{enhance.error}</Txt>}
            {!!devNote && <Txt variant="muted">{devNote}</Txt>}
            {!!settings.trackEdits?.[track.id] && (
              <Txt variant="muted">{`Rewritten. The original had ${originalTrack(track.id)?.lines.length ?? 0} lines.`}</Txt>
            )}
          </View>
          {enhance.sheet}
        </Card>
      )}

      <Card>
        <View style={{ gap: 12 }}>
          {track.lines.map((line, i) => (
            <View key={`${i}-${line}`} style={{ flexDirection: 'row', gap: 12 }}>
              <Txt variant="muted" style={{ width: 20, textAlign: 'right' }}>
                {i + 1}
              </Txt>
              <Txt variant="body" style={{ flex: 1 }}>
                {line}
              </Txt>
              {dev && !isClosing(line) && (
                <Pressable onPress={() => enhanceLines([i])} hitSlop={8} accessibilityLabel={`Enhance line ${i + 1}`}>
                  <Icon
                    name={enhance.busy && enhancing.length === 1 && enhancing[0] === i ? 'hourglass-outline' : 'sparkles-outline'}
                    size={18}
                    color={t.colors.muted}
                  />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </Card>

      <WithInfo
        info={`Copies this track into your manifestations, so you can add your own affirmations, edit or remove any, and record them in your voice.\n\n${WHY.youAndWhy}`}
        about="making it yours">
        <Button title="Make it mine" icon="add" kind="ghost" onPress={makeItMine} />
      </WithInfo>
    </Screen>
  );
}
