import { router } from 'expo-router';
import { View } from 'react-native';

import { GoalRow } from '@/components/goal-bits';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { useStore } from '@/lib/store';

/** Your own goals: each one's affirmations, written for you or by you, and your recordings. */
export default function CreateScreen() {
  const { goals } = useStore();
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Txt variant="display">Already yours</Txt>
        <Txt variant="muted">Everything you’ve claimed, each with its own affirmations and tape.</Txt>
      </View>

      {goals.length === 0 ? (
        <Card>
          <View style={{ gap: 6 }}>
            <Txt variant="title">Claim your first one</Txt>
            <Txt variant="muted">
              {"Describe what’s already yours, and you’ll get affirmations written around it. Or write your own."}
            </Txt>
          </View>
        </Card>
      ) : (
        goals.map((g, i) => (
          <GoalRow key={g.id} goal={g} index={i} onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })} />
        ))
      )}

      <Button title="Claim something new" icon="add" onPress={() => router.push('/goal/new')} />

      <Card onPress={() => router.push('/journal')}>
        <View style={{ gap: 4 }}>
          <Txt variant="medium">Journal</Txt>
          <Txt variant="muted">Script your days as if they already happened, and log the signs as they show up.</Txt>
        </View>
      </Card>
    </Screen>
  );
}
