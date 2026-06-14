import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { api } from '../src/services/api';

type NextPrayer = { name: string; remainingMinutes: number };
type TodayProgress = { prayed: number; total: number; percentage: number };

export default function HomeScreen() {
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [progress, setProgress] = useState<TodayProgress>({ prayed: 0, total: 5, percentage: 0 });
  const [streak, setStreak] = useState(0);
  const [greeting, setGreeting] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5) { setGreeting('Late night reflections'); setTimeOfDay('night'); }
    else if (hour < 12) { setGreeting('Good morning'); setTimeOfDay('morning'); }
    else if (hour < 17) { setGreeting('Good afternoon'); setTimeOfDay('afternoon'); }
    else if (hour < 20) { setGreeting('Good evening'); setTimeOfDay('evening'); }
    else { setGreeting('Peaceful evening'); setTimeOfDay('night'); }

    loadData();
  }, []);

  async function loadData() {
    try {
      const [prayerResult] = await Promise.all([
        api.getTodayPrayers('default-device')
      ]);
      if (prayerResult.success) {
        setNextPrayer(prayerResult.data.nextPrayer);
        setProgress(prayerResult.data.progress);
        setStreak(prayerResult.data.streak);
      }
    } catch (e) {
      // Offline - use fallback
    }
  }

  const prayerEmojis: Record<string, string> = {
    fajr: '🌅', sunrise: '☀️', dhuhr: '🌤️', asr: '🌇', maghrib: '🌄', isha: '🌙'
  };

  return (
    <ScrollView style={styles.container}>
      {/* Greeting & Streak */}
      <View style={styles.greetingCard}>
        <Text style={styles.greeting}>{greeting} 🌙</Text>
        {nextPrayer && (
          <View style={styles.nextPrayerBanner}>
            <Text style={styles.nextPrayerEmoji}>{prayerEmojis[nextPrayer.name] || '🕌'}</Text>
            <View>
              <Text style={styles.nextPrayerLabel}>
                {nextPrayer.name.charAt(0).toUpperCase() + nextPrayer.name.slice(1)} in {nextPrayer.remainingMinutes} min
              </Text>
              <Text style={styles.nextPrayerSub}>Time to prepare</Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.grid}>
        <Link href="/prayers" asChild>
          <TouchableOpacity style={styles.gridCard}>
            <Ionicons name="moon-outline" size={32} color="#2D6A4F" />
            <Text style={styles.gridTitle}>Prayers</Text>
            <Text style={styles.gridSub}>{progress.prayed}/{progress.total}</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/quran" asChild>
          <TouchableOpacity style={styles.gridCard}>
            <Ionicons name="book-outline" size={32} color="#2D6A4F" />
            <Text style={styles.gridTitle}>Quran</Text>
            <Text style={styles.gridSub}>Read today</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/hadith" asChild>
          <TouchableOpacity style={styles.gridCard}>
            <Ionicons name="bulb-outline" size={32} color="#2D6A4F" />
            <Text style={styles.gridTitle}>Learn</Text>
            <Text style={styles.gridSub}>Hadith & Seerah</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/buddy" asChild>
          <TouchableOpacity style={styles.gridCard}>
            <Ionicons name="chatbubbles-outline" size={32} color="#2D6A4F" />
            <Text style={styles.gridTitle}>Buddy</Text>
            <Text style={styles.gridSub}>Chat with AI</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Today's Progress */}
      <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Today's Salah</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{progress.prayed}/{progress.total} prayers completed</Text>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#FF8C00" />
              <Text style={styles.streakText}>{streak} day streak</Text>
            </View>
          )}
        </View>
      </View>

      {/* Reminders */}
      <View style={styles.reminderCard}>
        <Ionicons name="information-circle-outline" size={20} color="#2D6A4F" />
        <Text style={styles.reminderText}>
          "The most beloved deeds to Allah are the most consistent, even if small." — Bukhari & Muslim
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
  greetingCard: {
    backgroundColor: '#1B4332',
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    color: '#D4EDDA',
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 20,
  },
  nextPrayerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  nextPrayerEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  nextPrayerLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  nextPrayerSub: {
    color: '#A3D4B5',
    fontSize: 13,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  gridCard: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B4332',
    marginTop: 8,
  },
  gridSub: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B4332',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2D6A4F',
    borderRadius: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  progressText: {
    color: '#495057',
    fontSize: 13,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    color: '#E65100',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  reminderText: {
    flex: 1,
    color: '#2D6A4F',
    fontSize: 13,
    lineHeight: 18,
  },
});