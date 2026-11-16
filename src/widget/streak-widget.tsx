'use no memo';
// ^ The widget library calls these components as plain functions, outside React (see affirmation-widget.tsx).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { STORE_KEY } from '@/lib/storage-key';
import { DEFAULT_GOAL_MIN, streakOf, thisWeek, type DayMark } from '@/lib/streak';
import { localDay } from '@/lib/today';
import type { Settings } from '@/lib/types';
import { getTheme } from '@/themes';

/*
 * The streak on the home screen: the flame and the count, this week's days, and how today stands.
 * Tapping it opens the streak page. Android only.
 */

export type StreakWidgetData = {
  streak: number;
  week: { label: string; mark: DayMark }[];
  done: boolean;
  minutes: number;
  goalMin: number;
  dark: boolean;
  colors: { bg: string; card: string; text: string; muted: string; accent: string; onAccent: string; border: string };
};

const hex = (c: string) => c.slice(0, 7) as `#${string}`;

export function streakWidgetData(settings: Partial<Settings>, now = Date.now()): StreakWidgetData {
  const theme = getTheme(settings.themeId ?? 'celestial');
  const day = localDay(now);
  const seconds = settings.listenToday?.day === day ? settings.listenToday.seconds : 0;
  const c = theme.colors;
  return {
    streak: streakOf(settings.listenDays, now),
    week: thisWeek(settings.listenDays, now),
    done: (settings.listenDays ?? []).includes(day),
    minutes: Math.floor(seconds / 60),
    goalMin: settings.dailyGoalMin ?? DEFAULT_GOAL_MIN,
    dark: theme.dark,
    colors: { bg: c.bg, card: c.card, text: c.text, muted: c.muted, accent: c.accent, onAccent: c.onAccent, border: c.border },
  };
}

export async function loadStreakWidgetData(): Promise<StreakWidgetData> {
  let settings: Partial<Settings> = {};
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (raw) ({ settings = {} } = JSON.parse(raw) as { settings?: Partial<Settings> });
  } catch {
    // Nothing saved yet: a streak of 0.
  }
  return streakWidgetData(settings);
}

export function StreakWidget({ data }: { data: StreakWidgetData }) {
  const c = data.colors;
  const today = data.done ? 'Today counts ✓' : data.minutes ? `${data.minutes} of ${data.goalMin} min today` : `${data.goalMin} min to count today`;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'manifestation://streak' }}
      accessibilityLabel={`${data.streak}-day streak. ${today}`}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 24,
        backgroundGradient: { from: hex(c.card), to: hex(c.bg), orientation: 'TL_BR' },
      }}>
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
        <TextWidget text="🔥" style={{ fontSize: 26 }} />
        <TextWidget
          text={` ${data.streak}`}
          style={{ fontSize: 34, color: hex(data.done || data.streak ? c.accent : c.muted), fontWeight: '700' }}
        />
        <TextWidget text={data.streak === 1 ? '  day' : '  days'} style={{ fontSize: 13, color: hex(c.muted) }} />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
        {data.week.map((d, i) => (
          <FlexWidget key={i} style={{ flexDirection: 'column', alignItems: 'center' }}>
            <TextWidget text={d.label} style={{ fontSize: 9, color: hex(c.muted) }} />
            <FlexWidget
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                marginTop: 3,
                ...(d.mark === 'done'
                  ? { backgroundColor: hex(c.accent) }
                  : { borderWidth: d.mark === 'today' ? 2 : 1, borderColor: hex(d.mark === 'today' ? c.accent : c.border) }),
              }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>
      <TextWidget text={today} maxLines={1} truncate="END" style={{ fontSize: 12, color: hex(data.done ? c.accent : c.text) }} />
    </FlexWidget>
  );
}
