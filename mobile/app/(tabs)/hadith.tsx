import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { api } from '../../src/services/api';

type HadithData = {
  arabic: string; translation: string; source: string; sourceArabic: string;
  topic: string; explanation: string; implementation: string; type: string;
};

type SeerahData = {
  title: string; period: string; year: string; story: string;
  lesson: string; application: string; type: string;
};

export default function HadithScreen() {
  const [activeTab, setActiveTab] = useState<'hadith' | 'seerah'>('hadith');
  const [hadith, setHadith] = useState<HadithData | null>(null);
  const [seerah, setSeerah] = useState<SeerahData | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadHadith() {
    setLoading(true);
    try {
      const result = await api.getDailyHadith();
      if (result.success) setHadith(result.data);
    } catch (e) { /* offline */ }
    setLoading(false);
  }

  async function loadSeerah() {
    setLoading(true);
    try {
      const result = await api.getDailySeerah();
      if (result.success) setSeerah(result.data);
    } catch (e) { /* offline */ }
    setLoading(false);
  }

  function switchTab(tab: 'hadith' | 'seerah') {
    setActiveTab(tab);
    if (tab === 'hadith' && !hadith) loadHadith();
    if (tab === 'seerah' && !seerah) loadSeerah();
  }

  // Load default on first visit
  useEffect(() => { loadHadith(); }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Tab Switch */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hadith' && styles.tabActive]}
          onPress={() => switchTab('hadith')}
        >
          <Text style={[styles.tabText, activeTab === 'hadith' && styles.tabTextActive]}>📜 Hadith</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'seerah' && styles.tabActive]}
          onPress={() => switchTab('seerah')}
        >
          <Text style={[styles.tabText, activeTab === 'seerah' && styles.tabTextActive]}>🕋 Seerah</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#2D6A4F" />
          <Text style={styles.loadingText}>
            {activeTab === 'hadith' ? 'Finding a hadith for you...' : 'Traveling back in time...'}
          </Text>
        </View>
      )}

      {activeTab === 'hadith' && hadith && (
        <>
          {/* Hadith Arabic */}
          <View style={styles.hadithCard}>
            <Text style={styles.hadithArabic}>{hadith.arabic}</Text>
            <View style={styles.divider} />
            <Text style={styles.hadithTranslation}>"{hadith.translation}"</Text>
            <Text style={styles.hadithSource}>— {hadith.sourceArabic} ({hadith.source})</Text>
          </View>

          {/* Explanation */}
          <View style={styles.explanationCard}>
            <Text style={styles.sectionLabel}>💡 What this means</Text>
            <Text style={styles.explanationText}>{hadith.explanation}</Text>
          </View>

          {/* Actionable Step */}
          <View style={styles.implementCard}>
            <Text style={styles.sectionLabel}>🎯 Apply today</Text>
            <Text style={styles.implementText}>{hadith.implementation}</Text>
          </View>

          <TouchableOpacity style={styles.moreButton} onPress={loadHadith}>
            <Ionicons name="shuffle" size={18} color="#fff" />
            <Text style={styles.moreButtonText}>Another Hadith</Text>
          </TouchableOpacity>
        </>
      )}

      {activeTab === 'seerah' && seerah && (
        <>
          {/* Seerah Story */}
          <View style={styles.seerahHeader}>
            <Text style={styles.seerahTitle}>{seerah.title}</Text>
            <View style={styles.seerahMeta}>
              <Text style={styles.seerahPeriod}>📅 {seerah.period} Period</Text>
              <Text style={styles.seerahYear}>{seerah.year}</Text>
            </View>
          </View>

          <View style={styles.storyCard}>
            <Text style={styles.storyText}>{seerah.story}</Text>
          </View>

          <View style={styles.lessonCard}>
            <Text style={styles.sectionLabel}>💎 The lesson</Text>
            <Text style={styles.lessonText}>{seerah.lesson}</Text>
          </View>

          <View style={styles.applyCard}>
            <Text style={styles.sectionLabel}>🫂 Apply to your life</Text>
            <Text style={styles.applyText}>{seerah.application}</Text>
          </View>

          <TouchableOpacity style={styles.moreButton} onPress={loadSeerah}>
            <Ionicons name="time-outline" size={18} color="#fff" />
            <Text style={styles.moreButtonText}>Next Story</Text>
          </TouchableOpacity>
        </>
      )}

      {!hadith && !seerah && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>{activeTab === 'hadith' ? '📜' : '🕋'}</Text>
          <TouchableOpacity
            style={[styles.moreButton, { marginTop: 16 }]}
            onPress={activeTab === 'hadith' ? loadHadith : loadSeerah}
          >
            <Text style={styles.moreButtonText}>
              Load {activeTab === 'hadith' ? 'a Hadith' : 'a Seerah Story'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F0' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1B4332',
    padding: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  tabText: { color: '#95A5A6', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  loadingCard: { backgroundColor: '#fff', margin: 20, borderRadius: 20, padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6C757D' },
  hadithCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
  },
  hadithArabic: {
    fontSize: 22,
    lineHeight: 36,
    textAlign: 'right',
    color: '#1B4332',
    writingDirection: 'rtl',
  },
  divider: { height: 1, backgroundColor: '#E8F5E9', marginVertical: 16 },
  hadithTranslation: { fontSize: 16, color: '#212529', lineHeight: 26, fontStyle: 'italic' },
  hadithSource: { fontSize: 13, color: '#6C757D', marginTop: 8, textAlign: 'right' },
  explanationCard: { backgroundColor: '#E8F5E9', marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 8 },
  implementCard: { backgroundColor: '#FFF8E1', marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#1B4332', marginBottom: 8 },
  explanationText: { color: '#2D6A4F', fontSize: 14, lineHeight: 22 },
  implementText: { color: '#795548', fontSize: 14, lineHeight: 22 },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D6A4F',
    marginHorizontal: 16,
    marginBottom: 30,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  moreButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  seerahHeader: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 16, padding: 20 },
  seerahTitle: { fontSize: 20, fontWeight: '700', color: '#1B4332' },
  seerahMeta: { flexDirection: 'row', marginTop: 8, gap: 12 },
  seerahPeriod: { fontSize: 13, color: '#6C757D' },
  seerahYear: { fontSize: 13, color: '#6C757D', fontWeight: '600' },
  storyCard: { backgroundColor: '#fff', margin: 16, marginTop: 8, borderRadius: 16, padding: 20 },
  storyText: { color: '#212529', fontSize: 14, lineHeight: 24 },
  lessonCard: { backgroundColor: '#E8F5E9', marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 8 },
  lessonText: { color: '#2D6A4F', fontSize: 14, lineHeight: 22 },
  applyCard: { backgroundColor: '#FFF8E1', marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16 },
  applyText: { color: '#795548', fontSize: 14, lineHeight: 22 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 64 },
});