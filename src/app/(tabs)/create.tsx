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
        <Txt variant="display">Your manifestations</Txt>
        <Txt variant="muted">Each one gets its own affirmations and its own tape.</Txt>
      </View>

      {goals.length === 0 ? (
        <Card>
          <View style={{ gap: 6 }}>
            <Txt variant="title">Start your first manifestation</Txt>
            <Txt variant="muted">
              {"Describe what you're calling in, and you'll get affirmations written around it. Or write your own."}
            </Txt>
          </View>
        </Card>
      ) : (
        goals.map((g, i) => (
          <GoalRow key={g.id} goal={g} index={i} onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })} />
        ))
      )}

      <Button title="New manifestation" icon="add" onPress={() => router.push('/goal/new')} />
    </Screen>
  );
}
