/**
 * MyMuslimBuddy — Notification Engine v2
 * 
 * This is NOT a standard notification service. This is the PRIMARY
 * interaction surface of the app. Every notification should feel like
 * a companion checking in, not an app alert.
 * 
 * Key features:
 * - AI-generated notification content (fetched from backend)
 * - Action buttons on notifications (Mark Prayed, Snooze, Talk)
 * - Smart scheduling with adaptive timing
 * - Prayer marking WITHOUT opening the app
 * - Notification logging for behavior tracking
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

// Configure notification handler — must be at top level
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowIcon: true,
  }),
});

// ============================================================
// PERMISSIONS
// ============================================================

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notif-v2] Permission not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-reminders', {
      name: 'Prayer Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B4332',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('daily-inspiration', {
      name: 'Daily Inspiration',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('growth-reflections', {
      name: 'Growth Reflections',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  return true;
}

// ============================================================
// NOTIFICATION ACTION BUTTONS
// These let the user interact WITHOUT opening the app
// ============================================================

// Register notification categories with action buttons
// Called once at app startup
export async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync('prayer_reminder', [
    {
      identifier: 'MARK_PRAYED',
      buttonTitle: '✅ Mark Prayed',
      options: {
        opensAppToForeground: false,    // Mark without opening app!
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'SNOOZE_15',
      buttonTitle: '⏰ 15 min',
      options: {
        opensAppToForeground: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'OPEN_BUDDY',
      buttonTitle: '💬 Talk to Buddy',
      options: {
        opensAppToForeground: true,    // This one opens the app
        isAuthenticationRequired: false,
      },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('daily_reflection', [
    {
      identifier: 'OPEN_REFLECTION',
      buttonTitle: '📝 Write Reflection',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'DISMISS',
      buttonTitle: '👍 Got it',
      options: { opensAppToForeground: false },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('growth_milestone', [
    {
      identifier: 'VIEW_GROWTH',
      buttonTitle: '📊 View Progress',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'SHARE',
      buttonTitle: '✨ Share',
      options: { opensAppToForeground: false },
    },
  ]);
}

// ============================================================
// SMART SCHEDULING ENGINE
// ============================================================

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

// Prayer windows in minutes (from start time)
const PRAYER_WINDOWS: Record<string, number> = {
  fajr: 120,     // Dawn to sunrise
  dhuhr: 200,    // Noon to Asr
  asr: 150,      // Asr to Maghrib
  maghrib: 60,   // Sunset to Isha
  isha: 300,     // Isha to midnight
};

/**
 * Schedule all notifications for today's prayers.
 * Uses AI-generated content from the backend.
 */
export async function scheduleAllPrayerNotifications(
  prayerTimes: Record<string, Date>,
  deviceId: string,
  streak: number = 0,
): Promise<void> {
  // Cancel existing prayer notifications first
  await cancelAllNotifications();

  const now = new Date();

  for (const name of PRAYER_NAMES) {
    const startTime = prayerTimes[name];
    if (!startTime || startTime <= now) continue;

    const windowEnd = new Date(startTime.getTime() + (PRAYER_WINDOWS[name] || 120) * 60 * 1000);

    // Schedule primary reminder at prayer time
    await scheduleSmartPrayerReminder(name, startTime, deviceId, streak, 1);

    // Schedule follow-up at 60% of window
    const followUpTime = new Date(startTime.getTime() + (PRAYER_WINDOWS[name] || 120) * 60 * 1000 * 0.6);
    if (followUpTime > now && followUpTime < windowEnd) {
      await scheduleSmartPrayerReminder(name, followUpTime, deviceId, streak, 2);
    }

    // Schedule final nudge at 80% of window (if user hasn't marked)
    const finalNudgeTime = new Date(startTime.getTime() + (PRAYER_WINDOWS[name] || 120) * 60 * 1000 * 0.8);
    if (finalNudgeTime > now && finalNudgeTime < windowEnd) {
      await scheduleSmartPrayerReminder(name, finalNudgeTime, deviceId, streak, 3);
    }
  }

  // Schedule morning connection
  const morningTime = new Date();
  morningTime.setHours(6, 30, 0, 0);
  if (morningTime > now) {
    await scheduleMorningConnection(morningTime, deviceId, streak);
  }

  console.log('[Notif-v2] All prayer notifications scheduled');
}

