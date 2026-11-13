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
