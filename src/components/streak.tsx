import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Modal, Pressable, View } from 'react-native';

import { Button, Icon, Txt, useTheme } from '@/components/ui';
import { usePlayer } from '@/lib/player';
import { useStore } from '@/lib/store';
import { DEFAULT_GOAL_MIN, MILESTONES, nextMilestone, streakOf, thisWeek, type DayMark } from '@/lib/streak';
import { localDay } from '@/lib/today';

const todayNumber = () => localDay(Date.now());

/** How far today's listening is toward the daily goal, 0 to 1, and whether today already counts. */
export function useToday() {
  const { settings } = useStore();
  const day = todayNumber();
  const goal = (settings.dailyGoalMin ?? DEFAULT_GOAL_MIN) * 60;
  const seconds = settings.listenToday?.day === day ? settings.listenToday.seconds : 0;
  const done = (settings.listenDays ?? []).includes(day);
  return { done, progress: done ? 1 : Math.min(seconds / goal, 1), seconds, goal };
}

/** The flame and count in the corner of Today. Grey until today's goal is reached. Opens the streak page. */
export function StreakBadge() {
  const t = useTheme();
  const { settings } = useStore();
  const streak = streakOf(settings.listenDays);
  const { done } = useToday();
  const lit = done ? t.colors.accent : t.colors.muted;
  return (
    <Pressable
      onPress={() => router.push('/streak')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${streak}-day streak${done ? ', today done' : ', not done today'}. Open streak`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: done ? t.colors.accent : t.colors.border,
        alignSelf: 'flex-start',
      }}>
      <Icon name={done ? 'flame' : 'flame-outline'} size={18} color={lit} />
      <Txt variant="medium" style={{ color: lit }}>
        {streak}
      </Txt>
    </Pressable>
  );
}

/** Monday to Sunday as dots: filled for done, a moon for a forgiven rest day, a ring for today. */
export function WeekDots() {
  const t = useTheme();
  const { settings } = useStore();
  const week = thisWeek(settings.listenDays);
  const style = (mark: DayMark) =>
    mark === 'done'
      ? { backgroundColor: t.colors.accent, borderColor: t.colors.accent }
      : mark === 'today'
        ? { borderColor: t.colors.accent, borderWidth: 2 }
        : { borderColor: t.colors.border };
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
      {week.map((d, i) => (
        <View key={i} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
          <Txt variant="muted" style={{ fontSize: 12 }}>
            {d.label}
          </Txt>
          <View
            style={[{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, style(d.mark)]}>
            {d.mark === 'done' && <Icon name="flame" size={16} color={t.colors.onAccent} />}
            {d.mark === 'rest' && <Icon name="bed-outline" size={14} color={t.colors.muted} />}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Pops up the moment today's goal is reached, Duolingo-style. */
export function StreakCelebration() {
  const t = useTheme();
  const { celebrate, dismissCelebration } = usePlayer();
  const [scale] = useState(() => new Animated.Value(0.4));
  useEffect(() => {
    if (celebrate == null) return;
    scale.setValue(0.4);
    AccessibilityInfo.isReduceMotionEnabled()
      .then((still) =>
        still
          ? scale.setValue(1)
          : Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start(),
      )
      .catch(() => scale.setValue(1));
  }, [celebrate, scale]);
  if (celebrate == null) return null;
  const milestone = MILESTONES.includes(celebrate);
  const next = nextMilestone(celebrate);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissCelebration} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}>
        <View
          style={{
            backgroundColor: t.colors.bg,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: t.colors.border,
            padding: 28,
            gap: 18,
            alignItems: 'center',
          }}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Icon name="flame" size={96} color={t.colors.accent} />
          </Animated.View>
          <Txt variant="display" style={{ textAlign: 'center' }}>
            {celebrate === 1 ? 'Day 1' : `${celebrate}-day streak`}
          </Txt>
          <Txt variant="body" style={{ textAlign: 'center', color: t.colors.muted }}>
            {milestone
              ? `${celebrate} days of showing up. This is how it becomes real.`
              : celebrate === 1
                ? 'Today counts. Come back tomorrow to keep it going.'
                : `Today’s done.${next ? ` ${next - celebrate} more to reach ${next}.` : ''}`}
          </Txt>
          <View style={{ alignSelf: 'stretch' }}>
            <WeekDots />
          </View>
          <View style={{ alignSelf: 'stretch' }}>
            <Button title="Keep going" onPress={dismissCelebration} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** A thin bar showing today's minutes toward the goal. */
export function TodayProgress() {
  const t = useTheme();
  const { done, progress, seconds, goal } = useToday();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: t.colors.border, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: t.colors.accent, borderRadius: 4 }} />
      </View>
      <Txt variant="muted">
        {done
          ? 'Today counts. See you tomorrow.'
          : `${Math.floor(seconds / 60)} of ${goal / 60} min today. Listen or write in your journal to count today.`}
      </Txt>
    </View>
  );
}

