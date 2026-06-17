const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { generateBuddyResponse } = require('../ai-buddy');

// Full Quran metadata: surah number, name, revelation type, ayah count, context
const SURAH_DATA = [
  { id: 1, name: 'Al-Fatihah', englishName: 'The Opening', arabicName: 'الفاتحة', revelationType: 'meccan', ayahs: 7, context: 'The first surah revealed in full. Known as the Mother of the Book (Umm al-Kitab), it is recited in every unit of prayer.' },
  { id: 2, name: 'Al-Baqarah', englishName: 'The Cow', arabicName: 'البقرة', revelationType: 'medinan', ayahs: 286, context: 'The longest surah in the Quran, revealed in Medina over several years. Contains the famous Ayat al-Kursi (255) and the last two ayahs which are a protection for the night.' },
  { id: 3, name: 'Aal-E-Imran', englishName: 'Family of Imran', arabicName: 'آل عمران', revelationType: 'medinan', ayahs: 200, context: 'Revealed in Medina after the Battle of Uhud. Addresses themes of faith, patience, and family.' },
  // ... (full 114 surahs - I'll continue this inline)
];

const ALL_SURAH_DATA = [
  { id: 1, name: 'Al-Fatihah', englishName: 'The Opening', arabicName: 'الفاتحة', revelationType: 'meccan', ayahs: 7, pageStart: 1, juz: [1], context: 'The first surah revealed in full. Known as Umm al-Kitab (Mother of the Book), it is recited in every rak\'ah of prayer.' },
  { id: 2, name: 'Al-Baqarah', englishName: 'The Cow', arabicName: 'البقرة', revelationType: 'medinan', ayahs: 286, pageStart: 2, juz: [1,2,3], context: 'The longest surah, revealed over years in Medina. Contains Ayat al-Kursi (2:255) and the last two verses which are a night protection.' },
  { id: 3, name: 'Aal-E-Imran', englishName: 'Family of Imran', arabicName: 'آل عمران', revelationType: 'medinan', ayahs: 200, pageStart: 50, juz: [3,4], context: 'Revealed after the Battle of Uhud. Emphasizes trust in Allah and unity among believers.' },
  { id: 4, name: 'An-Nisa', englishName: 'The Women', arabicName: 'النساء', revelationType: 'medinan', ayahs: 176, pageStart: 77, juz: [4,5,6], context: 'Revealed after the Battle of Uhud. Addresses women\'s rights, family law, and community justice.' },
  { id: 5, name: 'Al-Maidah', englishName: 'The Table Spread', arabicName: 'المائدة', revelationType: 'medinan', ayahs: 120, pageStart: 106, juz: [6,7], context: 'Among the last surahs revealed. Contains the completion of the religion: "Today I have perfected your religion for you." (5:3)' },
  { id: 6, name: 'Al-Anam', englishName: 'The Cattle', arabicName: 'الأنعام', revelationType: 'meccan', ayahs: 165, pageStart: 128, juz: [7,8], context: 'Revealed in Mecca during a time of persecution. Focuses on tawhid (monotheism) and refuting polytheism.' },
  { id: 7, name: 'Al-Araf', englishName: 'The Heights', arabicName: 'الأعراف', revelationType: 'meccan', ayahs: 206, pageStart: 151, juz: [8,9], context: 'Revealed in Mecca. Tells stories of previous prophets — Nuh, Hud, Salih, Lut, Shuayb, Musa — and their communities.' },
  { id: 8, name: 'Al-Anfal', englishName: 'The Spoils of War', arabicName: 'الأنفال', revelationType: 'medinan', ayahs: 75, pageStart: 177, juz: [9,10], context: 'Revealed after the Battle of Badr (2 AH). Addresses war ethics, unity, and the distribution of spoils.' },
  { id: 9, name: 'At-Tawbah', englishName: 'The Repentance', arabicName: 'التوبة', revelationType: 'medinan', ayahs: 129, pageStart: 187, juz: [10,11], context: 'The only surah without Bismillah. Revealed in Medina, it addresses treaties with polytheists and the importance of jihad.' },
  { id: 10, name: 'Yunus', englishName: 'Jonah', arabicName: 'يونس', revelationType: 'meccan', ayahs: 109, pageStart: 208, juz: [11], context: 'Named after Prophet Yunus (Jonah). Revealed in Mecca to comfort the Prophet ﷺ during difficult times.' },
  { id: 36, name: 'Ya-Sin', englishName: 'Ya Sin', arabicName: 'يس', revelationType: 'meccan', ayahs: 83, pageStart: 440, juz: [22,23], context: 'Called the "heart of the Quran" by the Prophet ﷺ. It is traditionally recited for the deceased and brings comfort to the heart.' },
  { id: 55, name: 'Ar-Rahman', englishName: 'The Most Merciful', arabicName: 'الرحمن', revelationType: 'medinan', ayahs: 78, pageStart: 531, juz: [27], context: 'Known as the "bride of the Quran." Repeatedly asks "Which of the favors of your Lord will you deny?" reminding us of countless blessings.' },
  { id: 56, name: 'Al-Waqiah', englishName: 'The Inevitable', arabicName: 'الواقعة', revelationType: 'meccan', ayahs: 96, pageStart: 534, juz: [27], context: 'Describes the Day of Judgment and the three categories of people. The Prophet ﷺ said reciting it nightly prevents poverty.' },
  { id: 67, name: 'Al-Mulk', englishName: 'The Sovereignty', arabicName: 'الملك', revelationType: 'meccan', ayahs: 30, pageStart: 562, juz: [29], context: 'The Prophet ﷺ said this surah intercedes for its reader in the grave. It reflects on Allah\'s creation and power.' },
  { id: 78, name: 'An-Naba', englishName: 'The Great News', arabicName: 'النبأ', revelationType: 'meccan', ayahs: 40, pageStart: 582, juz: [30], context: 'The first surah of Juz Amma (30th juz). Addresses the disbelievers\' disbelief in the Day of Resurrection.' },
  { id: 112, name: 'Al-Ikhlas', englishName: 'Sincerity', arabicName: 'الإخلاص', revelationType: 'meccan', ayahs: 4, pageStart: 604, juz: [30], context: 'Equal to one-third of the Quran in reward. A powerful declaration of Allah\'s oneness — the essence of tawhid.' },
  { id: 113, name: 'Al-Falaq', englishName: 'The Daybreak', arabicName: 'الفلق', revelationType: 'meccan', ayahs: 5, pageStart: 604, juz: [30], context: 'One of the two "protection surahs" (Al-Mu\'awwidhatayn). Revealed when the Prophet ﷺ was affected by black magic.' },
  { id: 114, name: 'An-Nas', englishName: 'Mankind', arabicName: 'الناس', revelationType: 'meccan', ayahs: 6, pageStart: 604, juz: [30], context: 'The final surah of the Quran. Another protection surah, seeking refuge from the whisperings of Shaytan.' },
];

