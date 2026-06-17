import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { api } from '../../src/services/api';
import { getDeviceId } from './_layout';

type NextPrayer = { name: string; remainingMinutes: number };
type TodayProgress = { today: number; total: number; percentage: number };

export default function HomeScreen() {
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [progress, setProgress] = useState<TodayProgress>({ today: 0, total: 5, percentage: 0 });
  const [streak, setStreak] = useState(0);
  const [greeting, setGreeting] = useState('');
  const [growthScore, setGrowthScore] = useState<number | null>(null);
  const [spiritualStage, setSpiritualStage] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5) setGreeting('Late night reflections');
    else if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else if (hour < 20) setGreeting('Good evening');
    else setGreeting('Peaceful evening');

    loadData();
    loadGrowth();
  }, []);

  async function loadData() {
    try {
      const result = await api.getTodayPrayers(getDeviceId());
      if (result.success) {
        setNextPrayer(result.data.nextPrayer);
        setProgress(result.data.progress);
        setStreak(result.data.streak);
      }
    } catch (e) { /* offline */ }
  }

  async function loadGrowth() {
    try {
      const result = await api.getGrowthOverview(getDeviceId());
      if (result.success) {
        setGrowthScore(result.data.compositeScore);
        setSpiritualStage(result.data.spiritualStage);
      }
    } catch (e) { /* optional */ }
  }

  const prayerEmojis: Record<string, string> = {
    fajr: '🌅', sunrise: '☀️', dhuhr: '🌤️', asr: '🌇', maghrib: '🌄', isha: '🌙'
  };

  const stageEmojis: Record<string, string> = {
    seedling: '🌱', sprouting: '🌿', blooming: '🌸', fruiting: '🌳',
  };

  return (
    <ScrollView style={styles.container}>
      {/* Greeting & Streak */}
      <View style={styles.greetingCard}>
        <Text style={styles.greeting}>{greeting} 🌙</Text>

        {/* Streak Badge - prominent */}
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={20} color="#FF8C00" />
            <Text style={styles.streakText}>{streak} day streak</Text>
          </View>
        )}

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

      {/* Today's Progress Bar */}
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Today's Salah</Text>
          <Text style={styles.progressCount}>
            {progress.today}/{progress.total} <Text style={styles.progressPct}>({progress.percentage}%)</Text>
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
        </View>
      </View>

      {/* Quick Actions - Minimal, Notification-First */}
      <View style={styles.quickActions}>

        <Link href="/prayers" asChild>
          <TouchableOpacity style={styles.actionChip}>
            <Text style={styles.actionChipIcon}>🕌</Text>
            <Text style={styles.actionChipText}>Prayers</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/quran" asChild>
          <TouchableOpacity style={styles.actionChip}>
            <Text style={styles.actionChipIcon}>📖</Text>
            <Text style={styles.actionChipText}>Quran</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/hadith" asChild>
          <TouchableOpacity style={styles.actionChip}>
            <Text style={styles.actionChipIcon}>📜</Text>
            <Text style={styles.actionChipText}>Learn</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/buddy" asChild>
          <TouchableOpacity style={styles.actionChip}>
            <Text style={styles.actionChipIcon}>💬</Text>
            <Text style={styles.actionChipText}>Chat</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Who You're Becoming - Growth Card */}
      {growthScore !== null && (
        <Link href="/growth" asChild>
          <TouchableOpacity style={styles.growthCard}>
            <View style={styles.growthHeader}>
              <Text style={styles.growthStage}>
                {stageEmojis[spiritualStage] || '🌱'} {spiritualStage.charAt(0).toUpperCase() + spiritualStage.slice(1)}
              </Text>
              <View style={styles.growthScoreBadge}>
                <Text style={styles.growthScoreValue}>{growthScore}</Text>
              </View>
            </View>
            <Text style={styles.growthTitle}>Who You're Becoming</Text>
            <Text style={styles.growthSub}>
              See how {streak > 0 ? `your ${streak}-day streak` : 'prayer'} is shaping your character —
              patience, kindness, gratitude, and more.
            </Text>
            <View style={styles.growthArrow}>
              <Text style={styles.growthArrowText}>See my growth →</Text>
            </View>
          </TouchableOpacity>
        </Link>
      )}

      {/* Companion Message */}
      <View style={styles.companionCard}>
        <Text style={styles.companionEmoji}>🤲</Text>
        <Text style={styles.companionText}>
          You're not managing an app — you're building a person.
          Every prayer, every moment of patience, every kind word
          is a brick in the person you're becoming.
        </Text>
        <Text style={styles.companionRef}>
          "Indeed, prayer prohibits immorality and wrongdoing." (Quran 29:45)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F0' },

  greetingCard: {
    backgroundColor: '#1B4332',
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: { color: '#D4EDDA', fontSize: 24, fontWeight: '300' },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,140,0,0.15)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, alignSelf: 'flex-start', marginTop: 8, gap: 4,
  },
  streakText: { color: '#FFA726', fontSize: 14, fontWeight: '700' },
  nextPrayerBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 16, marginTop: 12,
  },
  nextPrayerEmoji: { fontSize: 36, marginRight: 16 },
  nextPrayerLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  nextPrayerSub: { color: '#A3D4B5', fontSize: 13, marginTop: 2 },

  progressCard: {
    backgroundColor: '#fff', margin: 16, marginBottom: 0,
    borderRadius: 16, padding: 16,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#1B4332' },
  progressCount: { fontSize: 14, color: '#495057', fontWeight: '500' },
  progressPct: { color: '#95A5A6', fontWeight: '400' },
  progressBar: { height: 6, backgroundColor: '#E8F5E9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2D6A4F', borderRadius: 3 },

  quickActions: {
    flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8,
  },
  actionChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, gap: 6,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  actionChipIcon: { fontSize: 16 },
  actionChipText: { fontSize: 13, fontWeight: '600', color: '#1B4332' },

  growthCard: {
    backgroundColor: '#fff', margin: 16, marginTop: 8,
    borderRadius: 20, padding: 20,
    borderLeftWidth: 4, borderLeftColor: '#2D6A4F',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  growthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  growthStage: { fontSize: 13, color: '#6C757D', fontWeight: '500' },
  growthScoreBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  growthScoreValue: { fontSize: 14, fontWeight: '700', color: '#2D6A4F' },
  growthTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  growthSub: { fontSize: 13, color: '#6C757D', lineHeight: 18, marginTop: 4 },
  growthArrow: { marginTop: 12 },
  growthArrowText: { fontSize: 13, fontWeight: '600', color: '#2D6A4F' },

  companionCard: {
    backgroundColor: '#E8F5E9', margin: 16, borderRadius: 20, padding: 24,
  },
  companionEmoji: { fontSize: 32, marginBottom: 8 },
  companionText: {
    fontSize: 14, color: '#2D6A4F', lineHeight: 22,
  },
  companionRef: {
    fontSize: 12, color: '#6C9E7A', fontStyle: 'italic', marginTop: 12,
    textAlign: 'right',
  },
});