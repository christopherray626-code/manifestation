'use no memo';
// ^ The widget library calls these components as plain functions, outside React. The React Compiler
// (on for this app) rewrites components to use a hook, which throws there, and the widget stayed blank.

import { useEffect, useRef } from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';

import type { Goal, Settings } from '@/lib/types';
import { AffirmationWidget, widgetData } from '@/widget/affirmation-widget';
import { PlayerWidget } from '@/widget/player-widget';
import { widgetRemote, type PlayerWidgetData } from '@/widget/remote';
import { StreakWidget, streakWidgetData } from '@/widget/streak-widget';

/**
 * Redraws the home-screen widgets when what they show changes: today's affirmation (the first
 * manifestation, or the theme), and the streak (a day counted, another minute listened, the theme).
 */
export function useWidget(goals: Goal[], settings: Settings, ready: boolean) {
  const data = ready ? widgetData(goals, settings) : null;
  const key = data ? `${data.text}|${data.label}|${data.colors.join()}` : '';
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      requestWidgetUpdate({ widgetName: 'Affirmation', renderWidget: () => <AffirmationWidget data={data} /> }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
    // The key covers everything the widget shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const streak = ready ? streakWidgetData(settings) : null;
  const streakKey = streak
    ? `${streak.streak}|${streak.done}|${streak.minutes}|${streak.goalMin}|${streak.week.map((d) => d.mark).join()}|${settings.themeId}`
    : '';
  useEffect(() => {
    if (!streak) return;
    // No waiting here: the minutes change while a tape plays with the app closed, where a timer wouldn't fire.
    requestWidgetUpdate({ widgetName: 'Streak', renderWidget: () => <StreakWidget data={streak} /> }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streakKey]);
}

/**
 * Keeps the player widget showing what's loaded and whether it's playing, and gives its buttons the
 * player's controls (see remote.ts). Called by the player itself, which is always mounted.
 */
export function usePlayerWidget(
  now: Omit<PlayerWidgetData, 'live'>,
  controls: { toggle: () => void; skip: (by: number) => void },
  ready: boolean,
) {
  const data: PlayerWidgetData = { ...now, live: true };
  const latest = useRef({ data, controls });
  // Kept up to date after every draw (before the effects below run).
  useEffect(() => {
    latest.current = { data, controls };
  });
  useEffect(() => {
    if (!ready) return;
    widgetRemote.state = () => latest.current.data;
    widgetRemote.toggle = () => latest.current.controls.toggle();
    widgetRemote.skip = (by) => latest.current.controls.skip(by);
    return () => {
      widgetRemote.state = undefined;
      widgetRemote.toggle = undefined;
      widgetRemote.skip = undefined;
    };
  }, [ready]);

  const key = `${data.title}|${data.subtitle}|${data.playing}|${data.colors.join()}`;
  useEffect(() => {
    if (!ready) return;
    requestWidgetUpdate({ widgetName: 'Player', renderWidget: () => <PlayerWidget data={latest.current.data} /> }).catch(() => {});
  }, [key, ready]);
}
