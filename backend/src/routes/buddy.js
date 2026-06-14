const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { generateBuddyResponse } = require('../ai-buddy');

// Chat with MyMuslimBuddy
router.post('/:deviceId/chat', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    const user = await query('SELECT id, latitude, longitude, timezone FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found. Register first.' });
    }

    const u = user.rows[0];
    const today = new Date().toISOString().split('T')[0];

    // Gather full user context for the AI
    const [streakResult, todayResult, weekResult, quranResult, lastToneResult, missedResult] = await Promise.all([
      // Current streak
      query(
        `WITH daily_counts AS (
           SELECT prayer_date,
                  COUNT(*) FILTER (WHERE status = 'prayed') = 5 AS all_prayed
           FROM prayer_records WHERE user_id = $1
           GROUP BY prayer_date ORDER BY prayer_date DESC
         )
         SELECT COUNT(*) AS streak FROM (
           SELECT prayer_date, all_prayed,
                  SUM(CASE WHEN all_prayed THEN 0 ELSE 1 END) OVER (ORDER BY prayer_date DESC) AS break_group
           FROM daily_counts
         ) sub WHERE all_prayed = true AND break_group = 0`,
        [u.id]
      ),
      // Today's progress
      query(
        `SELECT COUNT(*) FILTER (WHERE status = 'prayed') AS count FROM prayer_records
         WHERE user_id = $1 AND prayer_date = $2`,
        [u.id, today]
      ),
      // Weekly progress
      query(
        `SELECT COUNT(*) FILTER (WHERE status = 'prayed') AS count FROM prayer_records
         WHERE user_id = $1 AND prayer_date >= $2`,
        [u.id, new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]]
      ),
      // Quran progress
      query(
        `SELECT COUNT(DISTINCT CONCAT(surah_number, ':', ayah_number)) AS count FROM quran_progress WHERE user_id = $1`,
        [u.id]
      ),
      // Last interaction tone
      query(
        `SELECT tone_used FROM ai_interactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [u.id]
      ),
      // Consecutive missed prayers
      query(
        `SELECT COUNT(*) FROM prayer_records WHERE user_id = $1 AND prayer_date = $2 AND status = 'pending'`,
        [u.id, today]
      ),
    ]);

    const streak = parseInt(streakResult.rows[0]?.streak || '0');
    const todayCount = parseInt(todayResult.rows[0]?.count || '0');
    const weekCount = parseInt(weekResult.rows[0]?.count || '0');
    const quranCount = parseInt(quranResult.rows[0]?.count || '0');
    const lastTone = lastToneResult.rows[0]?.tone_used || 'encouraging';
    const missedToday = parseInt(missedResult.rows[0]?.count || '0');

    // Build context for the AI
    const userContext = {
      currentStreak: streak,
      todayProgress: { prayed: todayCount, total: 5, percentage: Math.round((todayCount / 5) * 100) },
      weekProgress: { prayed: weekCount, total: 35, percentage: Math.round((weekCount / 35) * 100) },
      quranProgress: { percentage: Math.round((quranCount / 6236) * 100), lastSurah: null },
      lastInteractionTone: lastTone,
      consecutiveMissedPrayers: missedToday,
      timeOfDay: getTimeOfDay(),
    };

    // Generate AI response
    const aiResult = await generateBuddyResponse('chat', message, userContext);

    // Record the interaction
    await query(
      `INSERT INTO ai_interactions (user_id, context_type, tone_used, user_message, ai_response, metadata)
       VALUES ($1, 'chat', $2, $3, $4, $5)`,
      [u.id, aiResult.tone || 'encouraging', message, aiResult.response || aiResult.fallback?.[0] || '', JSON.stringify(userContext)]
    );

    res.json({
      success: true,
      data: {
        response: aiResult.response || aiResult.fallback?.[0] || 'Assalamu Alaikum! I\'m here to help.',
        tone: aiResult.tone || 'encouraging',
        context: {
          streak,
          todayProgress: `${todayCount}/5`,
          weekProgress: `${Math.round((weekCount / 35) * 100)}%`,
          quranProgress: `${Math.round((quranCount / 6236) * 100)}%`,
        },
        aiAvailable: aiResult.success,
      }
    });
  } catch (err) {
    console.error('[Buddy/Chat] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate a daily tip/ayah/hadith based on context
router.get('/:deviceId/daily-tip', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { type = 'daily_hadith' } = req.query;

    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const today = new Date().toISOString().split('T')[0];

    const [streakResult, todayResult] = await Promise.all([
      query(
        `WITH daily_counts AS (
           SELECT prayer_date, COUNT(*) FILTER (WHERE status = 'prayed') = 5 AS all_prayed
           FROM prayer_records WHERE user_id = $1
           GROUP BY prayer_date ORDER BY prayer_date DESC
         )
         SELECT COUNT(*) AS streak FROM (
           SELECT prayer_date, all_prayed,
                  SUM(CASE WHEN all_prayed THEN 0 ELSE 1 END) OVER (ORDER BY prayer_date DESC) AS break_group
           FROM daily_counts
         ) sub WHERE all_prayed = true AND break_group = 0`,
        [user.rows[0].id]
      ),
      query(
        `SELECT COUNT(*) FILTER (WHERE status = 'prayed') AS count FROM prayer_records
         WHERE user_id = $1 AND prayer_date = $2`,
        [user.rows[0].id, today]
      ),
    ]);

    const userContext = {
      currentStreak: parseInt(streakResult.rows[0]?.streak || '0'),
      todayProgress: { prayed: parseInt(todayResult.rows[0]?.count || '0'), total: 5 },
    };

    const aiResult = await generateBuddyResponse(type, '', userContext);

    res.json({
      success: true,
      data: {
        type,
        content: aiResult.response || null,
        fallback: aiResult.fallback || null,
        aiAvailable: aiResult.success,
      }
    });
  } catch (err) {
    console.error('[Buddy/DailyTip] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get interaction history
router.get('/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 20 } = req.query;

    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const interactions = await query(
      `SELECT context_type, tone_used, user_message, ai_response, metadata, created_at
       FROM ai_interactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [user.rows[0].id, parseInt(limit)]
    );

    res.json({ success: true, data: interactions.rows });
  } catch (err) {
    console.error('[Buddy/History] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 20) return 'evening';
  return 'night';
}

module.exports = router;