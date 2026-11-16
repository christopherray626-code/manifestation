import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { GoalRow } from '@/components/goal-bits';
import { TrackGrid } from '@/components/track-grid';
import { Button, Card, Icon, Screen, Section, Txt, useTheme } from '@/components/ui';
import { parseMix, partTitles } from '@/lib/mix';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';

/** Everything to listen to: your own manifestations and mixes first, then every ready-made track. */
export default function CreateScreen() {
  const t = useTheme();
  const { goals, mixes } = useStore();
  const { open } = usePlayer();
  return (
    <Screen>
      <Txt variant="display">My manifestations</Txt>

      {goals.length === 0 ? (
        <Card>
          <Txt variant="title">Start your first manifestation</Txt>
        </Card>
      ) : (
        goals.map((g, i) => (
          <GoalRow key={g.id} goal={g} index={i} onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })} />
        ))
      )}

      <Button title="New manifestation" icon="add" onPress={() => router.push('/goal/new')} />
      {mixes.length > 0 && (
        <Section label="My mixes">
          <View style={{ gap: 10 }}>
            {mixes.map((m) => (
              <Card key={m.id} onPress={() => router.push({ pathname: '/mix', params: { edit: m.id } })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Icon name="layers-outline" size={22} color={t.colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="medium" numberOfLines={1}>
                      {m.name}
                    </Txt>
                    <Txt variant="muted" numberOfLines={1}>
                      {partTitles(parseMix(m.parts), goals).join(' · ')}
                    </Txt>
                  </View>
                  <Pressable
                    onPress={() => open({ kind: 'mix', id: m.parts })}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`Play ${m.name}`}>
                    <Icon name="play-circle" size={36} color={t.colors.accent} />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        </Section>
      )}

      <Button title="Make a mix" icon="layers-outline" kind="ghost" onPress={() => router.push('/mix')} />

      <Card onPress={() => router.push('/journal')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="create-outline" size={20} color={t.colors.accent} />
          <Txt variant="medium" style={{ flex: 1 }}>
            Journal
          </Txt>
          <Icon name="chevron-forward" size={18} color={t.colors.muted} />
        </View>
      </Card>

      <Txt variant="display" style={{ fontSize: 22, lineHeight: 28, marginTop: 8 }}>
        Ready-made tracks
      </Txt>
      <TrackGrid />
    </Screen>
  );
}