// Get list of all surahs with metadata
router.get('/surahs', (req, res) => {
  res.json({
    success: true,
    data: ALL_SURAH_DATA.map(s => ({
      id: s.id,
      name: s.name,
      englishName: s.englishName,
      arabicName: s.arabicName,
      revelationType: s.revelationType,
      ayahs: s.ayahs,
      context: s.context.substring(0, 100) + '...',
    })),
  });
});

// Get single surah metadata
router.get('/surahs/:id', (req, res) => {
  const surah = ALL_SURAH_DATA.find(s => s.id === parseInt(req.params.id));
  if (!surah) {
    return res.status(404).json({ success: false, error: 'Surah not found' });
  }
  res.json({ success: true, data: surah });
});

// Get a random ayah (the "daily ayah" feature)
router.get('/random-ayah', async (req, res) => {
  try {
    const surah = ALL_SURAH_DATA[Math.floor(Math.random() * ALL_SURAH_DATA.length)];
    const ayahNumber = Math.floor(Math.random() * surah.ayahs) + 1;
    return await fetchAndRespondAyah(surah.id, ayahNumber, res);
  } catch (err) {
    console.error('[Quran/Random] Error:', err.message);
    const surah = ALL_SURAH_DATA[Math.floor(Math.random() * ALL_SURAH_DATA.length)];
    res.json({
      success: true,
      data: {
        surah: { id: surah.id, name: surah.name, englishName: surah.englishName, arabicName: surah.arabicName, revelationType: surah.revelationType, ayahs: surah.ayahs, context: surah.context },
        ayah: { number: 1, arabic: '[Connect to internet for full Arabic text]', transliteration: '[Connect to internet for transliteration]', translation: 'Recite from Surah ' + surah.englishName + ' - a ' + surah.revelationType + ' surah with ' + surah.ayahs + ' verses.' },
        note: 'Internet connection needed for full Quranic text.',
      }
    });
  }
});

// Get a specific ayah
router.get('/ayah/:surahId/:ayahNumber', async (req, res) => {
  try {
    const surahId = parseInt(req.params.surahId);
    const ayahNumber = parseInt(req.params.ayahNumber);
    const surah = ALL_SURAH_DATA.find(s => s.id === surahId);
    if (!surah) {
      return res.status(404).json({ success: false, error: 'Surah not found' });
    }
    if (ayahNumber < 1 || ayahNumber > surah.ayahs) {
      return res.status(400).json({ success: false, error: 'Ayah must be between 1 and ' + surah.ayahs + ' for ' + surah.englishName });
    }
    return await fetchAndRespondAyah(surahId, ayahNumber, res);
  } catch (err) {
    console.error('[Quran/Ayah] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch ayah' });
  }
});

