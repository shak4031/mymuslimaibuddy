import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../src/services/api';
import { scheduleAllPrayerNotifications, cancelAllNotifications, scheduleStreakCelebration } from '../src/services/notifications';

type PrayerRecord = { prayer_name: string; status: string; prayed_at: string | null };
type PrayerTimes = Record<string, string>;
type NextPrayer = { name: string; remainingMinutes: number };

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS: Record<string, string> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const PRAYER_EMOJIS: Record<string, string> = { fajr: '🌅', dhuhr: '🌤️', asr: '🌇', maghrib: '🌄', isha: '🌙' };

export default function PrayersScreen() {
  const [prayers, setPrayers] = useState<PrayerRecord[]>([]);
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [progress, setProgress] = useState({ prayed: 0, total: 5, percentage: 0 });
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const result = await api.getTodayPrayers('default-device');
      if (result.success) {
        setPrayers(result.data.prayers);
        setNextPrayer(result.data.nextPrayer);
        setProgress(result.data.progress);
        setStreak(result.data.streak);

        // Schedule prayer notifications from the prayer times
        if (result.data.prayerTimes) {
          const times: Record<string, Date> = {};
          for (const [name, time] of Object.entries(result.data.prayerTimes)) {
            times[name] = new Date(time as string);
          }
          await cancelAllNotifications();
          await scheduleAllPrayerNotifications(times, result.data.streak);
        }
      }
    } catch (e) {
      // Offline
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  async function markPrayer(prayerName: string) {
    try {
      const result = await api.markPrayer('default-device', prayerName);
      if (result.success) {
        setMessage(result.data.message || 'MashaAllah!');
        setProgress(result.data.progress);
        setStreak(result.data.streak);
        loadData();

        // Celebrate milestones
        if (result.data.streak >= 3 && result.data.streak % 1 === 0) {
          scheduleStreakCelebration(result.data.streak, prayerName);
        }

        setTimeout(() => setMessage(''), 4000);
      }
    } catch (e) {
      setMessage('Could not connect. Will sync later.');
      setTimeout(() => setMessage(''), 3000);
    }
  }

  const canPray = (prayerName: string): boolean => {
    const record = prayers.find(p => p.prayer_name === prayerName);
    return record?.status === 'pending';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Streak Banner */}
      <View style={styles.streakBanner}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <View>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.streakCount}>{streak} {streak === 1 ? 'day' : 'days'}</Text>
        </View>
        <View style={styles.streakPercent}>
          <Text style={styles.streakPercentText}>{progress.percentage}%</Text>
          <Text style={styles.streakPercentSub}>today</Text>
        </View>
      </View>

      {/* Success Message */}
      {message ? (
        <View style={styles.messageCard}>
          <Ionicons name="checkmark-circle" size={20} color="#2D6A4F" />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {/* Prayer Cards */}
      {PRAYER_NAMES.map(prayerName => {
        const record = prayers.find(p => p.prayer_name === prayerName);
        const isPrayed = record?.status === 'prayed';
        const isNext = nextPrayer?.name === prayerName;

        return (
          <View key={prayerName} style={[styles.prayerCard, isNext && styles.prayerCardNext]}>
            <View style={styles.prayerHeader}>
              <Text style={styles.prayerEmoji}>{PRAYER_EMOJIS[prayerName]}</Text>
              <View style={styles.prayerInfo}>
                <Text style={styles.prayerName}>{PRAYER_LABELS[prayerName]}</Text>
                {isNext && <Text style={styles.nextTag}>Next</Text>}
              </View>
              {isPrayed ? (
                <View style={styles.prayedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#2D6A4F" />
                  <Text style={styles.prayedText}>Prayed</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.markButton}
                  onPress={() => markPrayer(prayerName)}
                >
                  <Text style={styles.markButtonText}>Mark Prayed</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {/* Weekly Summary Link */}
      <TouchableOpacity style={styles.summaryLink}>
        <Ionicons name="calendar-outline" size={20} color="#2D6A4F" />
        <Text style={styles.summaryText}>View Weekly Summary</Text>
        <Ionicons name="chevron-forward" size={18} color="#95A5A6" />
      </TouchableOpacity>

      {/* Hadith Encouragement */}
      <View style={styles.encouragementCard}>
        <Text style={styles.encouragementTitle}>💪 Why it matters</Text>
        <Text style={styles.encouragementText}>
          "The first matter that the servant will be brought to account for on the Day of Judgment is the prayer. If it is sound, then the rest of his deeds will be sound." — Prophet Muhammad ﷺ
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F0',
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  streakEmoji: { fontSize: 32, marginRight: 12 },
  streakLabel: { fontSize: 13, color: '#795548' },
  streakCount: { fontSize: 20, fontWeight: '700', color: '#E65100' },
  streakPercent: {
    marginLeft: 'auto',
    alignItems: 'center',
    backgroundColor: 'rgba(230,81,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakPercentText: { fontSize: 18, fontWeight: '700', color: '#E65100' },
  streakPercentSub: { fontSize: 10, color: '#795548' },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  messageText: { flex: 1, color: '#155724', fontSize: 13 },
  prayerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  prayerCardNext: {
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
    backgroundColor: '#F0FDF4',
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerEmoji: { fontSize: 28, marginRight: 12 },
  prayerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  prayerName: { fontSize: 17, fontWeight: '600', color: '#1B4332' },
  nextTag: {
    backgroundColor: '#2D6A4F',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  prayedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  prayedText: { color: '#2D6A4F', fontSize: 13, fontWeight: '600' },
  markButton: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  summaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  summaryText: { flex: 1, color: '#2D6A4F', fontSize: 14, fontWeight: '500' },
  encouragementCard: {
    backgroundColor: '#E8F5E9',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  encouragementTitle: { fontSize: 16, fontWeight: '600', color: '#1B4332', marginBottom: 8 },
  encouragementText: { color: '#2D6A4F', fontSize: 13, lineHeight: 20 },
});