'use no memo';
// ^ The widget library calls these components as plain functions, outside React. The React Compiler
// (on for this app) rewrites components to use a hook, which throws there, and the widget stayed blank.

import { useEffect } from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';

import type { Goal, Settings } from '@/lib/types';
import { AffirmationWidget, widgetData } from '@/widget/affirmation-widget';

/** Redraws the home-screen widget whenever today's affirmation, the first manifestation or the theme changes. */
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
}