/**
 * Schedule a single AI-powered prayer notification.
 * Fetches content from backend so it's personalized and context-aware.
 */
async function scheduleSmartPrayerReminder(
  prayerName: string,
  triggerDate: Date,
  deviceId: string,
  streak: number,
  nudgeLevel: number,
): Promise<void> {
  // Try to get AI-generated content
  let title = `${PRAYER_LABELS[prayerName] || prayerName} time 🌙`;
  let body = 'Time to connect with your Creator. The Prophet ﷺ said prayer is the light of the believer.';

  try {
    const contextType = nudgeLevel === 1 ? 'prayer_reminder'
      : nudgeLevel === 3 ? 'prayer_missed_check'
      : 'prayer_reminder';

    const result = await api.generateNudge(deviceId, {
      contextType,
      nextPrayer: prayerName,
      streak,
      timeOfDay: getTimeOfDay(),
      nudgeLevel,
    });

    if (result.success && result.data.content) {
      body = result.data.content;
      title = `🕌 ${PRAYER_LABELS[prayerName] || prayerName}`;
    }
  } catch (e) {
    // Fallback to static message
    console.log('[Notif-v2] AI content failed, using fallback');
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        type: 'prayer_reminder',
        prayerName,
        nudgeLevel,
        deviceId,
        screen: 'prayers',
      },
      categoryIdentifier: 'prayer_reminder',
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'prayer-reminders' } : {}),
    },
    trigger: {
      date: triggerDate,
      channelId: 'prayer-reminders',
    },
  });
}

/**
 * Schedule a morning connection notification
 */
async function scheduleMorningConnection(
  triggerDate: Date,
  deviceId: string,
  streak: number,
): Promise<void> {
  let body = '🌅 Assalamu Alaikum. Just a thought: the Prophet ﷺ said whoever prays Fajr is under Allah\'s protection. Today is a new chance.';

  try {
    const result = await api.generateNudge(deviceId, {
      contextType: 'morning_connection',
      streak,
      timeOfDay: 'morning',
    });
    if (result.success && result.data.content) {
      body = result.data.content;
    }
  } catch (e) { /* use fallback */ }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌅 Morning Reflection',
      body,
      data: { type: 'daily_inspiration', deviceId, screen: 'home' },
      categoryIdentifier: 'daily_reflection',
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'daily-inspiration' } : {}),
    },
    trigger: {
      date: triggerDate,
      channelId: 'daily-inspiration',
    },
  });
}

/**
 * Schedule a growth milestone notification
 */
export async function scheduleGrowthMilestone(
  streak: number,
  deviceId: string,
): Promise<void> {
  let title: string;
  let body: string;

  if (streak === 7) {
    title = '🎉 One Week Streak!';
    body = 'Masha\'Allah! A full week of all 5 prayers. The Prophet ﷺ said the most beloved deeds are the most consistent. You\'re becoming someone new.';
  } else if (streak === 30) {
    title = '🌟 30 Days! Incredible!';
    body = 'A full month. Do you realize what this does to a person? Prayer prohibits immorality and wrongdoing. You\'re literally rewiring your character.';
  } else if (streak % 10 === 0) {
    title = `🔥 ${streak}-Day Streak!`;
    body = `SubhanAllah! ${streak} days of all 5 prayers. Your consistency is building real character — patience, gratitude, self-discipline. Keep going!`;
  } else if (streak >= 3) {
    title = `🔥 ${streak}-Day Streak`;
    body = 'The most beloved deeds are the most consistent. You\'re proving that small daily acts create big change. Don\'t stop now!';
  } else {
    return; // Don't notify for small streaks
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'growth_milestone', deviceId, screen: 'growth' },
      categoryIdentifier: 'growth_milestone',
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'growth-reflections' } : {}),
    },
    trigger: null, // Immediate
  });
}

/**
 * Schedule a daily character reflection prompt (evening)
 */
