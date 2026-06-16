import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { api } from '../../src/services/api';

type SurahInfo = { id: number; name: string; englishName: string; arabicName: string; revelationType: string; ayahs: number; context: string };
type AyahData = { number: number; arabic: string; transliteration: string; translation: string };

export default function QuranScreen() {
  const [ayah, setAyah] = useState<{ surah: SurahInfo; ayah: AyahData } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTranslation, setShowTranslation] = useState(true);

  async function fetchAyah() {
    setLoading(true);
    setError('');
    try {
      const result = await api.getRandomAyah();
      if (result.success) {
        setAyah(result.data);
      }
    } catch (e: any) {
      setError('Could not fetch. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  const revelationIcon = ayah?.surah.revelationType === 'meccan' ? '🏔️' : '🌴';

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>📖 Quran</Text>
        <Text style={styles.headerSub}>One ayah at a time. Read, reflect, grow.</Text>
      </View>

      {/* Main Ayah Card */}
      {!ayah && !loading && (
        <TouchableOpacity style={styles.startCard} onPress={fetchAyah}>
          <Text style={styles.startEmoji}>📖</Text>
          <Text style={styles.startTitle}>Read a random ayah</Text>
          <Text style={styles.startSub}>Tap to begin your daily Quran moment</Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#2D6A4F" />
          <Text style={styles.loadingText}>Seeking an ayah for you...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="cloud-offline" size={24} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAyah}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {ayah && (
        <>
          {/* Surah Info */}
          <View style={styles.surahInfoCard}>
            <Text style={styles.surahName}>{ayah.surah.arabicName}</Text>
            <Text style={styles.surahEnglish}>{ayah.surah.englishName} ({ayah.surah.name})</Text>
            <View style={styles.surahMeta}>
              <Text style={styles.surahMetaText}>{revelationIcon} {ayah.surah.revelationType === 'meccan' ? 'Meccan' : 'Medinan'}</Text>
              <Text style={styles.surahMetaText}>📄 {ayah.surah.ayahs} verses</Text>
              <Text style={styles.surahMetaText}>#️⃣ {ayah.surah.id}:{ayah.ayah.number}</Text>
            </View>
          </View>

          {/* Ayah Display */}
          <View style={styles.ayahCard}>
            <Text style={styles.ayahArabic}>{ayah.ayah.arabic}</Text>
            <Text style={styles.ayahTransliteration}>{ayah.ayah.transliteration}</Text>

            <TouchableOpacity
              style={styles.translationToggle}
              onPress={() => setShowTranslation(!showTranslation)}
            >
              <Text style={styles.translationToggleText}>
                {showTranslation ? 'Hide translation' : 'Show translation'}
              </Text>
              <Ionicons
                name={showTranslation ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#2D6A4F"
              />
            </TouchableOpacity>

            {showTranslation && (
              <Text style={styles.ayahTranslation}>{ayah.ayah.translation}</Text>
            )}
          </View>

          {/* Surah Context */}
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>About {ayah.surah.englishName}</Text>
            <Text style={styles.contextText}>{ayah.surah.context}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.moreButton} onPress={fetchAyah}>
              <Ionicons name="shuffle" size={18} color="#fff" />
              <Text style={styles.moreButtonText}>Another Ayah</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Encouragement */}
      <View style={styles.encouragementCard}>
        <Text style={styles.encouragementText}>
          "The best of you are those who learn the Quran and teach it." — Prophet Muhammad ﷺ
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
  headerCard: {
    backgroundColor: '#1B4332',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '700' },
  headerSub: { color: '#A3D4B5', fontSize: 14, marginTop: 4 },
  startCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  startEmoji: { fontSize: 48 },
  startTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332', marginTop: 12 },
  startSub: { fontSize: 14, color: '#6C757D', marginTop: 4 },
  loadingCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, color: '#6C757D' },
  errorCard: {
    backgroundColor: '#FFEBEE',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  errorText: { color: '#D32F2F', marginTop: 8, marginBottom: 12, textAlign: 'center' },
  retryButton: { backgroundColor: '#D32F2F', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '600' },
  surahInfoCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  surahName: { fontSize: 24, fontWeight: '700', color: '#1B4332', marginBottom: 4 },
  surahEnglish: { fontSize: 14, color: '#6C757D', marginBottom: 10 },
  surahMeta: { flexDirection: 'row', gap: 12 },
  surahMetaText: { fontSize: 12, color: '#6C757D' },
  ayahCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  ayahArabic: {
    fontSize: 28,
    lineHeight: 44,
    textAlign: 'right',
    color: '#1B4332',
    marginBottom: 16,
    fontFamily: 'System',
    writingDirection: 'rtl',
  },
  ayahTransliteration: {
    fontSize: 15,
    color: '#495057',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  translationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 4,
  },
  translationToggleText: { color: '#2D6A4F', fontSize: 13, fontWeight: '500' },
  ayahTranslation: {
    fontSize: 15,
    color: '#212529',
    lineHeight: 24,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
  },
  contextCard: {
    backgroundColor: '#E8F5E9',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  contextTitle: { fontSize: 16, fontWeight: '600', color: '#1B4332', marginBottom: 8 },
  contextText: { color: '#2D6A4F', fontSize: 14, lineHeight: 22 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 16,
    marginTop: 0,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  moreButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  encouragementCard: {
    backgroundColor: '#FFF8E1',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 14,
    marginBottom: 30,
  },
  encouragementText: { color: '#795548', fontSize: 13, lineHeight: 18, textAlign: 'center' },
});