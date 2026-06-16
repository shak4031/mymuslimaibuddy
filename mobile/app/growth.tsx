import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../src/services/api';
import { getDeviceId } from './_layout';

type GrowthOverview = {
  compositeScore: number;
  spiritualStage: string;
  streak: number;
  bestStreak: number;
  weekly: { prayed: number; total: number; percentage: number };
  characterGrowth: {
    currentAverages: { patience: number; gratitude: number; kindness: number } | null;
    trend: { patience: number; gratitude: number; kindness: number } | null;
  };
  milestones: Array<{
    title: string; description: string; achieved_at: string;
  }>;
  journal: Array<{
    id: string; entry_date: string; entry_type: string;
    content: string; ai_reflection: string | null;
  }>;
};

const STAGE_CONFIG: Record<string, { icon: string; color: string; desc: string }> = {
  seedling:   { icon: '🌱', color: '#81C784', desc: 'Every giant tree starts as a seed. You\'re growing roots.' },
  sprouting:  { icon: '🌿', color: '#66BB6A', desc: 'Breaking through the soil — consistency is building momentum.' },
  blooming:   { icon: '🌸', color: '#4CAF50', desc: 'The fruits of your consistency are becoming visible.' },
  fruiting:   { icon: '🌳', color: '#2E7D32', desc: 'A source of shade and strength for others. You\'re bearing fruit.' },
};

const STAGE_ORDER = ['seedling', 'sprouting', 'blooming', 'fruiting'];

const CHARACTER_TRAITS = [
  { key: 'patience', icon: '🕊️', label: 'Patience', color: '#42A5F5' },
  { key: 'gratitude', icon: '🙏', label: 'Gratitude', color: '#FFA726' },
  { key: 'kindness', icon: '💛', label: 'Kindness', color: '#EF5350' },
];

