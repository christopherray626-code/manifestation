import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { paletteFor } from '@/components/art';
import { STORE_KEY } from '@/lib/store';
import { setAppOpens, todaysAffirmation } from '@/lib/today';
import type { Goal, Settings } from '@/lib/types';
import { getTheme } from '@/themes';

/*
 * The home-screen widget: today's affirmation from the first manifestation (the same one Home shows),
 * on that manifestation's card colours. Tapping it opens the app. Android only.
 */

export type WidgetData = { text: string; label: string; colors: readonly string[] };

const hex = (c: string) => c.slice(0, 7) as `#${string}`;

/** Reads the app's saved state and works out what the widget should say today. */
export async function loadWidgetData(): Promise<WidgetData> {
  let goals: Goal[] = [];
  let settings: Partial<Settings> = {};
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (raw) ({ goals = [], settings = {} } = JSON.parse(raw) as { goals?: Goal[]; settings?: Partial<Settings> });
  } catch {
    // Nothing saved yet, or unreadable: show the empty state.
  }
  return widgetData(goals, settings);
}

export function widgetData(goals: Goal[], settings: Partial<Settings>): WidgetData {
  // "A new one each time the app opens" counts opens; the widget shows the one from the last open.
  setAppOpens(settings.opens ?? 0);
  const theme = getTheme(settings.themeId ?? 'celestial');
  const goal = goals[0];
  const today = goal && todaysAffirmation(goal);
  return {
    text: today?.text ?? 'Open the app and write your first manifestation.',
    label: goal ? goal.title : 'Today',
    colors: paletteFor(goal?.category, 0, theme),
  };
}

export function AffirmationWidget({ data }: { data: WidgetData }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 24,
        backgroundGradient: { from: hex(data.colors[0]), to: hex(data.colors[2]), orientation: 'TL_BR' },
      }}>
      <TextWidget
        text={`✦  ${data.label.toUpperCase()}`}
        maxLines={1}
        truncate="END"
        style={{ fontSize: 11, letterSpacing: 0.15, color: '#FFFFFF', fontWeight: '600' }}
      />
      <TextWidget
        text={data.text}
        maxLines={5}
        truncate="END"
        style={{ fontSize: 19, color: '#FFFFFF', fontStyle: 'italic', lineHeight: 25 }}
      />
    </FlexWidget>
  );
}
