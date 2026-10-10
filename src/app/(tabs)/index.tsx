import { router } from 'expo-router';
import { View } from 'react-native';

import { GoalRow } from '@/components/goal-bits';
import { Button, Card, Icon, Orb, QuoteBlock, Screen, Txt, useTheme } from '@/components/ui';
import { moonPhase } from '@/lib/moon';
import { useStore } from '@/lib/store';
import { dayOfGoal, todaysAffirmation } from '@/lib/today';

function greeting(name: string, suffix?: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const who = name.trim() || suffix;
  return who ? `${part}, ${who}` : part;
}

function Tagline() {
  const t = useTheme();
  const { goals } = useStore();
  if (t.tagline === 'moon') {
    const moon = moonPhase();
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name="moon-outline" size={13} color={t.colors.accent} />
        <Txt variant="muted" style={{ color: t.colors.accent, fontSize: 12 }}>
          {moon.name}
        </Txt>
      </View>
    );
  }
  if (t.tagline === 'streak' && goals.length) {
    const days = Math.max(...goals.map((g) => dayOfGoal(g)));
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name="flame-outline" size={14} color={t.colors.accent} />
        <Txt variant="muted" style={{ color: t.colors.accent, fontSize: 12 }}>
          Day {days}
        </Txt>
      </View>
    );
  }
  return null;
}

export default function HomeScreen() {
  const t = useTheme();
  const { goals, settings } = useStore();
  const first = goals[0];
  const today = first ? todaysAffirmation(first) : undefined;
  const moon = t.tagline === 'moon' ? moonPhase() : undefined;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt variant="muted">{greeting(settings.name, t.greetingSuffix)}</Txt>
        <Tagline />
      </View>
      {moon && (
        <Txt variant="quote" style={{ fontSize: 15, lineHeight: 20, color: t.colors.muted }}>
          {moon.hint}
        </Txt>
      )}

      {t.decor === 'orb' && <Orb />}

      <Txt variant="display">Your goals</Txt>

      {goals.length === 0 ? (
        <Card>
          <View style={{ gap: 6 }}>
            <Txt variant="title">Start your first goal</Txt>
            <Txt variant="muted">
              {"Describe exactly what you want, and you'll get affirmations written around it. Or write your own."}
            </Txt>
          </View>
        </Card>
      ) : (
        goals.map((g, i) => (
          <GoalRow key={g.id} goal={g} index={i} onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })} />
        ))
      )}

      {today && <QuoteBlock label="Today's affirmation" text={today.text} />}

      <Button
        title="New goal"
        icon="add"
        kind={goals.length ? 'ghost' : 'primary'}
        onPress={() => router.push('/goal/new')}
      />
    </Screen>
  );
}
