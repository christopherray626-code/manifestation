import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { GoalRow } from '@/components/goal-bits';
import { Button, Card, Icon, Screen, Section, Txt, useTheme } from '@/components/ui';
import { parseMix, partTitles } from '@/lib/mix';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';

/** Your own goals: each one's affirmations, written for you or by you, and your recordings. */
export default function CreateScreen() {
  const t = useTheme();
  const { goals, mixes } = useStore();
  const { open } = usePlayer();
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Txt variant="display">My manifestations</Txt>
        <Txt variant="muted">Each one has its own affirmations and tape.</Txt>
      </View>

      {goals.length === 0 ? (
        <Card>
          <View style={{ gap: 6 }}>
            <Txt variant="title">Start your first manifestation</Txt>
            <Txt variant="muted">
              {"Describe what you’re manifesting, and you’ll get affirmations written around it. Or write your own."}
            </Txt>
          </View>
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

      {goals.length > 0 && <Button title="Make a mix" icon="layers-outline" kind="ghost" onPress={() => router.push('/mix')} />}

      <Card onPress={() => router.push('/journal')}>
        <View style={{ gap: 4 }}>
          <Txt variant="medium">Journal</Txt>
          <Txt variant="muted">Script your days as if they already happened, and log the signs as they show up.</Txt>
        </View>
      </Card>
    </Screen>
  );
}
