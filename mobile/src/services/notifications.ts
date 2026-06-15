import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type ScheduledNotif = {
  identifier: string;
  title: string;
  body: string;
  data?: any;
  triggerDate: Date;
};

const PRAYER_EMOJIS: Record<string, string> = {
  fajr: '🌅', dhuhr: '🌤️', asr: '🌇', maghrib: '🌄', isha: '🌙'
};

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha'
};

/**
 * Request notification permissions
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return false;
  }

  // Android-specific: create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-reminders', {
      name: 'Prayer Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B4332',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('inspiration', {
      name: 'Daily Inspiration',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  return true;
}

/**
 * Schedule a prayer reminder notification at a specific time
 */
export async function schedulePrayerReminder(
  prayerName: string,
  prayerTime: Date,
  streak: number = 0
): Promise<string> {
  const emoji = PRAYER_EMOJIS[prayerName] || '🕌';
  const label = PRAYER_LABELS[prayerName] || prayerName;

  // Don't schedule if the time is already past
  if (prayerTime <= new Date()) {
    return '';
  }

  const title = `${emoji} Time for ${label}`;
  const body = streak > 0
    ? `You're on a ${streak}-day streak! Don't break it now. The Prophet ﷺ said prayer is the light of the believer.`
    : `The time for ${label} has begun. Take a moment for your Creator.`;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'prayer_reminder', prayerName, screen: 'prayers' },
      sound: 'default',
    },
    trigger: {
      date: prayerTime,
      channelId: 'prayer-reminders',
    },
  });

  return identifier;
}

/**
 * Schedule a follow-up nudge at 80% of the prayer window
 * (when most of the prayer time has passed but the user hasn't marked it)
 */
export async function scheduleFollowUpNudge(
  prayerName: string,
  windowEnd: Date
): Promise<string> {
  const emoji = PRAYER_EMOJIS[prayerName] || '🕌';
  const label = PRAYER_LABELS[prayerName] || prayerName;

  // Schedule at 80% of the window (or 15 min before end)
  const nudgeTime = new Date(windowEnd.getTime() - 15 * 60 * 1000);

  if (nudgeTime <= new Date()) {
    return '';
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} ${label} window closing soon`,
      body: `Haven't prayed ${label} yet? There's still time. "Indeed, prayer is ever upon the believers a decreed obligation." (Quran 4:103)`,
      data: { type: 'prayer_nudge', prayerName, screen: 'prayers' },
      sound: 'default',
    },
    trigger: {
      date: nudgeTime,
      channelId: 'prayer-reminders',
    },
  });

  return identifier;
}

/**
 * Schedule daily inspirational notification (hadith/ayah tip)
 * Defaults to a good morning time
 */
export async function scheduleDailyInspiration(
  hour: number = 9,
  minute: number = 0
): Promise<string> {
  const tips = [
    { title: '📜 Daily Hadith', body: '"The most beloved deeds to Allah are the most consistent, even if small." — Bukhari & Muslim' },
    { title: '📖 Ayah of the Day', body: '"So remember Me; I will remember you." (Quran 2:152) — A beautiful reminder of Allah\'s promise.' },
    { title: '💪 Morning Motivation', body: '"Whoever takes a path seeking knowledge, Allah makes the path to Paradise easy for them." — Muslim' },
    { title: '🕊️ Reflection', body: '"And whoever puts their trust in Allah, He is sufficient for them." (Quran 65:3)' },
    { title: '🌙 Evening Reminder', body: '"The coolness of my eyes was in prayer." — Prophet Muhammad ﷺ (Nasai). End your day in peace.' },
  ];

  const todayTip = tips[new Date().getDay() % tips.length];

  // Schedule for today or tomorrow if already past
  const triggerDate = new Date();
  triggerDate.setHours(hour, minute, 0, 0);
  if (triggerDate <= new Date()) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: todayTip.title,
      body: todayTip.body,
      data: { type: 'daily_inspiration', screen: 'hadith' },
      sound: 'default',
    },
    trigger: {
      date: triggerDate,
      channelId: 'inspiration',
    },
  });

  return identifier;
}

/**
 * Schedule a streak celebration notification
 */
export async function scheduleStreakCelebration(
  streak: number,
  prayerName?: string
): Promise<string> {
  let title: string;
  let body: string;

  if (streak === 7) {
    title = '🎉 One Week Streak!';
    body = `Masha'Allah! A full week of all 5 prayers! This consistency is beloved to Allah. Keep going!`;
  } else if (streak === 30) {
    title = '🌟 30 Days! Incredible!';
    body = 'A full month of complete prayers. The Prophet ﷺ said the reward for consistency is beyond measure.';
  } else if (streak % 10 === 0) {
    title = `🔥 ${streak}-Day Streak!`;
    body = `SubhanAllah! ${streak} days of all 5 prayers. You are building a powerful habit for the Hereafter.`;
  } else if (streak >= 3) {
    title = `🔥 ${streak}-Day Streak`;
    body = 'The most beloved deeds are the most consistent. You\'re doing beautifully. Keep going!';
  } else {
    // Don't schedule for small streaks
    return '';
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'streak_celebration', screen: 'prayers' },
      sound: 'default',
    },
    trigger: null, // Immediate
  });

  return identifier;
}

/**
 * Schedule all 5 prayer notifications for the day
 * Returns an array of scheduled notification identifiers
 */
export async function scheduleAllPrayerNotifications(
  prayerTimes: Record<string, Date>,
  streak: number = 0
): Promise<string[]> {
  const identifiers: string[] = [];

  // Prayer window durations (approximate, in minutes)
  const windowDurations: Record<string, number> = {
    fajr: 120,     // Dawn to sunrise (~2h)
    dhuhr: 200,    // Noon to Asr (~3.3h)
    asr: 150,      // Asr to Maghrib (~2.5h)
    maghrib: 60,   // Sunset to Isha (~1h)
    isha: 300,     // Isha to midnight (~5h)
  };

  for (const [name, time] of Object.entries(prayerTimes)) {
    if (name === 'sunrise') continue;
    const prayerDate = new Date(time);

    // Main reminder at prayer time
    const id1 = await schedulePrayerReminder(name, prayerDate, streak);
    if (id1) identifiers.push(id1);

    // Follow-up nudge at 80% of window
    const duration = windowDurations[name] || 120;
    const windowEnd = new Date(prayerDate.getTime() + duration * 60 * 1000);
    const id2 = await scheduleFollowUpNudge(name, windowEnd);
    if (id2) identifiers.push(id2);
  }

  return identifiers;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Cancel a specific notification by identifier
 */
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<ScheduledNotif[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.map(n => ({
    identifier: n.identifier,
    title: n.content.title || '',
    body: n.content.body || '',
    data: n.content.data,
    triggerDate: (n.trigger as any)?.date || n.trigger || new Date(),
  }));
}

/**
 * Add a listener for incoming notifications
 */
export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Add a listener for when user taps a notification
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Remove notification listeners
 */
export function removeNotificationListener(subscription: Notifications.Subscription): void {
  subscription.remove();
}