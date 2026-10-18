import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { todaysAffirmation } from '@/lib/today';
import type { Goal, Reminder } from '@/lib/types';

/**
 * A repeating daily notification can't change its text, so instead each reminder is
 * scheduled one by one for the next DAYS_AHEAD days, each showing that day's actual
 * affirmation. They're rebuilt every time the app opens or anything changes, which keeps
 * them fresh as long as the app is opened at least once every couple of weeks.
 * iOS keeps at most 64 pending notifications: MAX_REMINDERS * DAYS_AHEAD must stay under that.
 */
export const MAX_REMINDERS = 3;
const DAYS_AHEAD = 14;
const CHANNEL = 'reminders';

export const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function formatTime(hour: number, minute: number) {
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Asks for permission if needed. Returns whether notifications are allowed. */
export async function askPermission() {
  if (!supported) return false;
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted || asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/** The goal a reminder talks about on a given day: goals take turns day by day. */
function goalFor(goals: Goal[], dayIndex: number) {
  const withText = goals.filter((g) => g.affirmations.length);
  return withText.length ? withText[dayIndex % withText.length] : undefined;
}

function contentFor(reminder: Reminder, goals: Goal[], at: Date, dayIndex: number) {
  const goal = goalFor(goals, dayIndex);
  const affirmation = goal && todaysAffirmation(goal, at.getTime());
  if (reminder.opens === 'tape') {
    return {
      title: goal ? `Time for your tape: ${goal.title}` : 'Time for your tape',
      body: affirmation?.text ?? 'A few quiet minutes with your affirmations.',
      data: { url: goal ? `/listen?goal=${goal.id}` : '/listen' },
    };
  }
  return {
    title: "Today's affirmation",
    body: affirmation?.text ?? 'Take a moment to feel it as already yours.',
    data: { url: '/' },
  };
}

/** Clears every scheduled reminder and schedules the enabled ones again. */
export async function rescheduleReminders(reminders: Reminder[], goals: Goal[]) {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const active = reminders.filter((r) => r.enabled).slice(0, MAX_REMINDERS);
  if (!active.length) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await ensureChannel();

  const now = Date.now();
  const jobs: Promise<string>[] = [];
  for (const reminder of active) {
    for (let day = 0; day <= DAYS_AHEAD; day++) {
      const at = new Date();
      at.setDate(at.getDate() + day);
      at.setHours(reminder.hour, reminder.minute, 0, 0);
      if (at.getTime() <= now + 30_000) continue;
      jobs.push(
        Notifications.scheduleNotificationAsync({
          content: contentFor(reminder, goals, at, day),
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
        }),
      );
    }
  }
  await Promise.all(jobs);
}

function openFrom(response: Notifications.NotificationResponse | null) {
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const url = response.notification.request.content.data?.url;
  if (typeof url === 'string') router.push(url as never);
  Notifications.clearLastNotificationResponse();
}

/** Keeps scheduled reminders in step with the saved ones and opens the right screen on tap. */
export function useReminders(reminders: Reminder[], goals: Goal[], ready: boolean) {
  useEffect(() => {
    if (!ready || !supported) return;
    // Waits a moment so a burst of edits (typing an affirmation) only reschedules once.
    const timer = setTimeout(() => rescheduleReminders(reminders, goals).catch(() => {}), 800);
    return () => clearTimeout(timer);
  }, [reminders, goals, ready]);

  useEffect(() => {
    if (!ready || !supported) return;
    // Covers the app being launched by tapping a reminder, then taps while it's running.
    openFrom(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(openFrom);
    return () => sub.remove();
  }, [ready]);
}