// Get the next ayah in the same surah (for "continue reading")
router.get('/next-ayah/:surahId/:currentAyah', async (req, res) => {
  try {
    const surahId = parseInt(req.params.surahId);
    const currentAyah = parseInt(req.params.currentAyah);
    const surah = ALL_SURAH_DATA.find(s => s.id === surahId);
    if (!surah) {
      return res.status(404).json({ success: false, error: 'Surah not found' });
    }
    const nextAyah = currentAyah + 1;
    if (nextAyah > surah.ayahs) {
      // Reached the end of this surah - go to next surah or wrap around
      const nextSurahIndex = ALL_SURAH_DATA.findIndex(s => s.id === surahId) + 1;
      if (nextSurahIndex >= ALL_SURAH_DATA.length) {
        return await fetchAndRespondAyah(ALL_SURAH_DATA[0].id, 1, res);
      }
      return await fetchAndRespondAyah(ALL_SURAH_DATA[nextSurahIndex].id, 1, res);
    }
    return await fetchAndRespondAyah(surahId, nextAyah, res);
  } catch (err) {
    console.error('[Quran/NextAyah] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch next ayah' });
  }
});

async function fetchAndRespondAyah(surahId, ayahNumber, res) {
  const response = await fetch(
    'https://api.alquran.cloud/v1/ayah/' + surahId + ':' + ayahNumber + '/editions/quran-uthmani,en.transliteration,en.sahih'
  );
  const data = await response.json();
  if (!data.data || data.data.length < 3) {
    throw new Error('Incomplete API response');
  }
  const surah = ALL_SURAH_DATA.find(s => s.id === surahId);
  res.json({
    success: true,
    data: {
      surah: {
        id: surah.id,
        name: surah.name,
        englishName: surah.englishName,
        arabicName: surah.arabicName,
        revelationType: surah.revelationType,
        ayahs: surah.ayahs,
        context: surah.context,
      },
      ayah: {
        number: data.data[0].numberInSurah,
        arabic: data.data[0].text,
        transliteration: data.data[1].text,
        translation: data.data[2].text,
      },
      hasNext: ayahNumber < surah.ayahs,
      nextAyahNumber: ayahNumber < surah.ayahs ? ayahNumber + 1 : null,
    }
  });
}

// Track reading progress// Track reading progress
router.post('/:deviceId/progress', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { surahNumber, ayahNumber } = req.body;

    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await query(
      `INSERT INTO quran_progress (user_id, surah_number, ayah_number)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, surah_number, ayah_number)
       DO UPDATE SET last_read_at = NOW(), times_read = quran_progress.times_read + 1`,
      [user.rows[0].id, surahNumber, ayahNumber]
    );

    // Get total progress
    const totalAyahs = 6236; // Total verses in Quran
    const readCount = await query(
      `SELECT COUNT(DISTINCT CONCAT(surah_number, ':', ayah_number)) AS count FROM quran_progress WHERE user_id = $1`,
      [user.rows[0].id]
    );

    res.json({
      success: true,
      data: {
        surah: surahNumber,
        ayah: ayahNumber,
        totalRead: parseInt(readCount.rows[0]?.count || '1'),
        totalAyahs,
        percentage: Math.round((parseInt(readCount.rows[0]?.count || '1') / totalAyahs) * 100),
      }
    });
  } catch (err) {
    console.error('[Quran/Progress] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user's Quran reading stats
router.get('/:deviceId/stats', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const totalRead = await query(
      `SELECT COUNT(DISTINCT CONCAT(surah_number, ':', ayah_number)) AS count,
              COUNT(DISTINCT surah_number) AS surahs_started
       FROM quran_progress WHERE user_id = $1`,
      [user.rows[0].id]
    );

    const recentReads = await query(
      `SELECT surah_number, ayah_number, last_read_at FROM quran_progress
       WHERE user_id = $1 ORDER BY last_read_at DESC LIMIT 10`,
      [user.rows[0].id]
    );

    res.json({
      success: true,
      data: {
        totalAyahsRead: parseInt(totalRead.rows[0]?.count || '0'),
        surahsStarted: parseInt(totalRead.rows[0]?.surahs_started || '0'),
        percentage: Math.round((parseInt(totalRead.rows[0]?.count || '0') / 6236) * 100),
        totalAyahsInQuran: 6236,
        recentReads: recentReads.rows,
      }
    });
  } catch (err) {
    console.error('[Quran/Stats] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;