export default function GrowthScreen() {
  const [data, setData] = useState<GrowthOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError('');
      const result = await api.getGrowthOverview(getDeviceId());
      if (result.success) {
        setData(result.data);
      } else {
        setError('Could not load growth data');
      }
    } catch (e) {
      setError('Connection error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
        <Text style={styles.loadingText}>Loading your growth...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline" size={48} color="#95A5A6" />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSub}>Keep praying — data will sync when connected.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) return null;

  const stage = STAGE_CONFIG[data.spiritualStage] || STAGE_CONFIG.seedling;
  const currentStageIndex = STAGE_ORDER.indexOf(data.spiritualStage);
  const nextStage = currentStageIndex < STAGE_ORDER.length - 1
    ? STAGE_CONFIG[STAGE_ORDER[currentStageIndex + 1]]
    : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Spiritual Stage Banner */}
      <View style={[styles.stageBanner, { backgroundColor: stage.color + '20' }]}>
        <Text style={styles.stageIcon}>{stage.icon}</Text>
        <View style={styles.stageInfo}>
          <Text style={styles.stageTitle}>
            {data.spiritualStage.charAt(0).toUpperCase() + data.spiritualStage.slice(1)}
          </Text>
          <Text style={styles.stageDesc}>{stage.desc}</Text>
        </View>
      </View>

      {/* Growth Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Spiritual Growth Score</Text>
        <Text style={[styles.scoreValue, { color: data.compositeScore >= 70 ? '#2E7D32' : data.compositeScore >= 40 ? '#F57C00' : '#C62828' }]}>
          {data.compositeScore}
        </Text>
        <Text style={styles.scoreRange}>out of 100</Text>

        {/* Progress to next stage */}
        {nextStage && (
          <View style={styles.stageProgress}>
            <Text style={styles.stageProgressLabel}>
              Next stage: {nextStage.icon} {STAGE_ORDER[currentStageIndex + 1].charAt(0).toUpperCase() + STAGE_ORDER[currentStageIndex + 1].slice(1)}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(data.compositeScore, 100)}%` }]} />
            </View>
          </View>
        )}
      </View>

      {/* Character Traits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 Your Character</Text>
        <Text style={styles.sectionSub}>
          Prayer doesn't just fulfill an obligation — it rewires who you are.
          Here's how your consistency is shaping your character:
        </Text>

        {data.characterGrowth.currentAverages ? (
          <View style={styles.traitsGrid}>
            {CHARACTER_TRAITS.map(trait => {
              const score = data.characterGrowth.currentAverages![trait.key as keyof typeof data.characterGrowth.currentAverages];
              const trend = data.characterGrowth.trend?.[trait.key as keyof typeof data.characterGrowth.trend] || 0;
              return (
                <View key={trait.key} style={styles.traitCard}>
                  <Text style={styles.traitIcon}>{trait.icon}</Text>
                  <Text style={styles.traitLabel}>{trait.label}</Text>
                  <Text style={[styles.traitScore, { color: trait.color }]}>
                    {score.toFixed(1)}
                  </Text>
                  <View style={styles.traitBar}>
                    <View style={[styles.traitBarFill, { width: `${(score / 10) * 100}%`, backgroundColor: trait.color }]} />
                  </View>
                  {trend !== 0 && (
                    <Text style={[styles.traitTrend, { color: trend > 0 ? '#2E7D32' : '#C62828' }]}>
                      {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyTraits}>
            <Text style={styles.emptyText}>
              Start tracking to see how prayer shapes your character.
              Mark your prayers and the system will begin mapping your growth.
            </Text>
          </View>
        )}
      </View>

      {/* Ripple Effect */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌊 The Ripple Effect</Text>
        <Text style={styles.rippleText}>
          Your {data.streak > 0 ? `${data.streak}-day` : 'growing'} prayer streak is not just about salah — 
          it's about who you're becoming. Every prostration builds patience. 
          Every prayer trains gratitude. Every day of consistency makes you 
          more present for your family, more patient with difficulties, 
          more kind to those around you.
        </Text>
        <View style={styles.rippleChain}>
          <Text style={styles.rippleStep}>🕌 Prayer</Text>
          <Text style={styles.rippleArrow}>→</Text>
          <Text style={styles.rippleStep}>🧠 Character</Text>
          <Text style={styles.rippleArrow}>→</Text>
          <Text style={styles.rippleStep}>👨‍👩‍👧‍👦 Relationships</Text>
          <Text style={styles.rippleArrow}>→</Text>
          <Text style={styles.rippleStep}>🌍 Impact</Text>
        </View>
      </View>

      {/* Milestones */}
      {data.milestones.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Milestones</Text>
          {data.milestones.map((m, i) => (
            <View key={i} style={styles.milestoneCard}>
              <View style={styles.milestoneDot} />
              <View>
                <Text style={styles.milestoneTitle}>{m.title}</Text>
                {m.description && (
                  <Text style={styles.milestoneDesc}>{m.description}</Text>
                )}
                <Text style={styles.milestoneDate}>
                  {new Date(m.achieved_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Behavior Journal */}
      {data.journal.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Reflections</Text>
          {data.journal.map((entry, i) => (
            <View key={entry.id || i} style={styles.journalCard}>
              <Text style={styles.journalType}>{formatEntryType(entry.entry_type)}</Text>
              <Text style={styles.journalContent}>{entry.content}</Text>
              {entry.ai_reflection && (
                <View style={styles.journalReflection}>
                  <Text style={styles.journalReflectionLabel}>🤲 Buddy's reflection:</Text>
                  <Text style={styles.journalReflectionText}>{entry.ai_reflection}</Text>
                </View>
              )}
              <Text style={styles.journalDate}>{new Date(entry.entry_date).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* "Who You're Becoming" Section */}
      <View style={styles.becomingCard}>
        <Text style={styles.becomingTitle}>🤲 Who You're Becoming</Text>
        <Text style={styles.becomingText}>
          Every prayer is a brick in the person you're building. 
          The Prophet ﷺ said prayer prohibits immorality and wrongdoing (Quran 29:45) 
          — meaning the more you pray, the more you naturally become someone who 
          is patient, honest, kind, and present for the people in your life.
        </Text>
        <View style={styles.becomingQuote}>
          <Text style={styles.becomingQuoteText}>
            "Indeed, prayer prohibits immorality and wrongdoing, and the remembrance of Allah is greater."
          </Text>
          <Text style={styles.becomingQuoteRef}>— Quran 29:45</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function formatEntryType(type: string): string {
  const labels: Record<string, string> = {
    daily_reflection: 'Daily Reflection',
    gratitude_note: 'Gratitude',
    kindness_act: 'Kindness',
    patience_moment: 'Patience',
    family_moment: 'Family',
    neighbor_deed: 'Neighbor',
    forgiveness: 'Forgiveness',
    self_improvement: 'Self Improvement',
    goal_setting: 'Goal',
  };
  return labels[type] || type.replace(/_/g, ' ');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F0' },
  loadingText: { marginTop: 12, color: '#6C757D', fontSize: 14 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F0', padding: 40 },
  errorText: { fontSize: 16, fontWeight: '600', color: '#C62828', marginTop: 12 },
  errorSub: { fontSize: 13, color: '#6C757D', marginTop: 8, textAlign: 'center' },
  retryButton: { backgroundColor: '#2D6A4F', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 16 },
  retryText: { color: '#fff', fontWeight: '600' },

  stageBanner: {
    flexDirection: 'row', alignItems: 'center', margin: 16,
    borderRadius: 20, padding: 20, gap: 16,
  },
  stageIcon: { fontSize: 40 },
  stageInfo: { flex: 1 },
  stageTitle: { fontSize: 22, fontWeight: '700', color: '#1B4332' },
  stageDesc: { fontSize: 13, color: '#495057', marginTop: 4, lineHeight: 18 },

  scoreCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 20, padding: 24, alignItems: 'center',
  },
  scoreLabel: { fontSize: 14, color: '#6C757D', fontWeight: '500' },
  scoreValue: { fontSize: 56, fontWeight: '700', marginVertical: 4 },
  scoreRange: { fontSize: 12, color: '#95A5A6' },
  stageProgress: { width: '100%', marginTop: 16 },
  stageProgressLabel: { fontSize: 12, color: '#6C757D', marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: '#E8F5E9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2D6A4F', borderRadius: 3 },

  section: { margin: 16, marginBottom: 0 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332', marginBottom: 8 },
  sectionSub: { fontSize: 13, color: '#6C757D', lineHeight: 18, marginBottom: 12 },

  traitsGrid: { flexDirection: 'row', gap: 10 },
  traitCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    alignItems: 'center',
  },
  traitIcon: { fontSize: 28 },
  traitLabel: { fontSize: 12, color: '#6C757D', marginTop: 4 },
  traitScore: { fontSize: 24, fontWeight: '700', marginVertical: 4 },
  traitBar: { height: 4, backgroundColor: '#E8F5E9', borderRadius: 2, width: '100%', overflow: 'hidden' },
  traitBarFill: { height: '100%', borderRadius: 2 },
  traitTrend: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  emptyTraits: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  emptyText: { color: '#6C757D', fontSize: 13, lineHeight: 20, textAlign: 'center' },

  rippleText: {
    fontSize: 14, color: '#495057', lineHeight: 22,
    backgroundColor: '#E8F5E9', borderRadius: 16, padding: 16,
  },
  rippleChain: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 16, gap: 4, flexWrap: 'wrap',
  },
  rippleStep: { fontSize: 13, fontWeight: '600', color: '#2D6A4F' },
  rippleArrow: { fontSize: 16, color: '#95A5A6' },

  milestoneCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8,
  },
  milestoneDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2D6A4F', marginTop: 4 },
  milestoneTitle: { fontSize: 14, fontWeight: '600', color: '#1B4332' },
  milestoneDesc: { fontSize: 13, color: '#495057', marginTop: 2, lineHeight: 18 },
  milestoneDate: { fontSize: 11, color: '#95A5A6', marginTop: 4 },

  journalCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8,
  },
  journalType: {
    fontSize: 12, fontWeight: '600', color: '#2D6A4F',
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8,
    overflow: 'hidden',
  },
  journalContent: { fontSize: 14, color: '#212529', lineHeight: 20 },
  journalReflection: {
    backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12, marginTop: 10,
  },
  journalReflectionLabel: { fontSize: 11, color: '#795548', fontWeight: '600', marginBottom: 4 },
  journalReflectionText: { fontSize: 13, color: '#795548', lineHeight: 18, fontStyle: 'italic' },
  journalDate: { fontSize: 11, color: '#95A5A6', marginTop: 8 },

  becomingCard: {
    backgroundColor: '#1B4332', margin: 16, borderRadius: 20, padding: 24,
  },
  becomingTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  becomingText: { fontSize: 14, color: '#D4EDDA', lineHeight: 22 },
  becomingQuote: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
    padding: 14, marginTop: 16,
  },
  becomingQuoteText: { fontSize: 13, color: '#A3D4B5', fontStyle: 'italic', lineHeight: 20 },
  becomingQuoteRef: { fontSize: 11, color: '#6C9E7A', marginTop: 4, textAlign: 'right' },
});