export async function scheduleEveningReflection(
  deviceId: string,
  streak: number,
): Promise<void> {
  const evening = new Date();
  evening.setHours(20, 0, 0, 0);
  if (evening <= new Date()) return;

  let body = '🌙 End-of-day check: how was your patience today? Did prayer change how you reacted to something? Take 30 seconds to reflect.';

  try {
    const result = await api.generateNudge(deviceId, {
      contextType: 'character_reflection',
      streak,
      timeOfDay: 'night',
    });
    if (result.success && result.data.content) {
      body = result.data.content;
    }
  } catch (e) { /* use fallback */ }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Evening Reflection',
      body,
      data: { type: 'evening_reflection', deviceId, screen: 'growth' },
      categoryIdentifier: 'daily_reflection',
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'growth-reflections' } : {}),
    },
    trigger: {
      date: evening,
      channelId: 'growth-reflections',
    },
  });
}

// ============================================================
// HANDLE NOTIFICATION TAPS & ACTION BUTTONS
// ============================================================

/**
 * Handle notification interaction (tap or action button press)
 * Call this from app/_layout.tsx onNotificationResponse
 */
export async function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data;
  const actionId = response.actionIdentifier;

  console.log(`[Notif-v2] Action: ${actionId} | Data:`, JSON.stringify(data));

  if (!data) return;

  // Handle action buttons
  if (actionId === 'MARK_PRAYED' && data.prayerName && data.deviceId) {
    // Mark prayer WITHOUT opening the app! Return null so no navigation happens
    try {
      await api.markPrayer(data.deviceId, data.prayerName);
      console.log(`[Notif-v2] Prayer ${data.prayerName} marked from notification!`);

      // Schedule a follow-up celebration notification
      await schedulePrayerCompletedCelebration(data.prayerName, data.deviceId);
    } catch (e) {
      console.log('[Notif-v2] Failed to mark prayer from notification:', e);
    }
    return null; // Don't navigate — user stayed where they were
  }

  if (actionId === 'SNOOZE_15' && data.prayerName) {
    // Reschedule this notification 15 min from now
    const snoozeTime = new Date(Date.now() + 15 * 60 * 1000);
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    // Don't cancel existing, just add a snooze
    await Notifications.scheduleNotificationAsync({
      content: response.notification.request.content,
      trigger: { date: snoozeTime, channelId: 'prayer-reminders' },
    });
    return null;
  }

  if (actionId === 'OPEN_BUDDY') {
    return '/buddy';
  }

  if (actionId === 'VIEW_GROWTH' || actionId === 'OPEN_REFLECTION') {
    return '/growth';
  }

  // Default: handle tap on notification body — navigate to the screen in data
  if (data.screen) {
    return `/${data.screen}`;
  }

  return null;
}

/**
 * Schedule a quick celebration notification when prayer is marked from notification
 */
async function schedulePrayerCompletedCelebration(prayerName: string, deviceId: string) {
  let body = `🤲 Masha'Allah! ${PRAYER_LABELS[prayerName] || prayerName} marked. Every prayer shapes who you're becoming.`;

  try {
    const result = await api.generateNudge(deviceId, {
      contextType: 'prayer_completed',
      prayerName,
      streak: 0,
    });
    if (result.success && result.data.content) {
      body = result.data.content;
    }
  } catch (e) { /* use fallback */ }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Prayer Marked',
      body,
      data: { type: 'prayer_confirmation', deviceId, screen: 'prayers' },
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'prayer-reminders' } : {}),
    },
    trigger: { seconds: 2 }, // Small delay
  });
}

// ============================================================
// CANCEL / MANAGE
// ============================================================

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function getScheduledNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.map(n => ({
    identifier: n.identifier,
    title: n.content.title || '',
    body: n.content.body || '',
    data: n.content.data,
    trigger: n.trigger,
  }));
}

// ============================================================
// LISTENERS
// ============================================================

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function removeNotificationListener(subscription: Notifications.Subscription): void {
  subscription.remove();
}

// ============================================================
// HELPERS
// ============================================================

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 20) return 'evening';
  return 'night';
}