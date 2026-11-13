import { router } from 'expo-router';
import { View } from 'react-native';

import { TodayProgress, WeekDots } from '@/components/streak';
import { BackHeader, Card, Chip, ChipRow, Icon, Screen, Section, Txt, useTheme } from '@/components/ui';
import { useStore } from '@/lib/store';
import { bestStreak, DEFAULT_GOAL_MIN, GOAL_CHOICES, MILESTONES, nextMilestone, streakOf } from '@/lib/streak';

/** The streak page: how many days in a row, this week, today's goal, milestones, and the daily goal. */
export default function StreakScreen() {
  const t = useTheme();
  const { settings, updateSettings } = useStore();
  const streak = streakOf(settings.listenDays);
  const best = Math.max(bestStreak(settings.listenDays), streak);
  const next = nextMilestone(streak);
  const goalMin = settings.dailyGoalMin ?? DEFAULT_GOAL_MIN;

  return (
    <Screen>
      <BackHeader title="Your streak" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />

      <View style={{ alignItems: 'center', gap: 6 }}>
        <Icon name="flame" size={84} color={streak ? t.colors.accent : t.colors.muted} />
        <Txt variant="display" style={{ fontSize: 44, lineHeight: 50 }}>
          {streak}
        </Txt>
        <Txt variant="muted">{streak === 1 ? 'day in a row' : 'days in a row'}</Txt>
        <Txt variant="muted">{`Best: ${best} ${best === 1 ? 'day' : 'days'}`}</Txt>
      </View>

      <Card>
        <View style={{ gap: 16 }}>
          <Txt variant="label">This week</Txt>
          <WeekDots />
          <TodayProgress />
        </View>
      </Card>

      <Section label="Milestones">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {MILESTONES.map((m) => {
            const reached = best >= m;
            return (
              <View
                key={m}
                style={{
                  width: '22%',
                  aspectRatio: 1,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: reached ? t.colors.accent : t.colors.border,
                  backgroundColor: reached ? t.colors.card : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  opacity: reached ? 1 : 0.55,
                }}>
                <Icon name={reached ? 'flame' : 'flame-outline'} size={22} color={reached ? t.colors.accent : t.colors.muted} />
                <Txt variant="medium">{m}</Txt>
              </View>
            );
          })}
        </View>
        {next && <Txt variant="muted">{`${next - streak} more ${next - streak === 1 ? 'day' : 'days'} to reach ${next}.`}</Txt>}
      </Section>

      <Section label="Daily goal">
        <ChipRow>
          {GOAL_CHOICES.map((m) => (
            <Chip key={m} label={`${m} min`} selected={goalMin === m} onPress={() => updateSettings({ dailyGoalMin: m })} />
          ))}
        </ChipRow>
        <Txt variant="muted">Minutes of listening that count a day. Writing in your journal counts too.</Txt>
      </Section>

      <Card>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Icon name="bed-outline" size={20} color={t.colors.accent} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="medium">One rest day a week</Txt>
            <Txt variant="muted">Miss a single day and your streak keeps going. Miss two in a week and it starts again.</Txt>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
